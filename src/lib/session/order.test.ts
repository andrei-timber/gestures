import { describe, expect, it } from 'vitest'
import { makeRng, shuffle } from './order'

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

describe('makeRng', () => {
  it('is deterministic per seed and emits values in [0, 1)', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    const seq = Array.from({ length: 5 }, () => a())
    expect(Array.from({ length: 5 }, () => b())).toEqual(seq)
    for (const v of seq) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('produces different streams for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)())
  })
})

describe('shuffle', () => {
  it('is a permutation — every item once, none repeated, length preserved', () => {
    const input = range(20)
    const out = shuffle(input, makeRng(7))
    expect(out).toHaveLength(input.length)
    expect([...out].sort((x, y) => x - y)).toEqual(input)
    expect(new Set(out).size).toBe(input.length)
  })

  it('does not mutate the input', () => {
    const input = range(10)
    const copy = [...input]
    shuffle(input, makeRng(3))
    expect(input).toEqual(copy)
  })

  it('is deterministic under the same seed', () => {
    const input = range(20)
    expect(shuffle(input, makeRng(99))).toEqual(shuffle(input, makeRng(99)))
  })

  it('actually reorders (not the identity) for a typical seed', () => {
    const input = range(20)
    expect(shuffle(input, makeRng(123))).not.toEqual(input)
  })

  it('handles empty and single-element pools', () => {
    expect(shuffle([], makeRng(1))).toEqual([])
    expect(shuffle(['only'], makeRng(1))).toEqual(['only'])
  })
})
