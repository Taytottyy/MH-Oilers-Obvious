import { useEffect, useMemo, useRef } from 'react'
import { Chart, type ChartConfiguration } from 'chart.js'
import { formatPct, type WeekView } from '../data/notes'

const GREEN = '#10b981'
const RED = '#ef4444'
const GRAY = '#b3b3b3'

export function verdictColor(week: WeekView): string {
  if (week.verdict === 'Right') return GREEN
  if (week.verdict === 'Wrong') return RED
  return GRAY
}

const INTER = "'Inter', sans-serif"

function baseOptions(): Record<string, unknown> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    font: { family: INTER },
  }
}

/** Mounts one chart.js instance per canvas and tears it down on unmount. */
function ChartCanvas({ config, ariaLabel }: { config: ChartConfiguration; ariaLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) throw new Error('chart canvas missing')
    const chart = new Chart(canvas, config)
    return () => chart.destroy()
  }, [config])

  return (
    <div className="chart-container">
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
    </div>
  )
}

/** Price move after each call, colored by verdict. */
export function CallsChart({ weeks }: { weeks: WeekView[] }) {
  const config = useMemo<ChartConfiguration>(() => {
    return {
      type: 'bar',
      data: {
        labels: weeks.map((w) => w.label),
        datasets: [
          {
            label: 'Price move after call (%)',
            data: weeks.map((w) => w.priceMovePct),
            backgroundColor: weeks.map(verdictColor),
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...baseOptions(),
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: {
            grid: { color: '#e5e5e5' },
            border: { display: false },
            ticks: { padding: 8, callback: (v) => `${v}%` },
          },
        },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, boxWidth: 8 } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const week = weeks[ctx.dataIndex]
                if (!week || week.priceMovePct === null) return 'Open — grades next week'
                return `${week.call} call, ${formatPct(week.priceMovePct)} — ${week.verdict ?? 'Open'}`
              },
            },
          },
        },
      },
    }
  }, [weeks])

  return <ChartCanvas config={config} ariaLabel="Bar chart of the WTI price move after each weekly call, colored by verdict" />
}

/** WTI front-month price at each Wednesday release, points colored by verdict. */
export function WtiChart({ weeks }: { weeks: WeekView[] }) {
  const config = useMemo<ChartConfiguration>(() => {
    const pointColors = weeks.map(verdictColor)
    return {
      type: 'line',
      data: {
        labels: weeks.map((w) => w.label),
        datasets: [
          {
            label: 'WTI ($/bbl)',
            data: weeks.map((w) => w.wtiPrice),
            borderColor: '#0a0a0a',
            backgroundColor: 'rgba(10,10,10,0.05)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
          },
        ],
      },
      options: {
        ...baseOptions(),
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: {
            grid: { color: '#e5e5e5' },
            border: { display: false },
            ticks: { padding: 8, callback: (v) => `$${v}` },
          },
        },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `$${Number(ctx.raw).toFixed(2)}/bbl` } },
        },
      },
    }
  }, [weeks])

  return <ChartCanvas config={config} ariaLabel="Line chart of weekly WTI price across the thirteen-week record, points colored by verdict" />
}

export function ChartsSection({ weeks }: { weeks: WeekView[] }) {
  return (
    <>
      <section id="calls-over-time" className="chart-card">
        <h3>Calls over time</h3>
        <p className="chart-sub">
          Weekly price move following each call, colored by verdict — green right, red wrong, gray open. June 19 –
          September 11, 2026.
        </p>
        <CallsChart weeks={weeks} />
      </section>
      <section id="wti-series" className="chart-card">
        <h3>WTI price series</h3>
        <p className="chart-sub">Front-month WTI at each Wednesday release, $/bbl. Points colored by that week&rsquo;s verdict.</p>
        <WtiChart weeks={weeks} />
      </section>
    </>
  )
}
