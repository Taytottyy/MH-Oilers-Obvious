import { describe, expect, it } from 'vitest'
import { parseCsv, parseCsvObjects } from './csv'

describe('parseCsv — RFC 4180', () => {
  it('parses plain rows', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('handles quoted fields with commas', () => {
    expect(parseCsv('"a,1","b"\n"c","d"')).toEqual([
      ['a,1', 'b'],
      ['c', 'd'],
    ])
  })

  it('handles embedded newlines inside quotes', () => {
    expect(parseCsv('"line1\nline2","x"')).toEqual([['line1\nline2', 'x']])
  })

  it('handles CRLF line endings and escaped quotes', () => {
    expect(parseCsv('"say ""hi""",ok\r\n1,2\r\n')).toEqual([
      ['say "hi"', 'ok'],
      ['1', '2'],
    ])
  })

  it('preserves empty fields and drops trailing blank lines', () => {
    expect(parseCsv('a,,c\n,\n')).toEqual([
      ['a', '', 'c'],
      ['', ''],
    ])
  })

  it('strips a UTF-8 BOM from the header', () => {
    expect(parseCsv('\ufefffoo,bar')[0]).toEqual(['foo', 'bar'])
  })

  it('round-trips a QUOTE_ALL pandas-style row', () => {
    const text = '"week_ending","call"\r\n"2026-06-19","BULLISH"\r\n'
    expect(parseCsvObjects(text)).toEqual([{ week_ending: '2026-06-19', call: 'BULLISH' }])
  })
})
