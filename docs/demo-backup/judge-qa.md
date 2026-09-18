# Liz's demo kit — scorecard beat + the miss

Two beats, ~45 seconds total. Numbers below are the real EIA figures (verified
from eia.gov and matching the repo's merged `data/` CSVs).

## Beat 3 — the scorecard (~15s)

> "And here's every call it's made — twelve weeks, graded against what
> actually happened."

Show: Scorecard view. Point at the hit-rate number, then the Wrong column.

If a judge asks how the number is computed: **Right ÷ (Right + Wrong)**. Flat
weeks don't count either way, and the open 2026-09-11 call isn't graded yet.
(In this window every week moved >2.5%, so there are no Flats — say that only
if asked.)

## Beat 4 — the miss (~30s)

> "This one it got wrong. Crude built 17 million barrels — way more than
> normal for this week — which should be bearish. Oil went up 6.5% anyway.
> Here's what the model missed."

Show: Note detail for **2026-08-07**, then the `why` cell.

The exact numbers, in case the view is slow to load:

| | |
|---|---|
| Crude change, week ending 08-07 | **+17.4M bbl** (406.99 → 424.41M) |
| 5-yr average for this calendar week | **−2.4M bbl** (so ~20M vs seasonal) |
| Cushing | 20.96 → **22.57M** (+1.6M, off tank-bottoms) |
| Refinery utilization | 96.2% (down from 96.5%) |
| Gasoline / distillate change | −1.0M / flat |
| WTI at release | $78.94 |
| WTI a week later | $84.05 → **+6.5%** |

The honest explanation to have ready: the release is backward-looking and
the market had already traded the build; what moved price the following week
was outside the report (the note's `couldnt_see` list — consensus, SPR flows,
demand). That's the point of the beat: the agent names what it couldn't see
instead of pretending it could.

Second miss to know, if asked for another: **2026-07-24** — a 7.2M draw at
97.2% refinery runs (a mechanical draw), then WTI fell 4.6%. The inverse
surprise.

## Closing line (either of you)

> "This is research and paper trading. It doesn't place trades — it hands a
> trader a two-minute head start and a track record they can check."

## Judge Q&A — rehearsed answers

**"Does this place real trades?"** — No, by design. It produces analysis for
a human to review. No broker connection, no order execution, no live money.

**"How do you know the agent didn't peek at the answer?"** — Structurally. The
note-writer reads `notes_input.csv`, which has no outcome column at all; the
next-week price lives only in `answers.csv`, which only the scorer reads.
It's a file boundary, not a prompt instruction.

**"Isn't 12 weeks a tiny sample?"** — Yes. The point isn't the hit rate, it's
that there *is* one, it's auditable, and the misses are explained in the
agent's own numbers. It keeps grading itself every Wednesday.

**"Why is the scorecard not 12-for-12?"** — Because it's real. A scorecard
with no misses is the one nobody believes.

## Backup if Obvious hangs

Screenshots of all four screens (release, Slack note, scorecard, 08-07
detail) — take them by 1:50. Phone photos are fine.
