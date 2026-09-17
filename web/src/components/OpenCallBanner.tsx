import type { WeekView } from '../data/notes'
import { CallPill } from './Pill'

/** The still-open call: committed, invalidation stated, outcome blank. */
export function OpenCallBanner({ week }: { week: WeekView }) {
  return (
    <section id="open-call" className="open-banner" aria-label="Open call">
      <div className="open-banner-label">Open call — grades next week</div>
      <div className="open-banner-grid">
        <div className="ob-field">
          <div className="k">Week ending</div>
          <div className="v">{week.weekEnding}</div>
        </div>
        <div className="ob-field">
          <div className="k">Call</div>
          <div className="v">
            <CallPill call={week.call} />
          </div>
        </div>
        <div className="ob-field ob-wide">
          <div className="k">Invalidation</div>
          <div className="v">{week.invalidation}</div>
        </div>
        <div className="ob-field">
          <div className="k">Outcome</div>
          <div className="v">—</div>
        </div>
      </div>
    </section>
  )
}
