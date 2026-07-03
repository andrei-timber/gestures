import { describe, expect, it } from 'vitest'
import { PREFETCH_AHEAD, prefetchWindow } from './preload'

const urls = ['a', 'b', 'c', 'd', 'e']

describe('prefetchWindow', () => {
  it('warms the next `ahead` poses plus the one behind, nearest-ahead first', () => {
    expect(prefetchWindow(urls, 2, 2)).toEqual(['d', 'e', 'b'])
  })

  it('has no behind entry at the start', () => {
    expect(prefetchWindow(urls, 0, 2)).toEqual(['b', 'c'])
  })

  it('clamps at the end — only the behind pose remains on the last index', () => {
    expect(prefetchWindow(urls, 4, 2)).toEqual(['d'])
  })

  it('excludes the current pose (already painted)', () => {
    expect(prefetchWindow(urls, 2, 2)).not.toContain('c')
  })

  it('de-duplicates overlap on very short runs', () => {
    expect(prefetchWindow(['a', 'b'], 0, 2)).toEqual(['b']) // ahead=2 but only b exists, no behind
    expect(prefetchWindow(['a'], 0, 2)).toEqual([]) // nothing to warm
  })

  it('defaults to PREFETCH_AHEAD look-ahead', () => {
    expect(prefetchWindow(urls, 0)).toEqual(prefetchWindow(urls, 0, PREFETCH_AHEAD))
  })
})
