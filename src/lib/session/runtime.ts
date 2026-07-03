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

export interface RuntimeState {
  phase: Phase
  /** Per-pose durations in seconds; also fixes the pose count. */
  readonly plan: readonly number[]
  /** 0-based index of the current pose. */
  index: number
  /** Seconds left on the current pose. */
  remaining: number
}

/** A fresh idle runtime parked on the first pose of `plan`. */
export function createRuntime(plan: readonly number[]): RuntimeState {
  return { phase: 'idle', plan, index: 0, remaining: plan[0] ?? 0 }
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
 * Jump to the next pose, resetting its clock to the full duration — a manual
 * skip for scrubbing (arrow buttons / `→`). Works while running or paused;
 * stepping past the final pose ends the session. No-op otherwise.
 */
export function next(state: RuntimeState): RuntimeState {
  if (state.phase !== 'running' && state.phase !== 'paused') return state
  const index = state.index + 1
  if (index >= state.plan.length) return { ...state, phase: 'ended', remaining: 0 }
  return { ...state, index, remaining: state.plan[index] }
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
  return { ...state, index, remaining: state.plan[index] }
}

/**
 * Advance the clock by `delta` seconds while running. Draining the current
 * pose rolls into the next with any overflow carried forward; draining the
 * final pose ends the session. No-op unless running.
 */
export function tick(state: RuntimeState, delta = 1): RuntimeState {
  if (state.phase !== 'running') return state
  let { index, remaining } = state
  remaining -= delta
  while (remaining <= 0) {
    if (index + 1 >= state.plan.length) {
      return { ...state, phase: 'ended', index, remaining: 0 }
    }
    index += 1
    remaining += state.plan[index]
  }
  return { ...state, index, remaining }
}
