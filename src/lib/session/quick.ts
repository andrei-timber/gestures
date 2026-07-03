/**
 * Quick-mode session plan (`gestures-spec.md` §5). A uniform interval applied
 * across N poses — the simple counterpart to Class mode's tapering curve.
 * The same ≤90-min active cap binds here, clamping N for the chosen interval.
 */

import { MAX_ACTIVE_SECONDS, MIN_POSES } from './caps'

/** Preset interval choices offered in the UI, in seconds (custom adds more). */
export const QUICK_INTERVALS_SECONDS = [30, 60, 120, 300] as const
/** Default interval (spec §5 shared params). */
export const DEFAULT_INTERVAL_SECONDS = 60

/** Convert a custom interval entered in minutes to whole seconds. */
export function customIntervalSeconds(minutes: number): number {
  return Math.round(minutes * 60)
}

/** Max poses at `intervalSeconds` before the 90-min active cap is exceeded. */
export function quickCeiling(intervalSeconds: number): number {
  return Math.floor(MAX_ACTIVE_SECONDS / intervalSeconds)
}

/**
 * Clamp a requested Quick-mode count. The 90-min cap is a hard limit, so when
 * the interval is large enough that even {@link MIN_POSES} poses would exceed
 * it, the ceiling wins over the minimum.
 */
export function clampNQuick(n: number, intervalSeconds: number): number {
  return Math.min(Math.max(Math.floor(n), MIN_POSES), quickCeiling(intervalSeconds))
}

/** Per-pose seconds for a Quick session: a uniform interval, count clamped. */
export function quickPlan(n: number, intervalSeconds: number): number[] {
  return new Array(clampNQuick(n, intervalSeconds)).fill(intervalSeconds)
}
