import { describe, expect, it } from 'vitest'
import { createRuntime, next, pause, prev, resume, start, tick, type RuntimeState } from './runtime'

/** Drive a runtime through `seconds` one-second ticks (the real interval cadence). */
function run(state: RuntimeState, seconds: number): RuntimeState {
  let s = state
  for (let i = 0; i < seconds; i++) s = tick(s, 1)
  return s
}

describe('createRuntime', () => {
  it('parks idle on the first pose with its full duration', () => {
    const s = createRuntime([60, 120, 300])
    expect(s).toEqual({
      phase: 'idle',
      plan: [60, 120, 300],
      restSeconds: 0,
      index: 0,
      remaining: 60,
      resting: false,
    })
  })

  it('tolerates an empty plan', () => {
    expect(createRuntime([])).toMatchObject({ phase: 'idle', index: 0, remaining: 0 })
  })
})

describe('transitions', () => {
  it('runs the idle → running → paused → running path', () => {
    const idle = createRuntime([60])
    expect(start(idle).phase).toBe('running')
    expect(pause(start(idle)).phase).toBe('paused')
    expect(resume(pause(start(idle))).phase).toBe('running')
  })

  it('ignores commands that do not apply to the current phase', () => {
    const idle = createRuntime([60])
    expect(pause(idle)).toBe(idle) // can't pause before starting
    expect(resume(idle)).toBe(idle)
    expect(start(start(idle))).toEqual(start(idle)) // start is idempotent past idle
  })
})

describe('tick', () => {
  it('does nothing unless running', () => {
    const idle = createRuntime([60])
    expect(tick(idle, 1)).toBe(idle)
    expect(tick(pause(start(idle)), 1)).toMatchObject({ phase: 'paused' })
  })

  it('drains the current pose second by second', () => {
    const s = run(start(createRuntime([3, 60])), 2)
    expect(s).toMatchObject({ phase: 'running', index: 0, remaining: 1 })
  })

  it('rolls into the next pose at its full duration when one drains', () => {
    const s = run(start(createRuntime([3, 60])), 3)
    expect(s).toMatchObject({ phase: 'running', index: 1, remaining: 60 })
  })

  it('carries overflow forward across a large delta', () => {
    // 3 + 4 = 7s consumed by a single 8s delta → 1s into pose 3 (10s long).
    const s = tick(start(createRuntime([3, 4, 10])), 8)
    expect(s).toMatchObject({ phase: 'running', index: 2, remaining: 9 })
  })

  it('ends the session when the final pose drains', () => {
    const s = run(start(createRuntime([2, 2])), 4)
    expect(s).toMatchObject({ phase: 'ended', index: 1, remaining: 0 })
  })

  it('stays ended and ignores further ticks', () => {
    const ended = run(start(createRuntime([1])), 1)
    expect(ended.phase).toBe('ended')
    expect(tick(ended, 5)).toBe(ended)
  })
})

describe('rests between poses', () => {
  it('enters a rest slide when an active pose drains', () => {
    const s = run(start(createRuntime([3, 60], 5)), 3)
    expect(s).toMatchObject({ phase: 'running', index: 0, remaining: 5, resting: true })
  })

  it('leaves the rest into the next pose at its full duration', () => {
    const s = run(start(createRuntime([3, 60], 5)), 8) // 3s pose + 5s rest
    expect(s).toMatchObject({ phase: 'running', index: 1, remaining: 60, resting: false })
  })

  it('never rests after the final pose — it ends instead', () => {
    const s = run(start(createRuntime([2, 2], 5)), 9) // 2 + 5 rest + 2
    expect(s).toMatchObject({ phase: 'ended', index: 1, resting: false })
  })

  it('skips rests entirely when restSeconds is 0', () => {
    const s = run(start(createRuntime([3, 60], 0)), 3)
    expect(s).toMatchObject({ index: 1, remaining: 60, resting: false })
  })

  it('carries overflow across a rest on a large delta', () => {
    // 3s pose0 + 2s rest + 1s into pose1 (4s) = 6s.
    const s = tick(start(createRuntime([3, 4, 10], 2)), 6)
    expect(s).toMatchObject({ index: 1, remaining: 3, resting: false })
  })

  it('clears the rest when skipping with next/prev', () => {
    const resting = run(start(createRuntime([3, 60, 60], 5)), 3)
    expect(resting.resting).toBe(true)
    expect(next(resting)).toMatchObject({ index: 1, resting: false })
    const back = run(start(createRuntime([3, 60, 60], 5)), 3)
    expect(prev(next(back))).toMatchObject({ index: 0, resting: false })
  })
})

describe('next / prev', () => {
  it('jumps to the next pose at its full duration', () => {
    const s = run(start(createRuntime([60, 120, 300])), 5) // 5s into pose 1
    expect(next(s)).toMatchObject({ index: 1, remaining: 120, phase: 'running' })
  })

  it('jumps back to the previous pose at its full duration', () => {
    const s = run(start(createRuntime([60, 120, 300])), 65) // 5s into pose 2
    expect(prev(s)).toMatchObject({ index: 0, remaining: 60, phase: 'running' })
  })

  it('ends the session when stepping past the final pose', () => {
    const s = start(createRuntime([60, 120]))
    expect(next(next(s))).toMatchObject({ phase: 'ended', remaining: 0 })
  })

  it('clamps prev at the first pose', () => {
    const s = start(createRuntime([60, 120]))
    expect(prev(s)).toBe(s)
  })

  it('works while paused (scrubbing without the clock running)', () => {
    const paused = pause(start(createRuntime([60, 120, 300])))
    expect(next(paused)).toMatchObject({ index: 1, remaining: 120, phase: 'paused' })
    expect(prev(next(next(paused)))).toMatchObject({ index: 1, phase: 'paused' })
  })

  it('is inert from idle or ended phases', () => {
    const idle = createRuntime([60, 120])
    expect(next(idle)).toBe(idle)
    expect(prev(idle)).toBe(idle)
    const ended = run(start(createRuntime([1])), 1)
    expect(next(ended)).toBe(ended)
  })
})
