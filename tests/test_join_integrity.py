"""Join integrity: the three CSVs are aligned on week_ending with no duplicates."""

import pandas as pd

FIRST_WEEK = "2026-06-19"
LAST_WEEK = "2026-09-11"
EXPECTED_ROWS = 13


def test_all_three_files_have_13_rows(full_df, notes_df, answers_df):
    assert len(full_df) == EXPECTED_ROWS
    assert len(notes_df) == EXPECTED_ROWS
    assert len(answers_df) == EXPECTED_ROWS


def test_all_three_files_span_the_same_window(full_df, notes_df, answers_df):
    for df in (full_df, notes_df, answers_df):
        assert df["week_ending"].iloc[0] == FIRST_WEEK
        assert df["week_ending"].iloc[-1] == LAST_WEEK


def test_week_endings_align_across_files(full_df, notes_df, answers_df):
    weeks = full_df["week_ending"].tolist()
    assert notes_df["week_ending"].tolist() == weeks
    assert answers_df["week_ending"].tolist() == weeks


def test_no_duplicate_dates_in_any_file(full_df, notes_df, answers_df):
    for name, df in (("full", full_df), ("notes_input", notes_df), ("answers", answers_df)):
        assert df["week_ending"].is_unique, f"duplicate week_ending in {name}.csv"


def test_week_endings_are_sorted_fridays(full_df):
    weeks = pd.to_datetime(full_df["week_ending"])
    assert (weeks.dt.dayofweek == 4).all()  # Friday
    assert weeks.is_monotonic_increasing
    assert (weeks.diff().dropna() == pd.Timedelta(days=7)).all()


def test_answers_prices_match_full_prices(full_df, answers_df):
    pd.testing.assert_series_equal(
        answers_df["wti_price"], full_df["wti_price"], check_names=False
    )


def test_price_move_pct_is_consistent_with_answer_prices(answers_df):
    graded = answers_df.iloc[:-1]
    recomputed = (graded["wti_price_next_week"] / graded["wti_price"] - 1.0) * 100.0
    assert (recomputed - graded["wti_next_week_pct"]).abs().max() < 0.01


def test_notes_and_full_share_one_schema(full_df, notes_df):
    assert notes_df.columns.tolist() == full_df.columns.tolist()
    pd.testing.assert_frame_equal(notes_df, full_df)
