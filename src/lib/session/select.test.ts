import { describe, expect, it } from 'vitest'
import { makeRng } from './order'
import { selectRun } from './select'

const items = (n: number) => Array.from({ length: n }, (_, i) => `img${i}`)

describe('selectRun', () => {
  it('returns n distinct items drawn from the pool', () => {
    const pool = items(100)
    const run = selectRun(pool, 10, makeRng(1))
    expect(run).toHaveLength(10)
    expect(new Set(run).size).toBe(10)
    for (const x of run) expect(pool).toContain(x)
  })

  it('caps at the pool size (no repeats beyond the pool)', () => {
    const pool = items(6)
    const run = selectRun(pool, 10, makeRng(1))
    expect(run).toHaveLength(6)
    expect(new Set(run).size).toBe(6)
  })

  it('keeps ascending source order when randomize is off', () => {
    const pool = items(100)
    const run = selectRun(pool, 8, makeRng(4), false)
    const indices = run.map((x) => pool.indexOf(x))
    expect([...indices].sort((a, b) => a - b)).toEqual(indices)
  })

  it('reorders away from source order when randomize is on', () => {
    const pool = items(100)
    const run = selectRun(pool, 8, makeRng(4), true)
    const indices = run.map((x) => pool.indexOf(x))
    expect([...indices].sort((a, b) => a - b)).not.toEqual(indices)
  })

  it('is deterministic under the same seed', () => {
    const pool = items(100)
    expect(selectRun(pool, 10, makeRng(9))).toEqual(selectRun(pool, 10, makeRng(9)))
  })

  it('handles empty pools and zero counts', () => {
    expect(selectRun(items(50), 0, makeRng(1))).toEqual([])
    expect(selectRun([], 5, makeRng(1))).toEqual([])
  })
})
