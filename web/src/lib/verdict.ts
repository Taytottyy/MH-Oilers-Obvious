/** A committed weekly call direction. */
export type Call = 'BULLISH' | 'BEARISH'

/** Scored outcome for a graded call. */
export type Verdict = 'Right' | 'Wrong' | 'Flat'

/**
 * The scorer's anti-generosity band: a weekly WTI move within ±1% of flat
 * counts as Flat, and exactly ±1.00% is inside the band.
 */
export const FLAT_BAND_PCT = 1.0

/**
 * ±1% verdict band, ported from the Python scorer.
 *
 * A move beyond ±1% in the called direction is Right, within ±1% is Flat,
 * and beyond ±1% against the call is Wrong. Exactly ±1.00% is Flat.
 */
export function verdict(call: Call, movePct: number): Verdict {
  if (Math.abs(movePct) <= FLAT_BAND_PCT) return 'Flat'
  if (call === 'BULLISH') return movePct > 0 ? 'Right' : 'Wrong'
  return movePct < 0 ? 'Right' : 'Wrong'
}
