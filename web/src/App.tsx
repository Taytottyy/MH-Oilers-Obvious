import { ChartsSection } from './components/Charts'
import { Hero } from './components/Hero'
import { NoteCard } from './components/NoteCard'
import { OpenCallBanner } from './components/OpenCallBanner'
import { ScorecardTable } from './components/ScorecardTable'
import { HIT_RATE, WEEKS } from './data/notes'

export default function App() {
  const gradedWeeks = WEEKS.filter((w) => w.verdict !== null)
  const openWeek = WEEKS.find((w) => w.verdict === null)
  const firstGraded = gradedWeeks[0]?.label ?? 'Jun 19'
  const lastGraded = gradedWeeks[gradedWeeks.length - 1]?.label ?? 'Sep 4'

  return (
    <div className="layout">
      <header className="report-header">
        <h1>EIA Analyst — Scorecard</h1>
        <p className="report-subtitle">
          Thirteen weeks of graded crude-oil market calls: every note the agent wrote, what it called, and what
          actually happened next.
        </p>
        <div className="report-meta">
          <span className="author-name">Obvious</span>
          <span className="report-meta-separator">·</span>
          <span>September 17, 2026</span>
          <span className="report-meta-separator">·</span>
          <span>Data: EIA Weekly Petroleum Status Report</span>
        </div>
      </header>
      <hr className="report-divider" />

      <Hero rate={HIT_RATE} firstGraded={firstGraded} lastGraded={lastGraded} />
      <ScorecardTable weeks={WEEKS} />
      <ChartsSection weeks={WEEKS} />

      <section id="notes" className="analysis-section">
        <h3>Every note, in its own words</h3>
        <p>
          Each weekly note takes the same shape: a committed headline, three numbered evidence bullets, the call and
          its numeric invalidation set apart, and what the agent could not see when writing it.
        </p>
        <div className="note-list">
          {WEEKS.map((week) => (
            <NoteCard key={week.weekEnding} week={week} />
          ))}
        </div>
      </section>

      {openWeek && <OpenCallBanner week={openWeek} />}

      <footer className="app-footer">
        Research and paper-trading only. This agent never places trades, holds no broker connection, and takes no
        automated investment decisions — every call is subject to human review. Data: EIA Weekly Petroleum Status
        Report.
      </footer>
    </div>
  )
}
