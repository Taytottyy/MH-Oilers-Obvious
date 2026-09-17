// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Chart.js cannot acquire a 2D context in jsdom — stub the class and assert
// the surrounding rendered structure instead.
vi.mock('chart.js', () => ({
  Chart: class {
    destroy() {}
  },
}))

import App from './App'

afterEach(cleanup)

describe('App render', () => {
  it('shows the 50.0% hit rate and the 6/6/0/3/1 counts', () => {
    render(<App />)
    expect(screen.getByText('50.0%')).toBeTruthy()
    expect(screen.getByText('Right ÷ (Right + Wrong)')).toBeTruthy()
    const section = screen.getByLabelText('Hit rate over graded calls')
    const counts = [...section.querySelectorAll('.count .n')].map((el) => el.textContent)
    expect(counts).toEqual(['6', '6', '0', '3', '1'])
  })

  it('renders all 13 weeks in the scorecard with the open row', () => {
    render(<App />)
    const table = screen.getByRole('table')
    const bodyRows = [...table.querySelectorAll('tbody tr')]
    expect(bodyRows).toHaveLength(13)
    // '2026-09-11' also appears in the open-call banner — scope to the table.
    expect(within(table).getByText('2026-09-11')).toBeTruthy()
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0)
  })

  it('renders 13 note cards and the open-call banner', () => {
    render(<App />)
    const notes = document.querySelectorAll('.note-card')
    expect(notes).toHaveLength(13)
    const banner = screen.getByLabelText('Open call')
    expect(banner.textContent).toContain('Open call — grades next week')
    // The same invalidation sentence also appears on the open week's note card,
    // so scope this assertion to the banner.
    expect(banner.textContent).toContain("wrong if next week's crude change is a draw of more than 2.0M bbl")
  })

  it('carries the research-only disclaimer with no broker connection', () => {
    render(<App />)
    const footer = document.querySelector('.app-footer')
    expect(footer?.textContent).toContain('never places trades')
    expect(footer?.textContent).toContain('no broker connection')
  })

  it('shows stored headlines from both ends of the record', () => {
    render(<App />)
    expect(screen.getByText(/A 19\.8M bbl surprise build against a negative baseline/)).toBeTruthy()
    expect(screen.getByText(/The seasonal draw is not showing up/)).toBeTruthy()
  })
})
