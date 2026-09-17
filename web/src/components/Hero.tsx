import { hitRatePercent, type HitRate } from '../data/notes'

/**
 * Hit-rate hero: the big number plus the scoring formula, over graded weeks
 * only — Flat weeks and the still-open call sit outside the denominator.
 */
export function Hero({ rate, firstGraded, lastGraded }: { rate: HitRate; firstGraded: string; lastGraded: string }) {
  return (
    <section id="hit-rate" className="hero-metric" aria-label="Hit rate over graded calls">
      <div>
        <div className="big-label">Hit rate — graded calls only</div>
        <div className="big">{hitRatePercent(rate.rate)}%</div>
        <div className="count-row">
          <div className="count right">
            <span className="n">{rate.right}</span>
            <span className="l">Right</span>
          </div>
          <div className="count wrong">
            <span className="n">{rate.wrong}</span>
            <span className="l">Wrong</span>
          </div>
          <div className="count">
            <span className="n">{rate.flat}</span>
            <span className="l">Flat</span>
          </div>
          <div className="count">
            <span className="n">{rate.invalidated}</span>
            <span className="l">Invalidated</span>
          </div>
          <div className="count">
            <span className="n">{rate.open}</span>
            <span className="l">Open</span>
          </div>
        </div>
      </div>
      <div className="formula">
        <code>Right ÷ (Right + Wrong)</code> over the {rate.graded} graded weeks ({firstGraded} – {lastGraded}). Flat
        calls — moves within ±1% of zero — would count as neither wins nor losses; there were none. The open
        September 11 call is excluded until it grades.
      </div>
    </section>
  )
}
