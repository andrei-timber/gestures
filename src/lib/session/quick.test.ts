import { describe, expect, it } from 'vitest'
import { MIN_POSES } from './limits'
import {
  DEFAULT_INTERVAL_SECONDS,
  clampNQuick,
  customIntervalSeconds,
  quickCeiling,
  quickPlan,
} from './quick'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('customIntervalSeconds', () => {
  it('converts minutes to whole seconds', () => {
    expect(customIntervalSeconds(3)).toBe(180)
    expect(customIntervalSeconds(1.5)).toBe(90)
  })
})

describe('quickPlan', () => {
  it('produces a uniform array of the interval at the default 60s', () => {
    expect(quickPlan(10, DEFAULT_INTERVAL_SECONDS)).toEqual(new Array(10).fill(60))
  })

  it('honours preset intervals uniformly', () => {
    expect(quickPlan(12, 30)).toEqual(new Array(12).fill(30))
    expect(quickPlan(10, 300)).toEqual(new Array(10).fill(300))
  })

  it('works with a custom minute interval', () => {
    expect(quickPlan(10, customIntervalSeconds(3))).toEqual(new Array(10).fill(180))
  })

  it('raises counts below the minimum up to MIN_POSES', () => {
    expect(quickPlan(5, 60)).toHaveLength(MIN_POSES)
  })

  it('clamps N so active time never exceeds 90 min', () => {
    const plan = quickPlan(1000, 60)
    expect(plan).toHaveLength(90)
    expect(sum(plan)).toBeLessThanOrEqual(90 * 60)
  })

  it('lets the hard cap win over the minimum for large intervals', () => {
    // 10-min interval → only 9 poses fit in 90 min, below MIN_POSES.
    const interval = customIntervalSeconds(10)
    expect(quickCeiling(interval)).toBe(9)
    expect(clampNQuick(10, interval)).toBe(9)
    expect(sum(quickPlan(10, interval))).toBeLessThanOrEqual(90 * 60)
  })

  it('lets a small pool cap pull the count below MIN_POSES', () => {
    // A folder of 4 images runs exactly 4 poses, not the 10-pose floor.
    expect(clampNQuick(10, 60, 4)).toBe(4)
    expect(quickPlan(10, 60, 4)).toEqual(new Array(4).fill(60))
  })

  it('ignores a pool cap larger than the requested count', () => {
    expect(quickPlan(10, 60, 100)).toEqual(new Array(10).fill(60))
  })
})
