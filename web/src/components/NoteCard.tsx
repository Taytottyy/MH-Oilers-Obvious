import { formatPct, type WeekView } from '../data/notes'
import { CallPill, VerdictPill } from './Pill'

/**
 * One weekly note, memo style: headline, the three numbered evidence bullets,
 * call + invalidation set apart, what the agent could not see, then the
 * verdict and the scorer's explanation.
 */
export function NoteCard({ week }: { week: WeekView }) {
  return (
    <article className="note-card">
      <div className="week-label">
        Week ending {week.weekEnding} · {week.verdict === null ? 'open' : 'graded the following week'}
      </div>
      <h3 className="headline">{week.headline}</h3>
      <ol className="bullets">
        {week.bullets.map((bullet, i) => (
          <li key={i}>{bullet}</li>
        ))}
      </ol>
      <div className="call-box">
        <div className={`kv call-${week.call.toLowerCase()}`}>
          <div className="k">Call</div>
          <div className="v">{week.call}</div>
        </div>
        <div className="kv">
          <div className="k">Invalidation</div>
          <div className="v">{week.invalidation}</div>
        </div>
      </div>
      <div className="couldnt">Couldn&rsquo;t see: {week.couldntSee}.</div>
      <div className="verdict-row">
        <CallPill call={week.call} />
        <VerdictPill verdict={week.verdict} />
        <span className="pill move-pill">{week.priceMovePct === null ? 'outcome blank' : `price move ${formatPct(week.priceMovePct)}`}</span>
      </div>
      <div className="why-box">
        <div className="k">{week.verdict === 'Right' ? 'Why it was right' : week.verdict === 'Wrong' ? 'Why it was wrong' : 'Scorer\u2019s explanation'}</div>
        {week.why ?? 'No outcome yet — this call grades next week.'}
      </div>
    </article>
  )
}
