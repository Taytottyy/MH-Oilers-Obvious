#!/usr/bin/env python3
"""Mechanical validator for EIA weekly desk notes (tuning session).

Checks every output parses to the spec's fixed shape:
  HEADLINE:  non-empty, one line
  NOTE:      exactly three numbered bullets, each carrying a number
  CALL:      committed BULLISH or BEARISH (first token decides)
  INVALIDATION: contains a checkable number
  COULDNT_SEE:  non-empty
and zero banned phrases (incl. hedged calls) and zero one-row violations
(trend/superlative claims a single input row cannot support).

Usage: validate_note.py <file>  -> exit 0 clean, exit 1 with defect list.
"""
import re
import sys

BANNED_PHRASES = [
    r"mixed\s+signals",
    r"cautious\s+optimism",
    r"it'?s\s+worth\s+noting",
    r"worth\s+noting",
]
BANNED_HEDGES = [
    r"\b(could|may|might)\s+be\s+(bullish|bearish)\b",
    r"\b(could|may|might)\s+(see|get)\s+(upside|downside)\b",
    r"\bwatch\s+for\s+direction\b",
    r"\btilt\s+(bullish|bearish)\b",
]
ONE_ROW_VIOLATIONS = [
    r"\b(largest|biggest|smallest|lowest|highest|most|least)\b",
    r"\b(consecutive|in\s+a\s+row|straight\s+(week|draw|build))\b",
    r"\bof\s+the\s+(quarter|summer|year|month)\b",
    r"\bsince\s+(19|20)\d\d\b",
]


def check(text: str) -> list[str]:
    defects: list[str] = []
    low = text.lower()

    for pat in BANNED_PHRASES + BANNED_HEDGES:
        m = re.search(pat, low)
        if m:
            defects.append(f"BANNED PHRASE: '{m.group(0)}'")

    for pat in ONE_ROW_VIOLATIONS:
        m = re.search(pat, low)
        if m:
            defects.append(f"ONE-ROW VIOLATION: '{m.group(0)}' (not derivable from a single input row)")

    if not re.search(r"^HEADLINE:\s*\S", text, re.MULTILINE):
        defects.append("HEADLINE missing or empty")
    call_line = re.search(r"^CALL:\s*(.*)$", text, re.MULTILINE)
    if not call_line or not re.match(r"(BULLISH|BEARISH)\b", call_line.group(1).strip()):
        defects.append("CALL missing or not a committed BULLISH/BEARISH token")
    else:
        rest = call_line.group(1).strip().split(None, 1)[1] if len(call_line.group(1).strip().split()) > 1 else ""
        if rest and not rest.startswith(("(", "-")):
            defects.append(f"CALL carries trailing hedge text: '{rest[:60]}'")

    inv = re.search(r"^INVALIDATION:\s*(.+)$", text, re.MULTILINE | re.DOTALL)
    if not inv or not re.search(r"\d", inv.group(1)):
        defects.append("INVALIDATION missing or carries no checkable number")

    if not re.search(r"^COULDNT_SEE:\s*\S", text, re.MULTILINE):
        defects.append("COULDNT_SEE missing or empty")

    note_body = text.split("NOTE:", 1)[1] if "NOTE:" in text else ""
    note_body = note_body.split("CALL:", 1)[0]
    bullets = re.findall(r"^\s*(\d)\.\s*(.+)$", note_body, re.MULTILINE)
    if len(bullets) != 3:
        defects.append(f"NOTE has {len(bullets)} numbered bullets, expected exactly 3")
    for idx, (_, body) in enumerate(bullets, 1):
        if not re.search(r"\d", body):
            defects.append(f"NOTE bullet {idx} carries no number")
    nums = [int(i) for i, _ in bullets]
    if nums and nums != [1, 2, 3]:
        defects.append(f"NOTE bullets numbered {nums}, expected [1, 2, 3]")

    return defects


if __name__ == "__main__":
    path = sys.argv[1]
    with open(path) as handle:
        text = handle.read()
    problems = check(text)
    if problems:
        print(f"FAIL {path}")
        for p in problems:
            print(f"  - {p}")
        sys.exit(1)
    print(f"PASS {path}")
