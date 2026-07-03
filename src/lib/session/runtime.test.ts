import { describe, expect, it } from 'vitest'
import { createRuntime, pause, resume, start, tick, type RuntimeState } from './runtime'

/** Drive a runtime through `seconds` one-second ticks (the real interval cadence). */
function run(state: RuntimeState, seconds: number): RuntimeState {
  let s = state
  for (let i = 0; i < seconds; i++) s = tick(s, 1)
  return s
}

describe('createRuntime', () => {
  it('parks idle on the first pose with its full duration', () => {
    const s = createRuntime([60, 120, 300])
    expect(s).toEqual({ phase: 'idle', plan: [60, 120, 300], index: 0, remaining: 60 })
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
