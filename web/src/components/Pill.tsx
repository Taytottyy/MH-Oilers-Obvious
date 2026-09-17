import type { Call, Verdict } from '../lib/verdict'

export type PillTone = 'right' | 'wrong' | 'open'

export function Pill({ tone, children }: { tone: PillTone; children: string }) {
  return <span className={`pill ${tone}`}>{children}</span>
}

/** Verdict → pill; null = open call. */
export function VerdictPill({ verdict }: { verdict: Verdict | null }) {
  if (verdict === null) return <Pill tone="open">Open</Pill>
  return <Pill tone={verdict === 'Right' ? 'right' : verdict === 'Wrong' ? 'wrong' : 'open'}>{verdict}</Pill>
}

/** BULLISH reads green, BEARISH reads red — matching the move colors. */
export function CallPill({ call }: { call: Call }) {
  return <Pill tone={call === 'BULLISH' ? 'right' : 'wrong'}>{call}</Pill>
}
