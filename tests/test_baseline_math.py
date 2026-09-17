"""5-year baseline math: mean of the same-calendar-week change over the prior five years."""

import pandas as pd
import pytest


def friday_changes(changes_by_year: dict[int, float], week: int) -> pd.Series:
    """Build a weekly change series containing one Friday per requested year/week."""
    entries = {}
    for year, value in changes_by_year.items():
        # Inverse of ISO-week-Friday: find the Friday of ISO week `week` in `year`.
        day = pd.Timestamp(year=year, month=1, day=4)  # Jan 4 is always in ISO week 1
        start = day - pd.Timedelta(days=day.isocalendar().weekday - 1)  # Monday of week 1
        friday = start + pd.Timedelta(weeks=week - 1, days=4)
        entries[friday] = value
    return pd.Series(entries).sort_index()


def test_baseline_averages_the_five_prior_same_week_changes(bd):
    changes = friday_changes({2025: 2.0, 2024: 3.0, 2023: -1.0, 2022: 4.0, 2021: 5.0}, week=1)
    target = pd.Timestamp("2026-01-02")  # Friday of ISO week 1, 2026
    assert bd.five_year_baseline(changes, target) == pytest.approx((2.0 + 3.0 - 1.0 + 4.0 + 5.0) / 5)


def test_baseline_uses_calendar_week_not_neighboring_weeks(bd):
    # Week 32 of each prior year has a huge draw; neighbouring weeks are calm.
    # If the baseline grabbed the wrong weeks the mean would not be -1.0.
    changes = friday_changes({2025: -10.0, 2024: -10.0, 2023: -10.0, 2022: -10.0, 2021: -10.0}, week=32)
    calm = friday_changes({2025: 1.0, 2024: 1.0, 2023: 1.0, 2022: 1.0, 2021: 1.0}, week=31)
    changes = pd.concat([calm, changes]).sort_index()
    target = pd.Timestamp("2026-08-07")  # Friday of ISO week 32, 2026
    assert bd.five_year_baseline(changes, target) == pytest.approx(-10.0)


def test_baseline_fails_loudly_when_a_prior_year_is_missing(bd):
    changes = friday_changes({2025: 2.0, 2024: 3.0, 2023: -1.0, 2022: 4.0}, week=26)  # 2021 absent
    with pytest.raises(ValueError, match="2021"):
        bd.five_year_baseline(changes, pd.Timestamp("2026-06-26"))


def test_week_over_week_change_diffs_consecutive_fridays(bd):
    stocks = pd.Series(
        [100.0, 103.5, 101.5], index=pd.date_range("2026-01-02", periods=3, freq="W-FRI")
    )
    change = bd.week_over_week_change(stocks)
    assert pd.isna(change.iloc[0])
    assert change.iloc[1] == pytest.approx(3.5)
    assert change.iloc[2] == pytest.approx(-2.0)


def test_committed_centerpiece_baseline_matches_published_anchor(full_df):
    """The plan's centerpiece week: a 17.4M bbl build against a ~-2.4M baseline."""
    week = full_df.loc[full_df["week_ending"] == "2026-08-07"].iloc[0]
    assert week["crude_change_mb"] == pytest.approx(17.423, abs=1e-3)
    assert week["crude_change_5yr_avg_mb"] == pytest.approx(-2.371, abs=1e-3)
