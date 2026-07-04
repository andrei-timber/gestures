import { describe, expect, it } from 'vitest'
import { distribute } from './distribute'
import { capTenMinPoses, classCeiling, classPlan, clampN } from './caps'
import { MAX_ACTIVE_SECONDS, MIN_POSES } from './limits'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const tens = (xs: number[]) => xs.filter((s) => s === 600).length

describe('classCeiling', () => {
  it('is the last count within the 90-min active cap (30 → 90m)', () => {
    const ceiling = classCeiling()
    expect(ceiling).toBe(30)
    expect(sum(distribute(ceiling))).toBeLessThanOrEqual(MAX_ACTIVE_SECONDS)
    expect(sum(distribute(ceiling + 1))).toBeGreaterThan(MAX_ACTIVE_SECONDS)
  })
})

describe('clampN', () => {
  it('holds counts within [min, ceiling] unchanged', () => {
    expect(clampN(10)).toBe(10)
    expect(clampN(20)).toBe(20)
    expect(clampN(30)).toBe(30)
  })

  it('clamps below the minimum up to MIN_POSES', () => {
    expect(clampN(5)).toBe(MIN_POSES)
    expect(clampN(0)).toBe(MIN_POSES)
  })

  it('clamps over the ceiling down to it', () => {
    expect(clampN(31)).toBe(30)
    expect(clampN(1000)).toBe(30)
  })

  it('floors non-integer counts', () => {
    expect(clampN(15.7)).toBe(15)
  })
})

describe('capTenMinPoses', () => {
  it('leaves compliant distributions untouched (N=30 → 3×10m, 90m)', () => {
    const capped = capTenMinPoses(distribute(30))
    expect(capped).toEqual(distribute(30))
    expect(tens(capped)).toBe(3)
    expect(sum(capped)).toBe(90 * 60)
  })

  it('demotes excess 10-min poses to 5 min (unclamped N=36 → 4 tens)', () => {
    const raw = distribute(36)
    expect(tens(raw)).toBe(4)
    const capped = capTenMinPoses(raw)
    expect(tens(capped)).toBe(3)
    // one ten-min pose became five-min; the demotion lowers total by 5 min
    expect(sum(raw) - sum(capped)).toBe(5 * 60)
  })
})

describe('classPlan', () => {
  it('clamps over-ceiling requests before distributing', () => {
    expect(classPlan(100)).toHaveLength(30)
    expect(sum(classPlan(100))).toBeLessThanOrEqual(MAX_ACTIVE_SECONDS)
  })

  it('never yields more than three 10-min poses', () => {
    for (let n = 10; n <= 40; n++) expect(tens(classPlan(n))).toBeLessThanOrEqual(3)
  })
})
