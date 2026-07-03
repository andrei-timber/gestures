/**
 * Reactive session store (`gestures-spec.md` §5–6). Wraps the framework-free
 * runtime reducer (`@/lib/session/runtime`) in `$state` and drives it with a
 * real 1-second interval while running. The pure machine and its coverage live
 * in `lib`; this layer only owns the wall clock and reactive exposure.
 *
 * A getter-backed object is used (rather than a bare exported `$state`) so
 * consumers read live values and mutate only through the command methods.
 */

import {
  addTime as addTimeRuntime,
  createRuntime,
  next as nextRuntime,
  pause as pauseRuntime,
  prev as prevRuntime,
  resume as resumeRuntime,
  start as startRuntime,
  tick,
  toggleMirrorH as toggleMirrorHRuntime,
  toggleMirrorV as toggleMirrorVRuntime,
  type Aids,
  type Phase,
} from '@/lib/session/runtime'
import { totalSeconds } from '@/lib/session/timing'
import type { SourceImage } from '@/state/source.svelte'

function createSessionStore() {
  let state = $state(createRuntime([]))
  // Display-ordered run images, parallel to the plan (images[i] ↔ plan[i]).
  let images = $state<readonly SourceImage[]>([])
  let timer: ReturnType<typeof setInterval> | null = null

  function stopTimer(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function startTimer(): void {
    if (timer === null) {
      timer = setInterval(() => {
        state = tick(state, 1)
        if (state.phase !== 'running') stopTimer()
      }, 1000)
    }
  }

  return {
    get phase(): Phase {
      return state.phase
    },
    get index(): number {
      return state.index
    },
    get remaining(): number {
      return state.remaining
    },
    /** 1-based pose number for display ("pose N of M"). */
    get poseNumber(): number {
      return state.index + 1
    },
    get poseCount(): number {
      return state.plan.length
    },
    /** The run's total time (active poses + rests) in seconds — for the recap. */
    get totalSeconds(): number {
      return totalSeconds([...state.plan], state.restSeconds)
    },
    /** True during the rest slide between two poses. */
    get resting(): boolean {
      return state.resting
    },
    /** Per-pose view aids (mirror/grayscale/grid); reset on every pose change. */
    get aids(): Aids {
      return state.aids
    },
    /** The reference image for the current pose, or `null` before a run loads. */
    get currentImage(): SourceImage | null {
      return images[state.index] ?? null
    },

    /**
     * Load a run: a per-pose duration plan, its display-ordered images
     * (parallel arrays), and the rest between poses. Returns to idle.
     */
    load(plan: readonly number[], runImages: readonly SourceImage[] = [], restSeconds = 0): void {
      stopTimer()
      state = createRuntime(plan, restSeconds)
      images = runImages
    },
    start(): void {
      state = startRuntime(state)
      if (state.phase === 'running') startTimer()
    },
    pause(): void {
      state = pauseRuntime(state)
      stopTimer()
    },
    resume(): void {
      state = resumeRuntime(state)
      if (state.phase === 'running') startTimer()
    },
    /** Skip to the next pose (scrubbing); ends the run past the last pose. */
    next(): void {
      state = nextRuntime(state)
      if (state.phase !== 'running') stopTimer()
    },
    /** Skip to the previous pose (scrubbing). Clamps at the first pose. */
    prev(): void {
      state = prevRuntime(state)
    },
    /** Extend the current pose, adding time to its live countdown. */
    addTime(): void {
      state = addTimeRuntime(state)
    },
    /** Flip the current pose horizontally (per-pose sanity check). */
    toggleMirrorH(): void {
      state = toggleMirrorHRuntime(state)
    },
    /** Flip the current pose vertically (per-pose sanity check). */
    toggleMirrorV(): void {
      state = toggleMirrorVRuntime(state)
    },
  }
}

/** The app-wide live session. */
export const session = createSessionStore()
