/**
 * Class-mode pose distribution (`gestures-spec.md` §5).
 *
 * Durations auto-distribute by geometric halving of the pose count: the bulk
 * are quick 1-min warm-ups, tapering to a few long poses that scale with N.
 * This module is the raw distribution only — health caps (≤90 min, ≤3 ten-min
 * poses) and the N clamp are enforced separately in step 2.
 */

const MINUTE = 60

/**
 * Per-pose durations (seconds) for a Class-mode session of `n` poses.
 *
 * Boundaries (1-indexed pose `i`):
 *   c1 = floor(n/2)   c2 = ceil(3n/4)   c3 = ceil(7n/8)
 *   i ≤ c1 → 1m | c1 < i ≤ c2 → 2m | c2 < i ≤ c3 → 5m | i > c3 → 10m
 *
 * @returns array of length `n`, ascending in duration.
 */
export function distribute(n: number): number[] {
  const c1 = Math.floor(n / 2)
  const c2 = Math.ceil((3 * n) / 4)
  const c3 = Math.ceil((7 * n) / 8)

  const seconds: number[] = []
  for (let i = 1; i <= n; i++) {
    if (i <= c1) seconds.push(1 * MINUTE)
    else if (i <= c2) seconds.push(2 * MINUTE)
    else if (i <= c3) seconds.push(5 * MINUTE)
    else seconds.push(10 * MINUTE)
  }
  return seconds
}
