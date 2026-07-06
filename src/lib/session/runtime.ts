/**
 * Session runtime state machine (`gestures-spec.md` §5–6) — the framework-free
 * core the reactive store drives. A slideshow walks a per-pose duration plan:
 *
 *   idle ──start──▶ running ──(time)──▶ ended
 *                    ▲   │
 *              resume│   │pause
 *                    │   ▼
 *                   paused
 *
 * Time is injected as a delta into {@link tick} — no clock in here — so the
 * whole machine is deterministic and node-testable, matching the injected-RNG
 * approach in `order.ts`. Transitions are pure: each returns a fresh state and
 * ignores commands that don't apply to the current phase.
 */

/** Lifecycle phase of a session. */
export type Phase = 'idle' | 'running' | 'paused' | 'ended'

/**
 * Per-pose view aids — mirror/grayscale/grid sanity-check tools the artist flips
 * while drawing the pose in front of them (spec §6). They are scoped to the
 * current pose and **reset on every pose change** (next/prev/auto-advance),
 * never carried across — flipping is a check against the pose you're on, not a
 * session-wide setting.
 */
export interface Aids {
  mirrorH: boolean
  mirrorV: boolean
  grayscale: boolean
  grid: boolean
}

const NO_AIDS: Aids = { mirrorH: false, mirrorV: false, grayscale: false, grid: false }

export interface RuntimeState {
  phase: Phase
  /** Per-pose durations in seconds; also fixes the pose count. */
  readonly plan: readonly number[]
  /** Rest slide between poses, seconds; 0 disables rests. */
  readonly restSeconds: number
  /** 0-based index of the current pose. */
  index: number
  /** Seconds left on the current pose — or on the rest slide while resting. */
  remaining: number
  /** True during the rest slide that falls after `index`'s pose. */
  resting: boolean
  /** Seconds actually ticked so far (poses + rests, excludes paused time) — for a truthful recap. */
  elapsed: number
  /** View aids for the current pose; cleared whenever the pose changes. */
  readonly aids: Aids
}

/** A fresh idle runtime parked on the first pose of `plan`. */
export function createRuntime(plan: readonly number[], restSeconds = 0): RuntimeState {
  return {
    phase: 'idle',
    plan,
    restSeconds,
    index: 0,
    remaining: plan[0] ?? 0,
    resting: false,
    elapsed: 0,
    aids: NO_AIDS,
  }
}

/**
 * Poses actually reached so far, as a 1-based count — the figure a truthful
 * recap reports. On a full run this equals the plan length; ending early leaves
 * it at the pose in progress. 0 for an empty plan.
 */
export function posesDrawn(state: RuntimeState): number {
  return state.plan.length === 0 ? 0 : state.index + 1
}

/** Begin a session (idle → running). No-op from any other phase. */
export function start(state: RuntimeState): RuntimeState {
  return state.phase === 'idle' ? { ...state, phase: 'running' } : state
}

/** Pause, keeping the reference on screen (running → paused). No-op otherwise. */
export function pause(state: RuntimeState): RuntimeState {
  return state.phase === 'running' ? { ...state, phase: 'paused' } : state
}

/** Resume a paused session (paused → running). No-op otherwise. */
export function resume(state: RuntimeState): RuntimeState {
  return state.phase === 'paused' ? { ...state, phase: 'running' } : state
}

/**
 * End the session now — the manual End button / `Esc`. Running, paused, or
 * mid-rest all collapse to `ended`; idempotent once ended. Freezes the clock at
 * 0 and clears the view aids, keeping `index` for the recap. The reactive store
 * halts its 1s interval on this transition (the pure machine owns no clock).
 */
export function end(state: RuntimeState): RuntimeState {
  return state.phase === 'ended'
    ? state
    : { ...state, phase: 'ended', remaining: 0, resting: false, aids: NO_AIDS }
}

/**
 * Jump to the next pose, resetting its clock to the full duration — a manual
 * skip for scrubbing (arrow buttons / `→`). Works while running or paused;
 * stepping past the final pose ends the session. No-op otherwise.
 */
export function next(state: RuntimeState): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  const index = state.index + 1
  if (index >= state.plan.length)
    return { ...state, phase: 'ended', remaining: 0, resting: false, aids: NO_AIDS }
  return { ...state, index, remaining: state.plan[index], resting: false, aids: NO_AIDS }
}

/**
 * Jump to the previous pose, resetting its clock to the full duration. Works
 * while running or paused; clamps at the first pose (no-op there). No-op from
 * other phases.
 */
export function prev(state: RuntimeState): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  if (state.index === 0) return state
  const index = state.index - 1
  return { ...state, index, remaining: state.plan[index], resting: false, aids: NO_AIDS }
}

/** Seconds a single add-time (`+`) press grants the current pose. */
export const ADD_TIME_SECONDS = 30

/**
 * Extend the current pose by `seconds` — steal more drawing time without
 * leaving it (spec §6 add-time). Adds to the live clock; works while running or
 * paused. Ignored during a rest slide (no pose to extend) and from other phases.
 */
export function addTime(state: RuntimeState, seconds = ADD_TIME_SECONDS): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  if (state.resting) return state
  return { ...state, remaining: state.remaining + seconds }
}

/**
 * Reset the current pose's countdown to its full planned duration — the clock
 * half of an image refresh (spec §6): a swapped-in reference is a fresh drawing,
 * so it gets full time. Works while running or paused; ignored during a rest
 * slide (no pose to time) and from other phases. The image swap itself lives in
 * the store (it owns the run images); this only touches the machine's clock.
 */
export function resetPoseTime(state: RuntimeState): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  if (state.resting) return state
  return { ...state, remaining: state.plan[state.index] ?? state.remaining }
}

/** Flip the current pose horizontally (spec §6 mirror-H). No-op outside a run. */
export function toggleMirrorH(state: RuntimeState): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  return { ...state, aids: { ...state.aids, mirrorH: !state.aids.mirrorH } }
}

/** Flip the current pose vertically (spec §6 mirror-V). No-op outside a run. */
export function toggleMirrorV(state: RuntimeState): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  return { ...state, aids: { ...state.aids, mirrorV: !state.aids.mirrorV } }
}

/** Desaturate the current pose to value only (spec §6 grayscale). No-op outside a run. */
export function toggleGrayscale(state: RuntimeState): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  return { ...state, aids: { ...state.aids, grayscale: !state.aids.grayscale } }
}

/** Toggle the rule-of-thirds construction grid (spec §6 grid). No-op outside a run. */
export function toggleGrid(state: RuntimeState): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  return { ...state, aids: { ...state.aids, grid: !state.aids.grid } }
}

/**
 * Advance the clock by `delta` seconds while running. Draining an active pose
 * rolls into a rest slide (when `restSeconds > 0`) and then the next pose;
 * draining a rest rolls into the next pose; draining the final pose ends the
 * session (no rest trails it). Overflow is carried forward across a big delta.
 * No-op unless running.
 */
export function tick(state: RuntimeState, delta = 1): RuntimeState {
  if (state.phase !== 'running') return state
  const elapsed = state.elapsed + delta
  let { index, remaining, resting } = state
  remaining -= delta
  while (remaining <= 0) {
    if (resting) {
      // The rest after this pose finished → move on to the next pose.
      index += 1
      resting = false
      remaining += state.plan[index]
    } else if (index + 1 >= state.plan.length) {
      return { ...state, phase: 'ended', index, remaining: 0, resting: false, elapsed, aids: NO_AIDS }
    } else if (state.restSeconds > 0) {
      // Active pose finished → rest before the next one.
      resting = true
      remaining += state.restSeconds
    } else {
      index += 1
      remaining += state.plan[index]
    }
  }
  // A pose change (index advanced, possibly across a rest) clears the view aids.
  const aids = index === state.index ? state.aids : NO_AIDS
  return { ...state, index, remaining, resting, elapsed, aids }
}
