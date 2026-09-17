"""Split guard: the analyst lane must never see outcome data.

The hit rate is only credible because notes_input.csv structurally cannot
carry the answer key. If any of these tests fail, the track record is void.
"""

import re

import pytest

OUTCOME_COLUMN_PATTERN = re.compile(r"next|answer|outcome", re.IGNORECASE)


def test_notes_input_has_no_outcome_column(notes_df):
    offenders = [column for column in notes_df.columns if OUTCOME_COLUMN_PATTERN.search(column)]
    assert offenders == [], f"notes_input.csv leaks outcome columns: {offenders}"


def test_notes_input_does_not_carry_any_answer_column_name(bd, notes_df):
    # week_ending (join key) and wti_price (current-week input) are legitimate;
    # only the outcome columns are banned.
    outcome_columns = [c for c in bd.ANSWER_COLUMNS if OUTCOME_COLUMN_PATTERN.search(c)]
    assert set(outcome_columns) == {"wti_price_next_week", "wti_next_week_pct"}
    for column in outcome_columns:
        assert column not in notes_df.columns


def test_answers_blank_next_week_fields_only_on_final_row(answers_df):
    graded = answers_df.iloc[:-1]
    assert graded["wti_price_next_week"].notna().all(), "a graded week is missing its next-week price"
    assert graded["wti_next_week_pct"].notna().all(), "a graded week is missing its percent move"

    open_row = answers_df.iloc[-1]
    assert open_row["week_ending"] == "2026-09-11"
    assert open_row["wti_price"] == open_row["wti_price"]  # the release price itself is present
    assert open_row["wti_price_next_week"] != open_row["wti_price_next_week"]  # NaN is never equal to itself
    assert open_row["wti_next_week_pct"] != open_row["wti_next_week_pct"]


@pytest.mark.parametrize("lane_frame", ["full", "notes"])
def test_lane_files_never_gain_an_outcome_column(lane_frame, full_df, notes_df):
    df = full_df if lane_frame == "full" else notes_df
    offenders = [column for column in df.columns if OUTCOME_COLUMN_PATTERN.search(column)]
    assert offenders == []
