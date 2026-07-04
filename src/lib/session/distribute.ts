/**
 * Class-mode pose distribution (`gestures-spec.md` §5).
 *
 * Durations auto-distribute by a fixed *share* of the pose count — 40% quick
 * 1-min warm-ups, then 30% at 2m, 20% at 5m, 10% at 10m — so the long poses
 * scale with N. This module is the raw distribution only — health caps
 * (≤90 min, ≤3 ten-min poses) and the N clamp are enforced separately in step 2.
 */

const MINUTE = 60

/**
 * Per-pose durations (seconds) for a Class-mode session of `n` poses.
 *
 * Tier shares 40 / 30 / 20 / 10 % → cumulative boundaries (1-indexed pose `i`),
 * each rounded to the nearest pose:
 *   c1 = round(0.4n)   c2 = round(0.7n)   c3 = round(0.9n)
 *   i ≤ c1 → 1m | c1 < i ≤ c2 → 2m | c2 < i ≤ c3 → 5m | i > c3 → 10m
 *
 * @returns array of length `n`, ascending in duration.
 */
export function distribute(n: number): number[] {
  const c1 = Math.round(0.4 * n)
  const c2 = Math.round(0.7 * n)
  const c3 = Math.round(0.9 * n)

  const seconds: number[] = []
  for (let i = 1; i <= n; i++) {
    if (i <= c1) seconds.push(1 * MINUTE)
    else if (i <= c2) seconds.push(2 * MINUTE)
    else if (i <= c3) seconds.push(5 * MINUTE)
    else seconds.push(10 * MINUTE)
  }
  return seconds
}
