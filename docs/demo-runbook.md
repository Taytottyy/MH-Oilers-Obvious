# Demo runbook — four beats, ~11 minutes

The verbatim script for demoing the EIA weekly analyst agent. The arc: a
release lands, the agent commits a call, the tape grades it, and the record
keeps the miss. Say the lines as written — they are rehearsed. Every number
in this script is real and checkable in this repo: `data/notes_input.csv`,
`data/answers.csv`, `data/full.csv`.

Before you start (2 minutes, no network needed — the repo ships the
13-week snapshot in `data/`):

- Repo checked out; `pip install -r scripts/requirements.txt` done.
- The **EIA Analyst** workbook open on the Notes sheet (the 13-week
  backfilled record — the backfill is never cut, see below).
- The demo assets staged: the workbook dashboard, the 13-week timeline view,
  and the Slack-ready post. All three are cuttable; the runbook says in what
  order.
- The **live scorecard** open at
  https://taytottyy.github.io/MH-Oilers-Obvious/ — the deployed version of
  `web/` (GitHub Pages). A zero-setup fallback if the local workbook isn't
  staged.

**The beat order never changes:** release → note → scorecard → the miss.

---

## Beat 1 — The release (≈2 min)

**Show:** `data/notes_input.csv`, one row — 2026-08-07. Optionally
`docs/data-sources.md` for the six pinned sources.

**Say:**

> Every Wednesday morning the EIA publishes the Weekly Petroleum Status
> Report. Six public spreadsheets — crude stocks, Cushing, gasoline,
> distillate, refinery utilization, and the weekly WTI price — get pulled
> into one row per week. No API key, no scraping; the pipeline pins the exact
> workbooks and rebuilds the whole 13-week dataset with one command.
>
> This row is everything the analyst gets to see: the week ending 2026-08-07.
> Crude built 17.4 million barrels against a five-year baseline of minus 2.4
> — a 19.8 million barrel surprise. Cushing sits at 22.6 million barrels.
> WTI closed the week at $78.94.
>
> And here is the rule that makes everything downstream honest: this file has
> no outcome columns. Next week's price doesn't exist in the analyst's world
> yet — a test in CI breaks the build if it ever does. The note must be
> writable the morning the release lands.

**Do:** if the network is up and you want the live flourish, run
`python scripts/build_dataset.py` and show the `N rows through …` line.
If not, the snapshot on disk already proves the pipeline.

---

## Beat 2 — The note (≈3 min)

**Show:** the note below (paste it into a file, e.g. `/tmp/2026-08-07.txt`),
then the validator.

**Say:**

> The note-writer's job: turn that one row into a note a trader can read in
> thirty seconds. Fixed shape — a headline that makes a claim, exactly three
> numbered bullets that each carry a number, a call that commits, a numeric
> invalidation, and the blind spots named. It cannot hedge, it cannot rank
> ("largest draw of the summer" is a defect — one row can't support it), and
> it never explains its own rules in the note.

Read the 2026-08-07 note aloud:

```
HEADLINE:     A 19.8M bbl surprise build against a negative baseline — the kind of number that usually sells off
NOTE:         1. Crude built 17.423M bbl against a 5-yr average change of −2.371M bbl — a 19.794M bbl gap versus what this week normally delivers.
              2. Products did not absorb it: gasoline drew 0.968M bbl and distillate was flat (−0.010M bbl), so the build sits in tanks rather than in the supply chain.
              3. Cushing at 22.566M bbl is above the 21.0M bbl tank-bottom band — hub storage is ample, so the baseline gap makes the call on its own.
CALL:         BEARISH
INVALIDATION: wrong if next week's crude change is a draw of more than 2.0M bbl
COULDNT_SEE:  consensus expectations, SPR flows, demand data, positions
```

> Every note passes a mechanical validator before it lands — shape, bullets,
> banned phrases like "mixed signals", numberless bullets, hedged calls. Then
> a human reads it aloud against the same checklist. Both gates, every week.

**Do:**

```bash
python scripts/validate_note.py /tmp/2026-08-07.txt    # → PASS /tmp/2026-08-07.txt
```

---

## Beat 3 — The scorecard (≈3 min)

**Show:** the workbook's Notes sheet (or the dashboard, if it survived the
cut order); `data/answers.csv` row `2026-08-07,78.94,84.05,6.47`.

**Say:**

> A week later, the scorer grades the call. The rule is a strict ±1% band:
> WTI has to move beyond one percent in the called direction. Exactly plus or
> minus 1.0 is Flat — and Flat is not a win. The scorecard doesn't round a
> +0.4% week into a Right, because a model that rounds generously inflates
> its own hit rate. This scorecard exists to be believed.
>
> The scorer also checks the note's invalidation separately, even when the
> move matched the call — a call that landed but whose invalidation fired was
> right by accident, and it gets logged as invalidated. Luck is tracked
> separately from skill.

**Do:** run the boundary test live:

```bash
python scripts/verdict_rule.py    # → 15/15 cases green, including "exactly ±1.00 is Flat"
```

**Say:** the record, straight:

> Thirteen weeks backfilled. Twelve calls scored: six Right, six Wrong, zero
> Flat — a fifty percent hit rate. Three calls were invalidated. The
> September 11 call is still open; it doesn't get graded until next week's
> price exists. Nothing is hidden, nothing is rounded.

---

## Beat 4 — The 2026-08-07 miss, explained (≈3 min)

**Show:** the graded row on the Notes sheet:

```
verdict:         Wrong
price_move_pct:  6.47
invalidated:     no
why:             The note priced the 17.423M bbl build against the −2.371M bbl
                 baseline as a fresh surplus; WTI rose 6.47% (78.94 → 84.05) anyway.
```

**Say:**

> Now the honest part. That BEARISH call you watched the agent make? WTI rose
> 6.47 percent the following week — $78.94 to $84.05. The call was Wrong, and
> it stays Wrong on the board.
>
> Why did it miss — in the note's own terms? The note priced a 17.4 million
> barrel build against a negative baseline as a fresh surplus, a 19.8 million
> barrel gap. The market looked at that number and refused to trade it —
> and its invalidation never fired: next week's "crude change" was a 4.4
> million barrel build, not the draw over 2 million the note said would prove
> it wrong. So this was a clean miss, not a lucky save. Wrong, no flag.
>
> A tuning pass that chased outcomes could not have produced this record —
> and the plan expected exactly this kind of honest miss on the centerpiece
> week. Half the calls on this board are Wrong, the misses are explained in
> numbers, and the one call still open stays open until the tape settles.
> A scorecard you can't argue with is the whole product.

**Bridge out:** "That's the system: public data in, a committed call out, and
a record that grades itself without sympathy. The skills, the validators, and
the tuning log are all in the repo."

---

## "Does this place trades?"

Rehearsed answer — say it as written, then stop talking:

> No. This is analysis for human review only. It reads public EIA data,
> writes notes, and grades its own predictions — there is no broker
> connection, no order routing, no automated trading of any kind. A person
> decides what, if anything, to do with the call.

If pressed on integrations: the pipeline reads six public EIA spreadsheets
over plain HTTP; the outputs are a workbook, a Slack-ready post, and this
repo. Nothing connects to a market, an account, or an exchange.

---

## Cut order under time pressure

Cut top-down; each cut keeps the story intact. **The beat order never
changes.**

| Cut | What you drop | How the demo adapts |
|-----|---------------|---------------------|
| 1st | **The dashboard** | Read the scorecard straight off the Notes sheet — the graded rows carry the same story. |
| 2nd | **The timeline view** | The 13-week arc is one sentence: "six Right, six Wrong, zero Flat, one still open." |
| 3rd | **Slack formatting** | Read the 2026-08-07 note aloud from the file instead of showing the polished post. |

**Never cut: the backfill** — the 13-week populated Notes record. Beats 3 and
4 are empty without it; a demo of the pipeline alone proves nothing about the
record.

Floor for the shortest version (~4 min): Beat 1 with the printed row, Beat 2
with the validator PASS, Beat 3 from the Notes sheet with the 6/6/0 record,
Beat 4 in full. The miss is the product; it is never the thing that gets cut.
