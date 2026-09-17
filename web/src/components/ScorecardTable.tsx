import { formatPct, type WeekView } from '../data/notes'
import { CallPill, VerdictPill } from './Pill'

/** Full 13-week scorecard: every note, its call, verdict, move, and invalidation. */
export function ScorecardTable({ weeks }: { weeks: WeekView[] }) {
  return (
    <section id="scorecard" className="analysis-section">
      <h3>The full record, week by week</h3>
      <p>
        Every note is graded against the following week&rsquo;s WTI move — more than ±1% in the called direction is
        Right, within ±1% is Flat. The <em>invalidated</em> column marks weeks where the note&rsquo;s own stated
        invalidation condition fired, win or lose.
      </p>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Week ending</th>
              <th scope="col">Call</th>
              <th scope="col">Verdict</th>
              <th scope="col" className="num">
                Price move
              </th>
              <th scope="col" className="num">
                Invalidated
              </th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.weekEnding}>
                <td>{w.weekEnding}</td>
                <td>
                  <CallPill call={w.call} />
                </td>
                <td>
                  <VerdictPill verdict={w.verdict} />
                </td>
                <td className={`num ${moveTone(w.priceMovePct)}`}>{formatPct(w.priceMovePct)}</td>
                <td className={`num ${w.invalidated ? 'move-neg' : ''}`}>
                  {w.invalidated === null ? '—' : w.invalidated ? 'yes' : 'no'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function moveTone(pct: number | null): string {
  if (pct === null || pct === 0) return ''
  return pct > 0 ? 'move-pos' : 'move-neg'
}
