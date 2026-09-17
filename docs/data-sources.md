# Data sources

Every series the build consumes is a public EIA spreadsheet. No API key, no
token — plain HTTP GETs of static files. `scripts/build_dataset.py` pins each
source in its `SOURCES` table; this document records the same pins, the units,
the derived fields, and the data wrinkles the desk should know about.

## The six series

| # | Series | Pinned file | Worksheet | Source key | Native units |
|---|--------|-------------|-----------|------------|--------------|
| 1 | Crude stocks excluding SPR | <https://ir.eia.gov/wpsr/psw01.xls> | `Data 1` | `WCESTUS1` | Thousand barrels |
| 2 | Cushing, OK stocks | <https://ir.eia.gov/wpsr/psw04.xls> | `Data 1` | `W_EPC0_SAX_YCUOK_MBBL` | Thousand barrels |
| 3 | Total motor gasoline stocks | <https://ir.eia.gov/wpsr/psw05.xls> | `Data 1` | `WGTSTUS1` | Thousand barrels |
| 4 | Distillate fuel oil stocks | <https://ir.eia.gov/wpsr/psw06.xls> | `Data 1` | `WDISTUS1` | Thousand barrels |
| 5 | Refinery utilization | <https://ir.eia.gov/wpsr/psw02.xls> | `Data 1` | `WPULEUS3` | Percent |
| 6 | WTI spot price (weekly) | <https://www.eia.gov/dnav/pet/hist_xls/RWTCw.xls> | `Data 1` | `RWTC` | Dollars per barrel |

Full series titles, as they appear in each workbook's header row:

- `WCESTUS1` — "Weekly U.S. Ending Stocks excluding SPR of Crude Oil (Thousand Barrels)"
- `W_EPC0_SAX_YCUOK_MBBL` — "Weekly Cushing, OK Ending Stocks excluding SPR of Crude Oil (Thousand Barrels)"
- `WGTSTUS1` — "Weekly U.S. Ending Stocks of Total Gasoline (Thousand Barrels)"
- `WDISTUS1` — "Weekly U.S. Ending Stocks of Distillate Fuel Oil (Thousand Barrels)"
- `WPULEUS3` — "Weekly U.S. Percent Utilization of Refinery Operable Capacity (Percent)"
- `RWTC` — "Weekly Cushing, OK WTI Spot Price FOB (Dollars per Barrel)"

The five WPSR workbooks are the Weekly Petroleum Status Report tables listed
on <https://www.eia.gov/petroleum/supply/weekly/> (psw01 = Table 1 "U.S.
Petroleum Balance Sheet", psw02 = Table 2 "U.S. Inputs and Production by PAD
District", psw04 = Table 4 "Stocks of Crude Oil by PAD District…", psw05 =
Table 5 "Stocks of Total Motor Gasoline and Fuel Ethanol…", psw06 = Table 6
"Stocks of Distillate, Kerosene-Type Jet Fuel…"). Each is a multi-series
workbook: row 2 of the data sheet is a `Sourcekey` row, row 3 is the `Date`
row, and the rows below are one observation per Friday. The build locates the
series by source key, not by row position, so EIA reshuffling rows cannot
silently remap a column.

## History depth

Weekly observations run: psw01/psw02/psw04/psw06 from 1982-08-20, psw05 from
1983-01-07, RWTC from 1986-01-03 — all through 2026-09-11 in the files
retrieved for this build. Five-year baselines need far less depth, so a
missing prior year is a data problem, not a coverage problem: the build fails
loudly rather than average over fewer years.

## The thousand → million conversion

EIA publishes stocks in **thousand barrels** (the source-key suffix `MBBL` is
EIA's unit code for thousand barrels — do not read it as millions). The desk
speaks millions, so the build divides stock series by 1000 and suffixes those
columns `_mb`. Utilization (percent) and WTI (dollars per barrel) are used
as-is. The conversion is the classic silent error, so it is unit-tested
against published snapshots: the week ending 2026-09-11 shows commercial crude
at 423.429 million barrels, matching the WPSR Table 4 CSV snapshot
(<https://ir.eia.gov/wpsr/table4.csv>, "Commercial (Excluding SPR)") exactly —
and not 423,429.

## Derived fields

- `crude_change_mb` — crude stocks this week minus crude stocks last week.
- `crude_change_5yr_avg_mb` — the mean of the week-over-week change for the
  **same ISO calendar week** in each of the prior five years. EIA weeks end
  Friday, so a week-ending Friday belongs to that ISO week; the baseline for
  2026-08-07 (ISO week 32) averages the changes of the ISO-week-32 Fridays of
  2025, 2024, 2023, 2022, and 2021. A missing prior-year week raises an error
  instead of quietly averaging four years.
- `wti_next_week_pct` — `(price_next_week / price − 1) × 100`, rounded to two
  decimals. In `answers.csv` only; see the split below.

## The notes/answers split

`data/notes_input.csv` (the analyst lane) and `data/answers.csv` (the scorer
lane) are separate files, and `notes_input.csv` contains no outcome column —
no `next`, `answer`, or `outcome` field of any name. A pytest split-guard
(`tests/test_split_guard.py`) fails the build if a leak ever appears. The
last `answers.csv` row (week ending 2026-09-11) ships with blank
`wti_price_next_week` / `wti_next_week_pct`: its outcome week, 2026-09-18,
falls outside the fixed 13-week window (and is unpublished at build time —
the Sep. 23, 2026 release covers it). That row is the demo's open call.

## How the WTI file was verified

`RWTCw.xls` is the weekly download behind EIA's spot-price history page for
series RWTC (<https://www.eia.gov/dnav/pet/hist/RWTCw.htm> — "Cushing, OK WTI
Spot Price FOB, Weekly"). Verified on 2026-09-17 without an API key:

1. `GET https://www.eia.gov/dnav/pet/hist_xls/RWTCw.xls` returned HTTP 200,
   130,048 bytes, `Content-Type: application/vnd.ms-excel`, with a
   `Last-Modified` of Wed, 16 Sep 2026 15:30 UTC — i.e. refreshed with the
   latest WPSR release (Sep. 16, 2026).
2. Parsed the workbook: source key `RWTC`, 2,103 weekly observations of
   Fridays from 1986-01-03 to 2026-09-11; the last value, 99.08 dollars per
   barrel, is the week ending 2026-09-11.

The dnav host serves the same series as `RWTCd.xls` (daily) and `RWTCm.xls`
(monthly); the build pins the weekly file so no aggregation is needed.

## Holiday, SPR, and other wrinkles

- **SPR**: `WCESTUS1` excludes the Strategic Petroleum Reserve by definition.
  The same sheet also carries `WCRSTUS1` (total including SPR) and
  `WCSSTUS1` (SPR only). The desk tracks the commercial number — SPR is a
  policy flow, not a market inventory signal, and the note-writer lists it
  under what it couldn't see.
- **Cushing's home table**: Cushing is published inside the crude-stocks
  table (psw04, alongside the PADD breakdowns), not as its own file. The
  build still reads it by source key.
- **Holiday weeks**: EIA keys every row by its Friday week-ending date, so
  releases that shift around holidays stay aligned in the join. A genuinely
  missing week (occasional in the 1980s; none in the 2021–2026 window) makes
  the build fail loudly rather than interpolate.
- **Early-year irregularity**: the oldest rows (1982–83) include irregular
  gaps; the build never touches them (the window is 2026 and the baseline
  looks back to 2021).
- **Revisions**: EIA can revise recent weeks. The committed CSVs are the
  dataset of record for the demo; a rebuild overwrites them deterministically.
- **Sep. 23, 2026 WPSR update** (per the notice on the WPSR page when this
  was built): EIA will add a commercial-crude-stocks table at the top of the
  page and replace the Highlights PDF — "no changes to existing data files",
  so the pinned URLs above are unaffected.

## Cross-checks baked into the repo

- `tests/test_unit_conversion.py` — committed stocks are in millions and
  match published Table 4 snapshots for the window's first and last weeks.
- `tests/test_baseline_math.py` — the 2026-08-07 centerpiece week: a
  +17.423M bbl build against a −2.371M five-year baseline (the plan's ~+17.4
  vs ~−2.4); the 2026-07-24 inverse surprise is a −7.167M draw.
- `tests/test_join_integrity.py` — all three files align row-for-row on 13
  Friday week-endings, 2026-06-19 through 2026-09-11, no duplicates, and
  `answers.csv` prices match `full.csv` prices.
