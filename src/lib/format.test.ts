import { describe, expect, it } from 'vitest'
import { formatDuration } from './format'

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
