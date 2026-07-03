import { describe, expect, it } from 'vitest'
import {
  ADD_TIME_SECONDS,
  addTime,
  createRuntime,
  next,
  pause,
  prev,
  resume,
  start,
  tick,
  toggleGrayscale,
  toggleMirrorH,
  toggleMirrorV,
  type RuntimeState,
} from './runtime'

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
      aids: { mirrorH: false, mirrorV: false, grayscale: false },
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

describe('addTime', () => {
  it('extends the current pose by the default increment, clock keeps ticking', () => {
    const s = run(start(createRuntime([60, 120])), 5) // 55s left on pose 1
    const extended = addTime(s)
    expect(extended).toMatchObject({ index: 0, remaining: 55 + ADD_TIME_SECONDS, phase: 'running' })
    // Still a live pose: a further tick drains normally from the extended clock.
    expect(tick(extended, 1).remaining).toBe(54 + ADD_TIME_SECONDS)
  })

  it('accepts a custom amount and works while paused', () => {
    const paused = pause(run(start(createRuntime([60])), 10)) // 50s left, paused
    expect(addTime(paused, 15)).toMatchObject({ remaining: 65, phase: 'paused' })
  })

  it('is ignored during a rest slide', () => {
    const resting = run(start(createRuntime([60, 120], 10)), 60) // just entered the rest
    expect(resting.resting).toBe(true)
    expect(addTime(resting)).toBe(resting)
  })

  it('is inert from idle or ended phases', () => {
    const idle = createRuntime([60])
    expect(addTime(idle)).toBe(idle)
    const ended = run(start(createRuntime([1])), 1)
    expect(addTime(ended)).toBe(ended)
  })
})

describe('mirror aids', () => {
  it('toggles H and V independently and composes them', () => {
    const s = start(createRuntime([60, 120]))
    expect(toggleMirrorH(s).aids).toMatchObject({ mirrorH: true, mirrorV: false })
    expect(toggleMirrorV(s).aids).toMatchObject({ mirrorH: false, mirrorV: true })
    const both = toggleMirrorV(toggleMirrorH(s))
    expect(both.aids).toMatchObject({ mirrorH: true, mirrorV: true })
    // A second press flips it back off.
    expect(toggleMirrorH(toggleMirrorH(s)).aids.mirrorH).toBe(false)
  })

  it('works while paused', () => {
    const paused = pause(start(createRuntime([60])))
    expect(toggleMirrorH(paused)).toMatchObject({ phase: 'paused', aids: { mirrorH: true } })
  })

  it('is inert from idle or ended phases', () => {
    const idle = createRuntime([60])
    expect(toggleMirrorH(idle)).toBe(idle)
    expect(toggleMirrorV(idle)).toBe(idle)
    const ended = run(start(createRuntime([1])), 1)
    expect(toggleMirrorH(ended)).toBe(ended)
  })

  it('resets when scrubbing to the next or previous pose', () => {
    const flipped = toggleMirrorH(run(start(createRuntime([60, 120, 300])), 5))
    expect(flipped.aids.mirrorH).toBe(true)
    expect(next(flipped).aids).toMatchObject({ mirrorH: false, mirrorV: false })
    const onPose2 = toggleMirrorV(next(flipped))
    expect(onPose2.aids.mirrorV).toBe(true)
    expect(prev(onPose2).aids).toMatchObject({ mirrorH: false, mirrorV: false })
  })

  it('resets when the clock auto-advances to the next pose', () => {
    const flipped = toggleMirrorH(start(createRuntime([3, 60])))
    expect(flipped.aids.mirrorH).toBe(true)
    expect(run(flipped, 3).aids).toMatchObject({ mirrorH: false, mirrorV: false })
  })

  it('survives ticks within the same pose, resets across a rest', () => {
    const flipped = toggleMirrorH(start(createRuntime([5, 60], 3)))
    expect(run(flipped, 2).aids.mirrorH).toBe(true) // still pose 0
    expect(run(flipped, 6).aids.mirrorH).toBe(true) // 5s pose + 1s rest — pose 0 not yet left
    expect(run(flipped, 8).aids).toMatchObject({ mirrorH: false, mirrorV: false }) // into pose 1
  })
})

describe('grayscale aid', () => {
  it('toggles on and off, independent of the mirror flags', () => {
    const s = start(createRuntime([60, 120]))
    expect(toggleGrayscale(s).aids).toMatchObject({ grayscale: true, mirrorH: false })
    expect(toggleGrayscale(toggleGrayscale(s)).aids.grayscale).toBe(false)
    // Composes with a mirror without disturbing it.
    expect(toggleGrayscale(toggleMirrorH(s)).aids).toMatchObject({ grayscale: true, mirrorH: true })
  })

  it('works while paused', () => {
    const paused = pause(start(createRuntime([60])))
    expect(toggleGrayscale(paused)).toMatchObject({ phase: 'paused', aids: { grayscale: true } })
  })

  it('is inert from idle or ended phases', () => {
    const idle = createRuntime([60])
    expect(toggleGrayscale(idle)).toBe(idle)
    const ended = run(start(createRuntime([1])), 1)
    expect(toggleGrayscale(ended)).toBe(ended)
  })

  it('resets on the next pose (scrub and auto-advance)', () => {
    const gray = toggleGrayscale(run(start(createRuntime([3, 60])), 1))
    expect(gray.aids.grayscale).toBe(true)
    expect(next(gray).aids.grayscale).toBe(false)
    expect(run(gray, 3).aids.grayscale).toBe(false) // auto-advanced into pose 1
  })
})
