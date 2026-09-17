#!/usr/bin/env python3
"""Build the EIA weekly analyst dataset.

Downloads six weekly series from EIA public spreadsheets (no API key), joins
them on the Friday week-ending date, converts stock units from thousand to
million barrels, computes the 5-year seasonal baseline for the crude change,
and writes three CSVs with a physical notes/answers split:

- data/full.csv         the joined dataset for the fixed 13-week window
- data/notes_input.csv  the analyst lane: no outcome columns, ever
- data/answers.csv      the scorer lane: next-week WTI price and % move

The pinned sources, units, and known data wrinkles are documented in
docs/data-sources.md. The last answers row ships with empty next-week fields:
its successor week (2026-09-18) is outside the fixed window and unpublished,
which is what keeps the 2026-09-11 call open.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

import pandas as pd
import requests
import xlrd

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"

# Fixed 13-week demo window, Friday week endings.
START_WEEK = date(2026, 6, 19)
END_WEEK = date(2026, 9, 11)
EXPECTED_ROW_COUNT = 13

WPSR_BASE_URL = "https://ir.eia.gov/wpsr"
WTI_URL = "https://www.eia.gov/dnav/pet/hist_xls/RWTCw.xls"

# series name -> (file URL, worksheet, source key). Pinned sources and units:
# see docs/data-sources.md. Stocks are thousand barrels (EIA unit code MBBL),
# utilization is percent, WTI is dollars per barrel.
SOURCES: dict[str, tuple[str, str, str]] = {
    "crude_stocks": (f"{WPSR_BASE_URL}/psw01.xls", "Data 1", "WCESTUS1"),
    "cushing_stocks": (f"{WPSR_BASE_URL}/psw04.xls", "Data 1", "W_EPC0_SAX_YCUOK_MBBL"),
    "gasoline_stocks": (f"{WPSR_BASE_URL}/psw05.xls", "Data 1", "WGTSTUS1"),
    "distillate_stocks": (f"{WPSR_BASE_URL}/psw06.xls", "Data 1", "WDISTUS1"),
    "refinery_utilization_pct": (f"{WPSR_BASE_URL}/psw02.xls", "Data 1", "WPULEUS3"),
    "wti_price": (WTI_URL, "Data 1", "RWTC"),
}

STOCK_SERIES = ("crude_stocks", "cushing_stocks", "gasoline_stocks", "distillate_stocks")

FULL_COLUMNS = [
    "week_ending",
    "crude_stocks_mb",
    "crude_change_mb",
    "crude_change_5yr_avg_mb",
    "cushing_stocks_mb",
    "gasoline_stocks_mb",
    "gasoline_change_mb",
    "distillate_stocks_mb",
    "distillate_change_mb",
    "refinery_utilization_pct",
    "wti_price",
]
ANSWER_COLUMNS = ["week_ending", "wti_price", "wti_price_next_week", "wti_next_week_pct"]

# Decimal places written to the CSVs, keyed by column. Stocks arrive in
# thousand barrels at integer precision; millions keep three decimals.
COLUMN_ROUNDING: dict[str, int] = {
    "crude_stocks_mb": 3,
    "crude_change_mb": 3,
    "crude_change_5yr_avg_mb": 3,
    "cushing_stocks_mb": 3,
    "gasoline_stocks_mb": 3,
    "gasoline_change_mb": 3,
    "distillate_stocks_mb": 3,
    "distillate_change_mb": 3,
    "refinery_utilization_pct": 1,
    "wti_price": 2,
}


def fetch_workbook(url: str) -> bytes:
    """Download one EIA workbook. Network lives here, nowhere else."""
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
    response.raise_for_status()
    return response.content


def parse_weekly_series(workbook: bytes, worksheet: str, sourcekey: str) -> pd.Series:
    """Extract one weekly series from an EIA xls workbook.

    EIA weekly workbooks keep a `Sourcekey` row of series keys directly above
    the `Date` row; every data row below is (Excel date serial, value...).
    Returns a float series indexed by normalized Fridays.
    """
    book = xlrd.open_workbook(file_contents=workbook)
    sheet = book.sheet_by_name(worksheet)

    keys = [str(sheet.cell_value(1, col)) for col in range(sheet.ncols)]
    try:
        value_col = keys.index(sourcekey)
    except ValueError as exc:
        raise ValueError(f"source key {sourcekey!r} not found in worksheet {worksheet!r}") from exc

    date_row = next(
        (row for row in range(sheet.nrows) if str(sheet.cell_value(row, 0)) == "Date"),
        None,
    )
    if date_row is None:
        raise ValueError(f"'Date' header row not found in worksheet {worksheet!r}")

    values: dict[pd.Timestamp, float] = {}
    for row in range(date_row + 1, sheet.nrows):
        serial = sheet.cell_value(row, 0)
        if serial == "":
            continue
        day = pd.Timestamp(xlrd.xldate_as_datetime(serial, book.datemode)).normalize()
        raw = sheet.cell_value(row, value_col)
        if raw != "":
            values[day] = float(raw)

    series = pd.Series(values, name=sourcekey).sort_index()
    if series.index.has_duplicates:
        raise ValueError(f"duplicate week-ending dates in series {sourcekey!r}")
    return series


def convert_thousand_to_million(thousand_barrels: pd.Series) -> pd.Series:
    """EIA weekly stocks arrive in thousand barrels; the desk speaks millions."""
    return thousand_barrels / 1000.0


def week_over_week_change(stocks_mb: pd.Series) -> pd.Series:
    """Week-over-week inventory change in million barrels."""
    return stocks_mb.diff()


def five_year_baseline(
    changes: pd.Series, target_week: pd.Timestamp, lookback_years: int = 5
) -> float:
    """Mean of the inventory change for the same ISO calendar week over the
    prior `lookback_years` years.

    Week endings are Fridays, so the ISO week of a Friday is that EIA week.
    A missing prior-year week fails loudly rather than averaging fewer years.
    """
    target_iso = target_week.isocalendar()
    iso_calendar = changes.index.isocalendar()
    picks: list[float] = []
    for offset in range(1, lookback_years + 1):
        prior_year = target_iso.year - offset
        mask = (iso_calendar["year"] == prior_year) & (iso_calendar["week"] == target_iso.week)
        matches = changes[mask.dropna()]
        if len(matches) != 1 or pd.isna(matches.iloc[0]):
            raise ValueError(
                f"cannot compute 5-year baseline for {target_week.date()}: "
                f"no usable change for ISO week {target_iso.week} of {prior_year}"
            )
        picks.append(float(matches.iloc[0]))
    return sum(picks) / len(picks)


def target_weeks() -> pd.DatetimeIndex:
    """The fixed 13-week window, validated against the window constants."""
    weeks = pd.date_range(START_WEEK, END_WEEK, freq="W-FRI")
    if len(weeks) != EXPECTED_ROW_COUNT:
        raise ValueError(
            f"window {START_WEEK}..{END_WEEK} spans {len(weeks)} Fridays, "
            f"expected {EXPECTED_ROW_COUNT}"
        )
    if weeks[0].date() != START_WEEK or weeks[-1].date() != END_WEEK:
        raise ValueError(f"window edges are not Fridays: {START_WEEK}, {END_WEEK}")
    return weeks


def build_full_frame(series: dict[str, pd.Series], weeks: pd.DatetimeIndex) -> pd.DataFrame:
    """Join all series on week-ending date and derive the analyst columns."""
    stocks_mb = {name: convert_thousand_to_million(series[name]) for name in STOCK_SERIES}

    joined = pd.concat(
        {
            "crude_stocks_mb": stocks_mb["crude_stocks"],
            "cushing_stocks_mb": stocks_mb["cushing_stocks"],
            "gasoline_stocks_mb": stocks_mb["gasoline_stocks"],
            "distillate_stocks_mb": stocks_mb["distillate_stocks"],
            "refinery_utilization_pct": series["refinery_utilization_pct"],
            "wti_price": series["wti_price"],
        },
        axis=1,
    )
    window = joined.reindex(weeks)

    missing = window.columns[window.isna().any()].tolist()
    if missing:
        raise ValueError(f"missing values in the target window for: {', '.join(missing)}")

    crude_change = week_over_week_change(stocks_mb["crude_stocks"])
    window["crude_change_mb"] = crude_change.reindex(weeks)
    window["crude_change_5yr_avg_mb"] = [
        five_year_baseline(crude_change, week) for week in weeks
    ]
    window["gasoline_change_mb"] = week_over_week_change(stocks_mb["gasoline_stocks"]).reindex(weeks)
    window["distillate_change_mb"] = week_over_week_change(stocks_mb["distillate_stocks"]).reindex(weeks)

    window = window.reset_index().rename(columns={"index": "week_ending"})
    return window[FULL_COLUMNS]


def build_answers_frame(series: dict[str, pd.Series], weeks: pd.DatetimeIndex) -> pd.DataFrame:
    """The scorer lane: release-week price, next-week price, percent move.

    Next-week fields come from the following row of the fixed window, so the
    final week (2026-09-11) ships blank — its outcome week is outside the
    window and unpublished, keeping that call open.
    """
    answers = pd.DataFrame({"week_ending": weeks})
    wti = series["wti_price"].reindex(weeks)
    next_week = wti.shift(-1)
    answers["wti_price"] = wti.round(2).to_numpy()
    answers["wti_price_next_week"] = next_week.round(2).to_numpy()
    answers["wti_next_week_pct"] = ((next_week / wti - 1.0) * 100.0).round(2).to_numpy()
    return answers[ANSWER_COLUMNS]


def write_csv(full: pd.DataFrame, answers: pd.DataFrame) -> None:
    """Persist the three files. Rounding happens here at the write edge; the
    analyst lane (notes_input.csv) is cut from the rounded full frame so the
    two files stay value-identical under the shared schema."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    full_out = full.copy()
    for column, digits in COLUMN_ROUNDING.items():
        full_out[column] = full_out[column].round(digits)
    full_out["week_ending"] = full_out["week_ending"].dt.strftime("%Y-%m-%d")
    notes_out = full_out[FULL_COLUMNS].copy()
    answers_out = answers.copy()
    answers_out["week_ending"] = answers_out["week_ending"].dt.strftime("%Y-%m-%d")

    full_out.to_csv(DATA_DIR / "full.csv", index=False)
    notes_out.to_csv(DATA_DIR / "notes_input.csv", index=False)
    answers_out.to_csv(DATA_DIR / "answers.csv", index=False, na_rep="")


def main() -> int:
    weeks = target_weeks()
    series = {
        name: parse_weekly_series(fetch_workbook(url), worksheet, sourcekey)
        for name, (url, worksheet, sourcekey) in SOURCES.items()
    }
    full = build_full_frame(series, weeks)
    answers = build_answers_frame(series, weeks)
    write_csv(full, answers)

    last_week = full["week_ending"].max().strftime("%Y-%m-%d")
    print(f"{len(full)} rows through {last_week}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
