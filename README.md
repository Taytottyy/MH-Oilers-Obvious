# MH Oilers | Obvious Hackathon

An EIA weekly petroleum-market analyst agent: it reads the public Weekly
Petroleum Status Report data, writes a desk note with a committed call, then
grades itself a week later — and keeps the honest record either way.

**This is analysis for human review only. It never places trades and has no
broker connection.** A person decides what, if anything, to do with the call.

**Live demo:** the scorecard frontend is deployed at
https://0wyy300x9a-8123.hosted.obvious.ai/MH-Oilers-Obvious/ — it renders the
same committed CSVs (`data/notes.csv`, `data/answers.csv`, `data/full.csv`)
client-side. (A GitHub Pages deploy workflow is also in
`.github/workflows/pages.yml`; it activates once Pages is enabled in the repo
settings, after which `https://taytottyy.github.io/MH-Oilers-Obvious/` works
too.)

## What this is

Three layers, kept in separate lanes so the predictions stay honest:

1. **Data pipeline** (`scripts/build_dataset.py`) — six pinned public EIA
   spreadsheets (no API key, see `docs/data-sources.md`), normalized to
   million barrels by Friday week-ending date, with 5-year seasonal baselines.
   Writes three CSVs: `data/full.csv` (everything), `data/notes_input.csv`
   (inputs only — no outcome columns; the split-guard test in CI enforces
   this), and `data/answers.csv` (outcomes the note-writer never sees).
2. **Note-writer** (`skills/note-writer.md`) — one run, one week: a single row
   of `notes_input.csv` becomes a fixed-shape desk note (HEADLINE / NOTE /
   CALL / INVALIDATION / COULDNT_SEE) with a committed BULLISH or BEARISH
   call and a numeric invalidation. Every output passes the mechanical
   validator (`scripts/validate_note.py`) and a read-aloud check.
3. **Scorer** (`skills/scorer.md`) — one week later, grades the call against
   `answers.csv` on a strict ±1% band (Flat is not a win), checks the note's
   numeric invalidation separately, and writes a `why` that names numbers.

The current backfilled record: 13 weeks (2026-06-19 → 2026-09-11), 12 calls
scored — 6 Right, 6 Wrong, 0 Flat, a 50.0% hit rate, three invalidations, and
the 2026-09-11 call still open. The record lives in the project workbook's
Notes sheet; this repo holds the pipeline, the skills, and the data.

## How to run

Python 3.13 (what CI uses). Install deps once:

```bash
pip install -r scripts/requirements.txt
```

The repo ships the full 13-week snapshot in `data/`, so everything below runs
without network. To rebuild the dataset from the pinned EIA sources instead:

```bash
python scripts/build_dataset.py        # fetches the six workbooks, rewrites data/*.csv
```

Validate a note (used on every note before it lands):

```bash
python scripts/validate_note.py path/to/note.txt    # PASS or FAIL + defects
```

Run the scorer's ±1% verdict-rule boundary test:

```bash
python scripts/verdict_rule.py        # prints 15/15 cases green
```

Tests and lint (same as CI):

```bash
pytest -q
ruff check scripts tests
```

Layout: `scripts/` pipeline + validators · `data/` the 13-week snapshot ·
`skills/` the tuned note-writer and scorer · `docs/` data sources, tuning
log, demo runbook · `tests/` split-guard, unit conversion, baseline math,
join integrity, skill tooling.

## The four demo beats

The demo walks one arc: a release lands, the agent commits a call, the tape
grades it, and the record explains the miss it kept. Full verbatim script —
including the rehearsed "does this place trades?" answer and the cut order
under time pressure — is in [`docs/demo-runbook.md`](docs/demo-runbook.md).

| # | Beat | What you see |
|---|------|--------------|
| 1 | **The release** | The Wednesday WPSR lands; six pinned EIA sources become one input row in `data/notes_input.csv`. |
| 2 | **The note** | The note-writer turns that row into a fixed-shape desk note with a committed call; the validator passes it. |
| 3 | **The scorecard** | A week later the scorer grades the call on the ±1% band — 12 scored calls, 6 Right / 6 Wrong / 0 Flat. |
| 4 | **The miss explained** | The 2026-08-07 centerpiece: BEARISH into a +6.47% rally. Why it missed, in its own terms — and why the miss staying on the board is the point. |
