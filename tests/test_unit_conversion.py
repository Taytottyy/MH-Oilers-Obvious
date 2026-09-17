"""Unit conversion: EIA stocks arrive in thousand barrels, the desk uses millions."""

import pandas as pd
import pytest

FIRST_WEEK = "2026-06-19"
LAST_WEEK = "2026-09-11"


def test_thousand_to_million_divides_by_1000(bd):
    series = pd.Series([609219.0, 423429.0, 0.0], index=pd.date_range("2026-01-02", periods=3, freq="W-FRI"))
    converted = bd.convert_thousand_to_million(series)
    assert converted.tolist() == [609.219, 423.429, 0.0]


def test_thousand_to_million_is_exact_on_negative_and_missing(bd):
    series = pd.Series([12345.0, -6789.0, None], index=pd.date_range("2026-01-02", periods=3, freq="W-FRI"))
    converted = bd.convert_thousand_to_million(series)
    assert converted.iloc[0] == pytest.approx(12.345)
    assert converted.iloc[1] == pytest.approx(-6.789)
    assert pd.isna(converted.iloc[2])


def test_committed_stocks_are_in_millions_not_thousands(full_df):
    """The classic silent error is shipping the raw thousand-barrel numbers.

    Published WPSR Table 4 snapshot for the week ending 2026-09-11 lists
    commercial (excluding SPR) crude stocks at 423.429 million barrels; the
    committed file must agree, not read 423429.
    """
    last = full_df.loc[full_df["week_ending"] == LAST_WEEK].iloc[0]
    assert last["crude_stocks_mb"] == pytest.approx(423.429, abs=1e-3)
    assert full_df["crude_stocks_mb"].abs().max() < 2000  # thousand-bbl raw data would read ~423,000


def test_first_window_row_matches_published_snapshot(full_df):
    first = full_df.loc[full_df["week_ending"] == FIRST_WEEK].iloc[0]
    assert first["cushing_stocks_mb"] == pytest.approx(18.957, abs=1e-3)
    assert first["refinery_utilization_pct"] == pytest.approx(96.1, abs=0.05)
