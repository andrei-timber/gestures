/**
 * Class-mode health caps (`gestures-spec.md` §5). Sessions beyond ~90 min of
 * active drawing are unhealthy, so we make them *impossible*: the pose count is
 * clamped to a computed ceiling, and the "≤3 ten-min poses" invariant is
 * enforced. Both bind before any absurd N reaches the slideshow.
 */

import { distribute } from './distribute'

/** Class mode requires at least this many poses (spec §5 shared params). */
export const MIN_POSES = 10
/** Hard cap on summed pose durations; rests are excluded. */
export const MAX_ACTIVE_SECONDS = 90 * 60
/** Hard cap on the number of 10-min poses in a Class session. */
export const MAX_TEN_MIN_POSES = 3

const TEN_MIN = 10 * 60
const FIVE_MIN = 5 * 60

const activeSeconds = (secs: number[]): number => secs.reduce((a, b) => a + b, 0)

/**
 * Largest pose count whose active time stays within {@link MAX_ACTIVE_SECONDS}.
 * The distribution's total is monotonic in N, so we walk up from the minimum
 * and return the last count still in budget. Currently 31 (83 min).
 */
export function classCeiling(): number {
  let n = MIN_POSES
  while (activeSeconds(distribute(n + 1)) <= MAX_ACTIVE_SECONDS) n++
  return n
}

/** Clamp a requested Class-mode count into `[MIN_POSES, classCeiling()]`. */
export function clampN(n: number): number {
  return Math.max(MIN_POSES, Math.min(Math.floor(n), classCeiling()))
}

/**
 * Enforce the "≤3 ten-min poses" invariant. It naturally holds under the
 * {@link clampN} ceiling, so this only bites for unclamped inputs — any extra
 * 10-min pose demotes to 5 min (the next tier down).
 */
export function capTenMinPoses(secs: number[]): number[] {
  let tens = 0
  return secs.map((s) => {
    if (s !== TEN_MIN) return s
    tens += 1
    return tens > MAX_TEN_MIN_POSES ? FIVE_MIN : s
  })
}

/**
 * Class-mode per-pose seconds for a requested count, made safe: the count is
 * clamped to the ceiling, then the ten-min invariant is applied. This is the
 * entry point the setup screen and session engine consume.
 */
export function classPlan(n: number): number[] {
  return capTenMinPoses(distribute(clampN(n)))
}
