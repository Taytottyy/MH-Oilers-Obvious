import notesCsv from '../../../data/notes.csv?raw'
import fullCsv from '../../../data/full.csv?raw'
import answersCsv from '../../../data/answers.csv?raw'
import { parseCsvObjects } from '../lib/csv'
import { verdict, type Call, type Verdict } from '../lib/verdict'

/** One row of the graded record (data/notes.csv). Empty CSV cells become null. */
export interface NoteRow {
  weekEnding: string
  crudeStocksMb: string
  crudeChangeMb: string
  crudeChange5yrAvgMb: string
  cushingStocksMb: string
  gasolineStocksMb: string
  gasolineChangeMb: string
  distillateStocksMb: string
  distillateChangeMb: string
  refineryUtilizationPct: string
  wtiPrice: string
  headline: string
  note: string
  call: Call
  invalidation: string
  couldntSee: string
  verdict: Verdict | null
  priceMovePct: number | null
  invalidated: boolean | null
  why: string | null
}

export interface AnswerRow {
  weekEnding: string
  wtiPrice: number
  wtiPriceNextWeek: number | null
  wtiNextWeekPct: number | null
}

export interface FullRow {
  weekEnding: string
  wtiPrice: number
}

/** One week as the UI renders it, merged across notes + full + answers. */
export interface WeekView {
  weekEnding: string
  label: string
  call: Call
  /** null = the call is still open (not yet graded). */
  verdict: Verdict | null
  priceMovePct: number | null
  invalidated: boolean | null
  wtiPrice: number
  headline: string
  bullets: string[]
  invalidation: string
  couldntSee: string
  why: string | null
}

export interface HitRate {
  right: number
  wrong: number
  flat: number
  invalidated: number
  open: number
  graded: number
  /** right / (right + wrong) over graded weeks only. */
  rate: number
}

const emptyToNull = (s: string): string | null => (s === '' ? null : s)

const toNumber = (s: string): number | null => (s === '' ? null : Number.parseFloat(s))

const yesToBool = (s: string): boolean | null => (s === '' ? null : s === 'yes')

function toCall(s: string): Call {
  if (s !== 'BULLISH' && s !== 'BEARISH') {
    throw new Error(`unexpected call value ${JSON.stringify(s)}`)
  }
  return s
}

export function loadNotes(csv: string): NoteRow[] {
  return parseCsvObjects(csv).map((r) => {
    const verdictCell = emptyToNull(r.verdict)
    if (verdictCell !== null && verdictCell !== 'Right' && verdictCell !== 'Wrong' && verdictCell !== 'Flat') {
      throw new Error(`unexpected verdict value ${JSON.stringify(r.verdict)} for week ${r.week_ending}`)
    }
    return {
      weekEnding: r.week_ending,
      crudeStocksMb: r.crude_stocks_mb,
      crudeChangeMb: r.crude_change_mb,
      crudeChange5yrAvgMb: r.crude_change_5yr_avg_mb,
      cushingStocksMb: r.cushing_stocks_mb,
      gasolineStocksMb: r.gasoline_stocks_mb,
      gasolineChangeMb: r.gasoline_change_mb,
      distillateStocksMb: r.distillate_stocks_mb,
      distillateChangeMb: r.distillate_change_mb,
      refineryUtilizationPct: r.refinery_utilization_pct,
      wtiPrice: r.wti_price,
      headline: r.headline,
      note: r.note,
      call: toCall(r.call),
      invalidation: r.invalidation,
      couldntSee: r.couldnt_see,
      verdict: verdictCell,
      priceMovePct: toNumber(r.price_move_pct),
      invalidated: yesToBool(r.invalidated),
      why: emptyToNull(r.why),
    }
  })
}

export function loadAnswers(csv: string): AnswerRow[] {
  return parseCsvObjects(csv).map((r) => ({
    weekEnding: r.week_ending,
    wtiPrice: Number.parseFloat(r.wti_price),
    wtiPriceNextWeek: toNumber(r.wti_price_next_week),
    wtiNextWeekPct: toNumber(r.wti_next_week_pct),
  }))
}

export function loadFull(csv: string): FullRow[] {
  return parseCsvObjects(csv).map((r) => ({
    weekEnding: r.week_ending,
    wtiPrice: Number.parseFloat(r.wti_price),
  }))
}

/** Hit rate over graded weeks only: Right ÷ (Right + Wrong). */
export function computeHitRate(rows: NoteRow[]): HitRate {
  const right = rows.filter((r) => r.verdict === 'Right').length
  const wrong = rows.filter((r) => r.verdict === 'Wrong').length
  const flat = rows.filter((r) => r.verdict === 'Flat').length
  const invalidated = rows.filter((r) => r.invalidated === true).length
  const open = rows.filter((r) => r.verdict === null).length
  const graded = right + wrong + flat
  return { right, wrong, flat, invalidated, open, graded, rate: graded > 0 ? right / graded : 0 }
}

/** '2026-06-19' → 'Jun 19' for chart axes. */
export function weekLabel(isoWeekEnding: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const parts = isoWeekEnding.split('-')
  if (parts.length !== 3) throw new Error(`unexpected ISO date ${JSON.stringify(isoWeekEnding)}`)
  const month = months[Number.parseInt(parts[1], 10) - 1]
  if (month === undefined) throw new Error(`unexpected ISO date ${JSON.stringify(isoWeekEnding)}`)
  return `${month} ${Number.parseInt(parts[2], 10)}`
}

/**
 * Merge the three committed CSVs on week_ending. A week missing from any
 * source — or present in only some — is a data error and fails loudly.
 */
export function buildWeekViews(notes: NoteRow[], full: FullRow[], answers: AnswerRow[]): WeekView[] {
  const key = (rows: { weekEnding: string }[]) => new Set(rows.map((r) => r.weekEnding))
  const noteKeys = key(notes)
  for (const source of [key(full), key(answers)]) {
    if (source.size !== noteKeys.size || [...source].some((k) => !noteKeys.has(k))) {
      throw new Error('notes/full/answers cover different week_ending sets')
    }
  }

  const wtiByWeek = new Map(full.map((r) => [r.weekEnding, r.wtiPrice]))
  const answersByWeek = new Map(answers.map((r) => [r.weekEnding, r]))

  return notes.map((n) => {
    const answer = answersByWeek.get(n.weekEnding)
    if (!answer) throw new Error(`no answers row for week ${n.weekEnding}`)
    const wti = wtiByWeek.get(n.weekEnding)
    if (wti === undefined) throw new Error(`no full row for week ${n.weekEnding}`)

    // The stored price move is the scorer's committed record — required for a
    // graded week and forbidden for an open one. The answers file is the
    // independent cross-check, never a silent fallback source.
    if (n.verdict !== null) {
      if (n.priceMovePct === null) {
        throw new Error(`graded week ${n.weekEnding} has no stored price move`)
      }
      if (answer.wtiNextWeekPct === null) {
        throw new Error(`answers file has no next-week pct for graded week ${n.weekEnding}`)
      }
      if (n.priceMovePct !== answer.wtiNextWeekPct) {
        throw new Error(
          `price move mismatch for week ${n.weekEnding}: notes=${n.priceMovePct} answers=${answer.wtiNextWeekPct}`,
        )
      }
    } else if (n.priceMovePct !== null || answer.wtiNextWeekPct !== null) {
      throw new Error(`open week ${n.weekEnding} unexpectedly has a price move`)
    }
    const gradedPct = n.verdict === null ? null : n.priceMovePct

    const bullets = n.note.split(/\r?\n/).map((line) => line.replace(/^\d+\.\s*/, ''))
    if (bullets.length !== 3) {
      throw new Error(`note for week ${n.weekEnding} has ${bullets.length} bullets, expected 3`)
    }

    return {
      weekEnding: n.weekEnding,
      label: weekLabel(n.weekEnding),
      call: n.call,
      verdict: n.verdict,
      priceMovePct: gradedPct,
      invalidated: n.invalidated,
      wtiPrice: wti,
      headline: n.headline,
      bullets,
      invalidation: n.invalidation,
      couldntSee: n.couldntSee,
      why: n.why,
    }
  })
}

// The committed record, parsed once at module load. Malformed committed data
// throws here on purpose — the data tests make that a build-time failure, and
// the app never renders from silent fallbacks.
export const NOTES: NoteRow[] = loadNotes(notesCsv)
export const ANSWERS: AnswerRow[] = loadAnswers(answersCsv)
export const FULL: FullRow[] = loadFull(fullCsv)
export const WEEKS: WeekView[] = buildWeekViews(NOTES, FULL, ANSWERS)
export const HIT_RATE: HitRate = computeHitRate(NOTES)

/** '50.0' style percent string for the hero number. */
export function hitRatePercent(rate: number): string {
  return (rate * 100).toFixed(1)
}

/** '+8.66%' / '−9.55%' / '—' for open weeks. */
export function formatPct(pct: number | null): string {
  if (pct === null) return '—'
  const sign = pct > 0 ? '+' : pct < 0 ? '\u2212' : ''
  return `${sign}${Math.abs(pct).toFixed(2)}%`
}

/** Re-derive a stored verdict from the ±1% band — the scorer's contract. */
export function scoredVerdict(row: NoteRow): Verdict | null {
  return row.priceMovePct === null ? null : verdict(row.call, row.priceMovePct)
}
