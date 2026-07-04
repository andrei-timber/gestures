/**
 * Quick-mode session plan (`gestures-spec.md` §5). A uniform interval applied
 * across N poses — the simple counterpart to Class mode's tapering curve.
 * The same ≤90-min active cap binds here, clamping N for the chosen interval.
 */

import { MAX_ACTIVE_SECONDS, MIN_POSES } from './limits'

/** Preset interval choices offered in the UI, in seconds (custom adds more). */
export const QUICK_INTERVALS_SECONDS = [30, 60, 120, 300] as const
/** Default interval (spec §5 shared params). */
export const DEFAULT_INTERVAL_SECONDS = 60

/** Convert a custom interval entered in minutes to whole seconds. */
export function customIntervalSeconds(minutes: number): number {
  return Math.round(minutes * 60)
}

/**
 * Max poses at `intervalSeconds` before the 90-min active cap is exceeded. A
 * non-positive or non-finite interval (a transiently-typed `-5` or cleared
 * field, before the blur clamp heals it) has no valid pose count, so it yields
 * 0 — an empty plan the setup screen flags — never a negative `new Array` length.
 */
export function quickCeiling(intervalSeconds: number): number {
  if (!(intervalSeconds > 0)) return 0
  return Math.floor(MAX_ACTIVE_SECONDS / intervalSeconds)
}

/**
 * Clamp a requested Quick-mode count. The {@link MIN_POSES} floor guards the
 * *user-requested* count; two hard limits can still pull below it — the 90-min
 * ceiling (large intervals) and `poolCap`, the folder's image count (a small
 * folder legitimately runs fewer poses than the input minimum, no repeats).
 */
export function clampNQuick(n: number, intervalSeconds: number, poolCap = Infinity): number {
  return Math.min(Math.max(Math.floor(n), MIN_POSES), quickCeiling(intervalSeconds), poolCap)
}

/** Per-pose seconds for a Quick session: a uniform interval, count clamped. */
export function quickPlan(n: number, intervalSeconds: number, poolCap = Infinity): number[] {
  return new Array(clampNQuick(n, intervalSeconds, poolCap)).fill(intervalSeconds)
}
