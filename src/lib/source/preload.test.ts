import { describe, expect, it } from 'vitest'
import { PREFETCH_AHEAD, prefetchIndices } from './preload'

const LEN = 5 // a 5-pose run

describe('prefetchIndices', () => {
  it('warms the next `ahead` poses plus the one behind, nearest-ahead first', () => {
    expect(prefetchIndices(LEN, 2, 2)).toEqual([3, 4, 1])
  })

  it('has no behind entry at the start', () => {
    expect(prefetchIndices(LEN, 0, 2)).toEqual([1, 2])
  })

  it('clamps at the end — only the behind pose remains on the last index', () => {
    expect(prefetchIndices(LEN, 4, 2)).toEqual([3])
  })

  it('excludes the current pose (already painted)', () => {
    expect(prefetchIndices(LEN, 2, 2)).not.toContain(2)
  })

  it('drops out-of-bounds neighbours on very short runs', () => {
    expect(prefetchIndices(2, 0, 2)).toEqual([1]) // ahead=2 but only index 1 exists, no behind
    expect(prefetchIndices(1, 0, 2)).toEqual([]) // nothing to warm
  })

  it('defaults to PREFETCH_AHEAD look-ahead', () => {
    expect(prefetchIndices(LEN, 0)).toEqual(prefetchIndices(LEN, 0, PREFETCH_AHEAD))
  })
})
