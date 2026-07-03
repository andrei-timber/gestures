import { describe, expect, it } from 'vitest'
import { distribute } from './distribute'
import { quickPlan } from './quick'
import { DEFAULT_REST_SECONDS, sessionTiming, totalSeconds } from './timing'

describe('sessionTiming', () => {
  it('active time matches the §5 Class totals; rests add on top', () => {
    // §5 examples: N=10 → 26m, N=16 → 46m, N=20 → 55m (active only).
    for (const [n, activeMin] of [
      [10, 26],
      [16, 46],
      [20, 55],
    ] as const) {
      const t = sessionTiming(distribute(n))
      expect(t.active).toBe(activeMin * 60)
      expect(t.rests).toBe((n - 1) * DEFAULT_REST_SECONDS)
      expect(t.total).toBe(activeMin * 60 + (n - 1) * DEFAULT_REST_SECONDS)
    }
  })

  it('places a rest between poses only — none trails the last', () => {
    expect(sessionTiming([60, 60, 60]).rests).toBe(2 * DEFAULT_REST_SECONDS)
    expect(sessionTiming([60]).rests).toBe(0)
    expect(sessionTiming([]).rests).toBe(0)
  })

  it('disables rests when restSeconds is 0 (total equals active)', () => {
    const t = sessionTiming(distribute(20), 0)
    expect(t.rests).toBe(0)
    expect(t.total).toBe(t.active)
  })

  it('honours a custom rest length', () => {
    expect(sessionTiming([60, 60], 20).rests).toBe(20)
  })
})

describe('totalSeconds', () => {
  it('sums a Quick plan plus its rests', () => {
    // 10 × 60s active + 9 × 10s rests = 690s
    expect(totalSeconds(quickPlan(10, 60))).toBe(10 * 60 + 9 * 10)
  })
})
