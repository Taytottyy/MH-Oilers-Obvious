import { describe, expect, it } from 'vitest'
import {
  ANSWERS,
  FULL,
  HIT_RATE,
  NOTES,
  WEEKS,
  buildWeekViews,
  computeHitRate,
  formatPct,
  loadAnswers,
  loadNotes,
  scoredVerdict,
  weekLabel,
} from './notes'
import notesCsv from '../../../data/notes.csv?raw'
import answersCsv from '../../../data/answers.csv?raw'

describe('committed data — notes.csv', () => {
  it('has exactly 13 rows', () => {
    expect(NOTES).toHaveLength(13)
  })

  it('covers the 13 expected weeks in order', () => {
    const expected = [
      '2026-06-19',
      '2026-06-26',
      '2026-07-03',
      '2026-07-10',
      '2026-07-17',
      '2026-07-24',
      '2026-07-31',
      '2026-08-07',
      '2026-08-14',
      '2026-08-21',
      '2026-08-28',
      '2026-09-04',
      '2026-09-11',
    ]
    expect(NOTES.map((r) => r.weekEnding)).toEqual(expected)
  })

  it('leaves the 2026-09-11 open call ungraded — verdict and price_move_pct empty', () => {
    const open = NOTES.find((r) => r.weekEnding === '2026-09-11')
    expect(open).toBeDefined()
    expect(open?.verdict).toBeNull()
    expect(open?.priceMovePct).toBeNull()
    expect(open?.invalidated).toBeNull()
    expect(open?.why).toBeNull()
    expect(open?.call).toBe('BEARISH')
  })

  it('recomputing the ±1% verdict band reproduces every stored verdict', () => {
    const graded = NOTES.filter((r) => r.verdict !== null)
    expect(graded).toHaveLength(12)
    for (const row of graded) {
      expect(scoredVerdict(row), `week ${row.weekEnding}`).toBe(row.verdict)
    }
  })

  it('each note carries exactly three numbered bullets', () => {
    for (const row of NOTES) {
      const lines = row.note.split(/\r?\n/)
      expect(lines, `week ${row.weekEnding}`).toHaveLength(3)
      for (const [i, line] of lines.entries()) {
        expect(line, `week ${row.weekEnding} bullet ${i + 1}`).toMatch(new RegExp(`^${i + 1}\\. `))
      }
    }
  })
})

describe('committed data — full.csv and answers.csv', () => {
  it('has 13 weekly input rows with WTI prices', () => {
    expect(FULL).toHaveLength(13)
    for (const row of FULL) {
      expect(Number.isFinite(row.wtiPrice), `wti_price for ${row.weekEnding}`).toBe(true)
    }
  })

  it('has 13 answer rows; the open week has no next-week outcome', () => {
    expect(ANSWERS).toHaveLength(13)
    const open = ANSWERS.find((r) => r.weekEnding === '2026-09-11')
    expect(open?.wtiNextWeekPct).toBeNull()
    const graded = ANSWERS.filter((r) => r.wtiNextWeekPct !== null)
    expect(graded).toHaveLength(12)
  })
})

describe('derived metrics', () => {
  it('computes the 50.0% hit rate over graded weeks: 6R / 6W / 0F / 3 invalidated / 1 open', () => {
    expect(HIT_RATE).toEqual({
      right: 6,
      wrong: 6,
      flat: 0,
      invalidated: 3,
      open: 1,
      graded: 12,
      rate: 0.5,
    })
  })

  it('rates a zero-graded record as 0 rather than NaN', () => {
    const empty = computeHitRate([])
    expect(empty.rate).toBe(0)
    expect(empty.graded).toBe(0)
  })

  it('formats price moves with explicit sign and an em dash for open weeks', () => {
    expect(formatPct(8.66)).toBe('+8.66%')
    expect(formatPct(-9.55)).toBe('\u22129.55%')
    expect(formatPct(null)).toBe('—')
  })

  it('renders week labels for chart axes', () => {
    expect(weekLabel('2026-06-19')).toBe('Jun 19')
    expect(weekLabel('2026-09-11')).toBe('Sep 11')
  })
})

describe('buildWeekViews merge', () => {
  it('joins notes, full, and answers on week_ending', () => {
    expect(WEEKS).toHaveLength(13)
    for (const week of WEEKS) {
      expect(week.bullets).toHaveLength(3)
      expect(Number.isFinite(week.wtiPrice)).toBe(true)
    }
  })

  it('rejects sources covering different week sets', () => {
    const notes = loadNotes(notesCsv)
    const answers = loadAnswers(answersCsv)
    expect(() => buildWeekViews(notes, FULL.slice(0, 12), answers)).toThrow('different week_ending sets')
  })

  it('rejects a graded week with no stored price move', () => {
    const notes = loadNotes(notesCsv)
    const withMissingPct = notes.map((n) => (n.weekEnding === '2026-08-07' ? { ...n, priceMovePct: null } : n))
    expect(() => buildWeekViews(withMissingPct, FULL, loadAnswers(answersCsv))).toThrow('no stored price move')
  })

  it('rejects an open week that already carries a price move', () => {
    const notes = loadNotes(notesCsv).map((n) => (n.weekEnding === '2026-09-11' ? { ...n, priceMovePct: -1.5 } : n))
    expect(() => buildWeekViews(notes, FULL, loadAnswers(answersCsv))).toThrow('open week 2026-09-11 unexpectedly has a price move')
  })
})
