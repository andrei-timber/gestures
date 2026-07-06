import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, formatPoseLength, formatSequence } from './format'

describe('formatDuration', () => {
  it('rounds to whole minutes under an hour', () => {
    expect(formatDuration(26 * 60)).toBe('26 min')
    expect(formatDuration(46 * 60)).toBe('46 min')
    expect(formatDuration(90)).toBe('2 min') // 1.5 min rounds up
  })

  it('rolls into hours past 60 minutes', () => {
    expect(formatDuration(81 * 60)).toBe('1 h 21 min')
    expect(formatDuration(120 * 60)).toBe('2 h 0 min')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0 min')
  })
})

describe('formatClock', () => {
  it('renders m:ss with a zero-padded seconds field', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(5)).toBe('0:05')
    expect(formatClock(60)).toBe('1:00')
    expect(formatClock(90)).toBe('1:30')
    expect(formatClock(600)).toBe('10:00')
  })

  it('floors fractional seconds and clamps negatives to 0:00', () => {
    expect(formatClock(59.9)).toBe('0:59')
    expect(formatClock(-3)).toBe('0:00')
  })
})

describe('formatPoseLength', () => {
  it('renders whole minutes, sub-minute seconds, and half-minute steps', () => {
    expect(formatPoseLength(60)).toBe('1 min')
    expect(formatPoseLength(120)).toBe('2 min')
    expect(formatPoseLength(600)).toBe('10 min')
    expect(formatPoseLength(30)).toBe('30s')
    expect(formatPoseLength(90)).toBe('1.5 min')
  })
})

describe('formatSequence', () => {
  it('collapses consecutive equal durations into N× groups', () => {
    // A Class plan: ascending 1/2/5/10-min tiers.
    expect(formatSequence([60, 60, 60, 60, 120, 120, 120, 300, 300, 600])).toBe(
      '4× 1 min → 3× 2 min → 2× 5 min → 1× 10 min',
    )
  })

  it('collapses a uniform Quick run to a single group', () => {
    expect(formatSequence([120, 120, 120, 120])).toBe('4× 2 min')
  })

  it('returns an empty string for an empty plan', () => {
    expect(formatSequence([])).toBe('')
  })
})
