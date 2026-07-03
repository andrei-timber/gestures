import { describe, expect, it } from 'vitest'
import { classPlan } from './caps'
import { buildPlan } from './plan'
import { quickPlan } from './quick'
import { DEFAULT_SETTINGS } from './settings'

describe('buildPlan', () => {
  it('uses the Class distribution in Class mode', () => {
    expect(buildPlan({ ...DEFAULT_SETTINGS, mode: 'class', poseCount: 16 })).toEqual(classPlan(16))
  })

  it('uses the uniform interval in Quick mode', () => {
    expect(buildPlan({ mode: 'quick', poseCount: 12, intervalSeconds: 120 })).toEqual(
      quickPlan(12, 120),
    )
  })

  it('ignores the interval in Class mode', () => {
    const a = buildPlan({ mode: 'class', poseCount: 20, intervalSeconds: 30 })
    const b = buildPlan({ mode: 'class', poseCount: 20, intervalSeconds: 300 })
    expect(a).toEqual(b)
  })

  it('caps the Quick plan to the pool size, even below the minimum', () => {
    const plan = buildPlan({ mode: 'quick', poseCount: 12, intervalSeconds: 60 }, 4)
    expect(plan).toEqual(new Array(4).fill(60))
  })

  it('caps the Class count to the pool size (folder ≥ minimum)', () => {
    // 20 requested but only 15 images: a proper 15-pose distribution, not 20.
    expect(buildPlan({ mode: 'class', poseCount: 20, intervalSeconds: 30 }, 15)).toEqual(
      classPlan(15),
    )
  })
})
