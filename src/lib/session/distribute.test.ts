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
  it('N=10 → 4×1m, 3×2m, 2×5m, 1×10m (30m)', () => {
    const d = distribute(10)
    expect(d).toHaveLength(10)
    expect(breakdown(d)).toEqual([
      [60, 4],
      [120, 3],
      [300, 2],
      [600, 1],
    ])
    expect(sum(d)).toBe(30 * 60)
  })

  it('N=16 → 6×1m, 5×2m, 3×5m, 2×10m (51m)', () => {
    const d = distribute(16)
    expect(breakdown(d)).toEqual([
      [60, 6],
      [120, 5],
      [300, 3],
      [600, 2],
    ])
    expect(sum(d)).toBe(51 * 60)
  })

  it('N=20 → 8×1m, 6×2m, 4×5m, 2×10m (60m)', () => {
    const d = distribute(20)
    expect(breakdown(d)).toEqual([
      [60, 8],
      [120, 6],
      [300, 4],
      [600, 2],
    ])
    expect(sum(d)).toBe(60 * 60)
  })

  it('returns durations in ascending order', () => {
    const d = distribute(20)
    expect([...d].sort((a, b) => a - b)).toEqual(d)
  })
})
