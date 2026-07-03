import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration } from './format'

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
