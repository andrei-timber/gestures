import { describe, expect, it } from 'vitest'
import { makeRng } from './order'
import { SPACING_GAP, pickSpaced } from './pick'

/** Minimum consecutive gap in a sorted index list. */
const minGap = (xs: number[]) =>
  xs.slice(1).reduce((m, x, i) => Math.min(m, x - xs[i]), Infinity)

describe('pickSpaced', () => {
  it('picks n distinct, sorted, in-range indices', () => {
    const out = pickSpaced(1000, 12, makeRng(1))
    expect(out).toHaveLength(12)
    expect(new Set(out).size).toBe(12) // distinct — never the same image
    expect([...out].sort((a, b) => a - b)).toEqual(out) // already ascending
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...out)).toBeLessThan(1000)
  })

  it('keeps every pair ≥ the target gap on a large pool', () => {
    const out = pickSpaced(1000, 10, makeRng(7))
    expect(minGap(out)).toBeGreaterThanOrEqual(SPACING_GAP)
  })

  it('shrinks the gap to spread evenly across a small pool (modulo-divided)', () => {
    // 100 images, 10 poses → can't afford 30; evenly spaced by ⌊99/9⌋ = 11.
    const out = pickSpaced(100, 10, makeRng(3))
    expect(out).toEqual([0, 11, 22, 33, 44, 55, 66, 77, 88, 99])
    expect(minGap(out)).toBeGreaterThanOrEqual(11)
  })

  it('never repeats: caps n at the pool size, using every image once', () => {
    const out = pickSpaced(5, 10, makeRng(9))
    expect(out).toEqual([0, 1, 2, 3, 4])
  })

  it('is deterministic under a seed', () => {
    expect(pickSpaced(500, 16, makeRng(42))).toEqual(pickSpaced(500, 16, makeRng(42)))
  })

  it('varies with the seed', () => {
    expect(pickSpaced(500, 16, makeRng(1))).not.toEqual(pickSpaced(500, 16, makeRng(2)))
  })

  it('honours a custom gap', () => {
    const out = pickSpaced(1000, 8, makeRng(5), 100)
    expect(minGap(out)).toBeGreaterThanOrEqual(100)
  })

  it('handles empty and single picks', () => {
    expect(pickSpaced(0, 10, makeRng(1))).toEqual([])
    expect(pickSpaced(100, 0, makeRng(1))).toEqual([])
    expect(pickSpaced(100, 1, makeRng(1))).toHaveLength(1)
  })
})
