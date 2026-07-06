import { describe, expect, it } from 'vitest'
import { pickSpare, refreshRun } from './refresh'

const img = (url: string) => ({ url })

describe('pickSpare', () => {
  it('returns an unseen pool image, skipping used URLs', () => {
    const pool = [img('a'), img('b'), img('c')]
    const used = new Set(['a', 'c'])
    // rng 0 → first spare; only 'b' is unseen.
    expect(pickSpare(pool, used, () => 0)).toEqual(img('b'))
  })

  it('indexes into the spares by the RNG draw', () => {
    const pool = [img('a'), img('b'), img('c'), img('d')]
    const used = new Set(['a']) // spares: b, c, d
    expect(pickSpare(pool, used, () => 0.99)).toEqual(img('d'))
    expect(pickSpare(pool, used, () => 0.5)).toEqual(img('c'))
  })

  it('returns null when every pool image is already used', () => {
    const pool = [img('a'), img('b')]
    expect(pickSpare(pool, new Set(['a', 'b']), () => 0)).toBeNull()
  })
})

describe('refreshRun', () => {
  it('slides upcoming poses forward and drops the spare at the tail', () => {
    const run = [img('a'), img('b'), img('c'), img('d')]
    // Refresh at index 1 (b): c,d shift forward, spare lands last, b is dropped.
    expect(refreshRun(run, 1, img('x'))).toEqual([img('a'), img('c'), img('d'), img('x')])
  })

  it('never re-shows the displaced image', () => {
    const run = [img('a'), img('b'), img('c')]
    const next = refreshRun(run, 0, img('x'))
    expect(next.map((i) => i.url)).not.toContain('a')
    expect(next).toHaveLength(3)
  })

  it('drops the spare straight into the current slot on the final pose', () => {
    const run = [img('a'), img('b'), img('c')]
    expect(refreshRun(run, 2, img('x'))).toEqual([img('a'), img('b'), img('x')])
  })

  it('leaves the original array untouched', () => {
    const run = [img('a'), img('b')]
    refreshRun(run, 0, img('x'))
    expect(run).toEqual([img('a'), img('b')])
  })
})
