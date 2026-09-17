"""Skill tooling: the note validator and scorer verdict rule stay honest.

These wrap the two scripts the tuned skills reference, so CI fails if
someone weakens the note shape, the banned-phrase list, the one-row rule,
or the scorer's strict ±1% band.
"""

import validate_note
import verdict_rule


def test_validator_accepts_spec_shape_note():
    note = (
        "HEADLINE:     A 19.8M bbl surprise build against a negative baseline\n"
        "NOTE:\n"
        "1. Crude rose 17.423M bbl against a -2.371M bbl baseline.\n"
        "2. Cushing sits at 22.566M bbl, above the 21.0M bbl band.\n"
        "3. Refinery runs held at 96.2%.\n"
        "CALL:         BEARISH\n"
        "INVALIDATION: wrong if next week's crude change is a draw of more than 2.0M bbl\n"
        "COULDNT_SEE:  Nothing else moved the tape this week.\n"
    )
    assert validate_note.check(note) == []


def test_validator_rejects_hedged_call_and_numberless_bullet():
    note = (
        "HEADLINE:     Inventories moved\n"
        "NOTE:\n"
        "1. Crude stocks changed.\n"
        "2. Cushing sits at 22.566M bbl.\n"
        "3. Refinery runs held at 96.2%.\n"
        "CALL:         could be bearish\n"
        "INVALIDATION: none\n"
        "COULDNT_SEE:  Nothing else.\n"
    )
    defects = validate_note.check(note)
    assert any("could be bearish" in d for d in defects), defects
    assert any("bullet 1 carries no number" in d for d in defects), defects


def test_validator_rejects_banned_phrases():
    note = (
        "HEADLINE:     Mixed signals in crude\n"
        "NOTE:\n"
        "1. Crude rose 17.423M bbl against a -2.371M bbl baseline.\n"
        "2. Cushing sits at 22.566M bbl, above the 21.0M bbl band.\n"
        "3. Refinery runs held at 96.2%.\n"
        "CALL:         BEARISH\n"
        "INVALIDATION: wrong if next week's crude change is a draw of more than 2.0M bbl\n"
        "COULDNT_SEE:  It's worth noting nothing else moved.\n"
    )
    defects = validate_note.check(note)
    assert any(d.startswith("BANNED PHRASE") for d in defects), defects


def test_verdict_rule_exact_band_edge_is_flat():
    assert verdict_rule.grade("BULLISH", 1.00) == "Flat"
    assert verdict_rule.grade("BEARISH", -1.00) == "Flat"


def test_verdict_rule_strictly_beyond_grades():
    assert verdict_rule.grade("BULLISH", 1.01) == "Right"
    assert verdict_rule.grade("BEARISH", 1.01) == "Wrong"
    assert verdict_rule.grade("BEARISH", -1.01) == "Right"
    assert verdict_rule.grade("BULLISH", -1.01) == "Wrong"


def test_verdict_rule_full_boundary_table_green():
    results = [
        verdict_rule.grade(call, pct) == expected
        for _, call, pct, expected in verdict_rule.CASES
    ]
    assert all(results), "verdict-rule boundary cases failed"
    assert len(verdict_rule.CASES) == 15
