"""Verdict-rule boundary test for the EIA weekly scorer.

15 cases over the +-1% band: both band edges (exactly +-1.00% is Flat),
strictly-beyond moves in both directions, zero, and the sample weeks'
outcomes from data/answers.csv. The scorer skill (skills/scorer.md) states
the rule; this script is the executable form used to confirm it.

Run: python3 scripts/verdict_rule.py  ->  exit 0 when all cases pass.
"""

BAND_PCT = 1.0


def grade(call: str, pct: float) -> str:
    """Grade one committed call against the next-week WTI move.

    call must be a committed BULLISH or BEARISH token; pct is
    wti_next_week_pct. Strictly beyond +1% (BULLISH) or -1% (BEARISH) is
    Right; anything inside the band, including exactly +-1.00%, is Flat.
    """
    if abs(pct) <= BAND_PCT:
        return "Flat"
    moved_with_call = (pct > BAND_PCT and call == "BULLISH") or (
        pct < -BAND_PCT and call == "BEARISH"
    )
    return "Right" if moved_with_call else "Wrong"


CASES = [
    # (case, call, next-week pct, expected verdict)
    ("beyond +1% strict", "BULLISH", 1.01, "Right"),
    ("beyond +1% strict", "BEARISH", 1.01, "Wrong"),
    ("beyond -1% strict", "BULLISH", -1.01, "Wrong"),
    ("beyond -1% strict", "BEARISH", -1.01, "Right"),
    ("inside band, zero", "BULLISH", 0.00, "Flat"),
    ("inside band, zero", "BEARISH", 0.00, "Flat"),
    ("exactly +1.00 is inside", "BULLISH", 1.00, "Flat"),
    ("exactly +1.00 is inside", "BEARISH", 1.00, "Flat"),
    ("exactly -1.00 is inside", "BULLISH", -1.00, "Flat"),
    ("exactly -1.00 is inside", "BEARISH", -1.00, "Flat"),
    ("+6.47% (2026-08-07)", "BULLISH", 6.47, "Right"),
    ("+6.47% (2026-08-07)", "BEARISH", 6.47, "Wrong"),
    ("2026-06-19 outcome", "BULLISH", -9.55, "Wrong"),
    ("2026-07-24 outcome", "BULLISH", -4.59, "Wrong"),
    ("2026-09-04 outcome", "BULLISH", 8.66, "Right"),
]


def main() -> int:
    failures = []
    for name, call, pct, expected in CASES:
        got = grade(call, pct)
        mark = "ok" if got == expected else "FAIL"
        print(f"{mark:4} {name:24} {call:7} {pct:+7.2f} -> {got} (want {expected})")
        if got != expected:
            failures.append(name)
    print(f"\n{len(CASES) - len(failures)}/{len(CASES)} cases green")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
