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
  end as endRuntime,
  next as nextRuntime,
  pause as pauseRuntime,
  posesDrawn as posesDrawnRuntime,
  prev as prevRuntime,
  resetPoseTime as resetPoseTimeRuntime,
  resume as resumeRuntime,
  start as startRuntime,
  tick,
  toggleGrayscale as toggleGrayscaleRuntime,
  toggleGrid as toggleGridRuntime,
  toggleMirrorH as toggleMirrorHRuntime,
  toggleMirrorV as toggleMirrorVRuntime,
  type Aids,
  type Phase,
} from '@/lib/session/runtime'
import { SvelteSet } from 'svelte/reactivity'
import { pickSpare, refreshRun } from '@/lib/session/refresh'
import { totalSeconds } from '@/lib/session/timing'
import { prefetchIndices, warm } from '@/lib/source/preload'
import type { SourceImage } from '@/state/source.svelte'

function createSessionStore() {
  let state = $state(createRuntime([]))
  // Display-ordered run images, parallel to the plan (images[i] ↔ plan[i]).
  let images = $state<readonly SourceImage[]>([])
  // The full loaded pool (superset of the run) and every URL ever placed in the
  // run — the residual `pool \ used` is what Refresh draws fresh images from.
  let pool = $state<readonly SourceImage[]>([])
  // Reactive so `canRefresh` re-derives as spares are consumed; mutated in place.
  const used = new SvelteSet<string>()
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
    /** Planned duration (seconds) of the current pose — the pace-cue denominator. */
    get poseDuration(): number {
      return state.plan[state.index] ?? 0
    },
    /** 1-based pose number for display ("pose N of M"). */
    get poseNumber(): number {
      return state.index + 1
    },
    get poseCount(): number {
      return state.plan.length
    },
    /** The run's *planned* total time (active poses + rests) in seconds. */
    get totalSeconds(): number {
      return totalSeconds([...state.plan], state.restSeconds)
    },
    /**
     * Poses actually reached (1-based) — equals {@link poseCount} on a full run,
     * lower when ended early. The truthful figure for the recap.
     */
    get posesDrawn(): number {
      return posesDrawnRuntime(state)
    },
    /** Seconds actually spent in the run (excludes paused time) — the truthful recap duration. */
    get elapsedSeconds(): number {
      return state.elapsed
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
     * The image URLs to warm around `index` — the prefetch window, read straight
     * off the run images. Indexes only the handful of window positions, so a pose
     * swap never allocates a URL for every image in a large run.
     */
    prefetchUrls(index: number): string[] {
      return prefetchIndices(images.length, index).map((i) => images[i].url)
    },

    /**
     * True when Refresh can swap the current pose for an unseen image: a live
     * pose (running or paused, not resting) and at least one pool image never
     * placed in the run. Drives the Refresh control's disabled state.
     */
    get canRefresh(): boolean {
      if (state.phase !== 'running' && state.phase !== 'paused') return false
      if (state.resting) return false
      return pool.some((img) => !used.has(img.url))
    },

    /**
     * Load a run: a per-pose duration plan, its display-ordered images
     * (parallel arrays), the rest between poses, and the full loaded pool the
     * images were drawn from (its residual feeds Refresh; defaults to the run
     * images, i.e. no spares). Returns to idle.
     */
    load(
      plan: readonly number[],
      runImages: readonly SourceImage[] = [],
      restSeconds = 0,
      sourcePool: readonly SourceImage[] = runImages,
    ): void {
      stopTimer()
      state = createRuntime(plan, restSeconds)
      images = runImages
      pool = sourcePool
      used.clear()
      for (const img of runImages) used.add(img.url)
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
    /** End the run now (manual End / `Esc`): stop the clock and freeze the recap. */
    end(): void {
      state = endRuntime(state)
      stopTimer()
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
    /**
     * Swap the current reference for an unseen one (spec §6 refresh): pull the
     * next — already-prefetched — pose into the current slot for an instant
     * paint, backfill the tail from a random spare, and reset the pose clock to
     * full. The displaced image leaves the run, so nothing seen recurs. No-op
     * when no spare remains (see {@link canRefresh}). `Math.random` is the edge's
     * seed, matching the run-start selection — the pure picking is injected.
     */
    refresh(): void {
      if (state.phase !== 'running' && state.phase !== 'paused') return
      if (state.resting) return
      const spare = pickSpare(pool, used, Math.random)
      if (spare === null) return
      images = refreshRun(images, state.index, spare)
      used.add(spare.url)
      state = resetPoseTimeRuntime(state)
      // Warm the just-swapped current (cold only on the final pose) and the new
      // tail, so the swap and the eventual advance both paint without a hitch.
      void warm([images[state.index].url, images[images.length - 1].url])
    },
    /** Flip the current pose horizontally (per-pose sanity check). */
    toggleMirrorH(): void {
      state = toggleMirrorHRuntime(state)
    },
    /** Flip the current pose vertically (per-pose sanity check). */
    toggleMirrorV(): void {
      state = toggleMirrorVRuntime(state)
    },
    /** Desaturate the current pose to value only (per-pose sanity check). */
    toggleGrayscale(): void {
      state = toggleGrayscaleRuntime(state)
    },
    /** Toggle the rule-of-thirds construction grid (per-pose sanity check). */
    toggleGrid(): void {
      state = toggleGridRuntime(state)
    },
  }
}

/** The app-wide live session. */
export const session = createSessionStore()
