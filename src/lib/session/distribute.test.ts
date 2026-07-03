import { describe, expect, it } from 'vitest'
import { distribute } from './distribute'

/** Count poses of each duration, ordered ascending — mirrors the spec's "5×1m,3×2m,…" phrasing. */
function breakdown(seconds: number[]): [number, number][] {
  const counts = new Map<number, number>()
  for (const s of seconds) counts.set(s, (counts.get(s) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => a[0] - b[0])
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('distribute (Class mode, spec §5)', () => {
  it('N=10 → 5×1m, 3×2m, 1×5m, 1×10m (26m)', () => {
    const d = distribute(10)
    expect(d).toHaveLength(10)
    expect(breakdown(d)).toEqual([
      [60, 5],
      [120, 3],
      [300, 1],
      [600, 1],
    ])
    expect(sum(d)).toBe(26 * 60)
  })

  it('N=16 → 8×1m, 4×2m, 2×5m, 2×10m (46m)', () => {
    const d = distribute(16)
    expect(breakdown(d)).toEqual([
      [60, 8],
      [120, 4],
      [300, 2],
      [600, 2],
    ])
    expect(sum(d)).toBe(46 * 60)
  })

  it('N=20 → 10×1m, 5×2m, 3×5m, 2×10m (55m)', () => {
    const d = distribute(20)
    expect(breakdown(d)).toEqual([
      [60, 10],
      [120, 5],
      [300, 3],
      [600, 2],
    ])
    expect(sum(d)).toBe(55 * 60)
  })

  it('returns durations in ascending order', () => {
    const d = distribute(20)
    expect([...d].sort((a, b) => a - b)).toEqual(d)
  })
})
