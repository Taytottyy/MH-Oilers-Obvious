# Tuning log — note-writer and scorer skills

Session: 2026-09-17 (UTC) · Task: author + tune the analyst and scorer skills (todo_775NW9SF) · Source data: `data/notes_input.csv` and `data/answers.csv`, 13 weeks through 2026-09-11, built by `scripts/build_dataset.py` (PR #3, merged at `77d9980`).

Discipline (from the project plan): read every output aloud against the quality checklist; for each issue make exactly one change to the skill; re-run before making another; sample more than one kind of week, because a skill that works on a calm week can still fail on a surprising one.

Mechanical validation: every run was parsed by a validator script (`scripts/validate_note.py`) that checks the spec's fixed shape — HEADLINE present; NOTE exactly three numbered bullets, each carrying a number; CALL a committed BULLISH or BEARISH token; INVALIDATION containing a checkable number; COULDNT_SEE present — plus zero banned phrases ("mixed signals", "cautious optimism", "it's worth noting", hedged-call variants) and zero one-row violations (rankings and streak claims a single input row cannot support). Parse-clean is not pass-clean: the read-aloud check below failed runs the validator let through, which is the point of doing both.

## Note-writer — three changes over nine runs

| Run | Week | Skill | Mechanical | Read-aloud | Issue found | The one change |
|---|---|---|---|---|---|---|
| R1 | 2026-06-19 | v0 (repo) | PASS | FAIL | Bullet 2 cites the rulebook — "the desk weights above the national change" tells the trader how the note was made, not what the market did | C1: add the desk-voice rule |
| R2 | 2026-06-19 | v1 | PASS | PASS | — | (advance to a new week) |
| R3 | 2026-07-24 | v1 | FAIL | FAIL | Bullet 1 claims "the largest draw of the summer" — a ranking one input row cannot support | C2: add the one-row rule |
| R4 | 2026-07-24 | v2 | PASS | PASS | — | (advance to the centerpiece) |
| R5 | 2026-08-07 | v2 | PASS | FAIL | Bullet 3 argues with its own BEARISH call ("temper the surplus read… the one argument against the bearish case"); root cause is heuristic 4: "within a couple million barrels of ~20M" is not a checkable boundary and is silent when Cushing is above the zone | C3: rewrite heuristic 4 as a checkable band with an ample-side default |
| R6 | 2026-08-07 | v3 | PASS | PASS | — | (extend to a fourth week) |
| R7 | 2026-09-04 | v3 | PASS | PASS | — | (freeze v3) |
| R8 | 2026-06-19 | v3 | PASS | PASS | final re-run so every published example comes from the final skill | — |
| R9 | 2026-07-24 | v3 | PASS | PASS | final re-run | — |

The changes:

- **C1 (v0 → v1), desk voice.** One rule added to the output rules: "Write in desk voice. The note never mentions the skill, its heuristics, or the rules it follows — every line is a claim about the market, not about how the note was made." The v0 skill's heuristics were leaking into the notes as filler, which is exactly the AI-tell the banned-phrase list exists to stop.
- **C2 (v1 → v2), one-row rule.** One rule added: "Every number in the note comes from the single input row. No trend, streak, or ranking claims ('third straight draw', 'largest of the summer') — one row cannot support them." The run that forced it (2026-07-24) reached for a ranking because the deep draw invited one; the single-row input contract already forbade it, but only in the setup paragraph, where a runner under time pressure will not look.
- **C3 (v2 → v3), checkable Cushing band.** Heuristic 4 rewritten: the tank-bottom band is Cushing at or below 21.0M bbl (the ~20M bbl working-storage floor plus a small buffer); inside the band Cushing outweighs the national change, above it the change-vs-baseline gap decides alone. The old text ("within a couple million barrels of ~20M") fired on the 2026-08-07 centerpiece (Cushing 22.566M bbl) and gave the ample side no reading, so the note hedged a clean surplus signal. The 21.0M edge is set from input-row geometry — the scarcity-side prints (18.599M, 18.957M bbl) sit well inside it, the ample-side prints (21.824M, 22.566M bbl) well outside — not from any outcome.

Version deltas, verified by diff: v0→v1 adds 3 lines; v1→v2 adds 3 lines; v2→v3 replaces one heuristic (5 lines become 7). No other bytes move.

## Scorer — two changes over three dry-runs

| Dry-run | Skill | Result | Issue found | The one change |
|---|---|---|---|---|
| D1 | v0 (repo) | Verdict logic confirmed — BEARISH against a +6.47% move is Wrong — but the invalidation check is BLOCKED | The note's invalidation names next week's crude change; `answers.csv` carries price fields only, and the v0 skill forbids itself `notes_input.csv` outright, so a check the spec's own example requires cannot run | S1: allow the following week's inventory row from `data/full.csv`, inventory columns only, for the invalidation check |
| D2 | v1 | Full graded row completes; `why` passes the number rule; ±1% boundary test 15/15 green | The v0 example `why` calls Cushing 22.6M bbl "approaching tank-bottoms" — contradicting the tuned ≤21.0M band it now grades against | S2: align the example `why` with the band; state CALL is read as its first token |
| D3 | v2 | Same graded row; boundary test still 15/15 | — | — |

The ±1% boundary test (`scripts/verdict_rule.py`): 15 cases covering both band edges (exactly ±1.00% is Flat), strictly-beyond moves in both directions, zero, and the four sample weeks' outcomes. All green after every change.

## Firewall and honesty notes

- `notes_input.csv` contains no outcome columns (the repo's split-guard test enforces this in CI), and every note above was written from its single input row. `answers.csv` entered the session only at the scorer dry-runs, after all note text was final; no note-writer change was made after any call was graded.
- Every tuning change is justified by a defect visible in the input row alone — a rulebook citation, an unsupportable ranking, an ambiguous band. None was made to move a call.
- The operator ran this session with both files in view; what keeps the record honest is the structural split (physical files, CI split-guard, one-row output rule), not operator discipline. That is the spec's own design position.
- For the record: the four validated sample calls grade 1 Right / 3 Wrong (grading is the scorer's job; see the scorer skill document). A tuning pass that had chased outcomes could not have produced that record — and the plan expects exactly this kind of honest miss on 2026-08-07.
