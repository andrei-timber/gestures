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
  createRuntime,
  pause as pauseRuntime,
  resume as resumeRuntime,
  start as startRuntime,
  tick,
  type Phase,
} from '@/lib/session/runtime'
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
    /** The reference image for the current pose, or `null` before a run loads. */
    get currentImage(): SourceImage | null {
      return images[state.index] ?? null
    },

    /**
     * Load a run: a per-pose duration plan and its display-ordered images
     * (parallel arrays). Returns to idle.
     */
    load(plan: readonly number[], runImages: readonly SourceImage[] = []): void {
      stopTimer()
      state = createRuntime(plan)
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
  }
}

/** The app-wide live session. */
export const session = createSessionStore()
