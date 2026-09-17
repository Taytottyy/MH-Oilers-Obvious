import { describe, expect, it } from 'vitest'
import { FLAT_BAND_PCT, verdict } from './verdict'

describe('verdict — ±1% band', () => {
  it('exactly ±1.00% is Flat, both call directions', () => {
    expect(verdict('BULLISH', 1.0)).toBe('Flat')
    expect(verdict('BULLISH', -1.0)).toBe('Flat')
    expect(verdict('BEARISH', 1.0)).toBe('Flat')
    expect(verdict('BEARISH', -1.0)).toBe('Flat')
  })

  it('±0.99% is Flat — inside the band', () => {
    expect(verdict('BULLISH', 0.99)).toBe('Flat')
    expect(verdict('BULLISH', -0.99)).toBe('Flat')
    expect(verdict('BEARISH', 0.99)).toBe('Flat')
    expect(verdict('BEARISH', -0.99)).toBe('Flat')
  })

  it('±1.01% is beyond the band and scores by direction', () => {
    expect(verdict('BULLISH', 1.01)).toBe('Right')
    expect(verdict('BULLISH', -1.01)).toBe('Wrong')
    expect(verdict('BEARISH', -1.01)).toBe('Right')
    expect(verdict('BEARISH', 1.01)).toBe('Wrong')
  })

  it('0.00% is Flat', () => {
    expect(verdict('BULLISH', 0)).toBe('Flat')
    expect(verdict('BEARISH', 0)).toBe('Flat')
  })

  it('large moves score by call direction', () => {
    expect(verdict('BULLISH', 11.78)).toBe('Right')
    expect(verdict('BULLISH', -9.55)).toBe('Wrong')
    expect(verdict('BEARISH', -3.13)).toBe('Right')
    expect(verdict('BEARISH', 6.47)).toBe('Wrong')
  })

  it('band boundary is inclusive via the exported constant', () => {
    expect(FLAT_BAND_PCT).toBe(1.0)
    expect(verdict('BULLISH', FLAT_BAND_PCT)).toBe('Flat')
    expect(verdict('BULLISH', FLAT_BAND_PCT + 0.001)).toBe('Right')
  })
})
