import { describe, expect, it } from 'vitest'
import { cueBand } from './cue'

describe('cueBand (pace tint, spec §6)', () => {
  it('bands a 100s pose by remaining share, inclusive upper edges', () => {
    // green: first half (≥50% left)
    expect(cueBand(100, 100)).toBe('green')
    expect(cueBand(50, 100)).toBe('green')
    // yellow: 20–50% left (50–80% elapsed)
    expect(cueBand(49, 100)).toBe('yellow')
    expect(cueBand(20, 100)).toBe('yellow')
    // orange: 5–20% left (80–95% elapsed)
    expect(cueBand(19, 100)).toBe('orange')
    expect(cueBand(5, 100)).toBe('orange')
    // red: final 5%
    expect(cueBand(4, 100)).toBe('red')
    expect(cueBand(0, 100)).toBe('red')
  })

  it('reads a freshly extended pose (remaining > total) as green', () => {
    expect(cueBand(130, 100)).toBe('green')
  })

  it('reads no live pose (total ≤ 0) as green', () => {
    expect(cueBand(0, 0)).toBe('green')
  })
})
