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
})
