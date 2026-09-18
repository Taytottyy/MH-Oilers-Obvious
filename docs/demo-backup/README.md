# Demo backup — if Obvious hangs on stage

The plan's risk register: *"Screenshot every screen by 1:50; present screenshots
if live demo fails."* This folder is that fallback. Nothing here is needed when
the workspace is up; everything here works from disk with no login.

| Beat | Live screen | Fallback |
|---|---|---|
| 1 — the release | eia.gov WPSR page | open eia.gov — it is a static public page, no fallback needed |
| 2 — the note | Slack #eia-notes | `screenshots/slack.png` — or paste `slack-note-template.md` |
| 3 — the scorecard | EIA-Analyst-Scorecard folio | `screenshots/hero.png` + `screenshots/calls.png` |
| 4 — the miss | Note detail, 2026-08-07 | `screenshots/miss.png` |

`fallback-dashboard.html` is the whole dashboard as one page (hero, calls
chart, WTI series, full record, Slack note, the miss). Double-click it; it
needs the network only for Chart.js and Google Fonts, and degrades to system
fonts without them. `screenshots/full.png` is the same page as a single image.

`judge-qa.md` has the two frontend beats with the real 2026-08-07 numbers and
the rehearsed answers (no trades, leakage, sample size, why not 12-for-12).

Screenshots were captured 2026-09-17 from the graded workbook: 6 Right /
6 Wrong / 0 Flat, 50.0%, 3 invalidated, 09-11 open. Regenerate after the
09-11 call grades.
