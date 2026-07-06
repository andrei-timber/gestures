/** Small, framework-free display formatters. */

/**
 * A calm, rounded duration for the setup total-time FYI: whole minutes, rolling
 * to `H h M min` past an hour. Not for precise countdowns — that's per-second.
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

/**
 * A precise `m:ss` countdown for the in-session clock — the per-second display
 * `formatDuration` deliberately isn't. Floors to whole seconds and never goes
 * negative, so a drained pose reads `0:00`.
 */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * A single pose's length for the setup FYI: whole minutes read as `2 min`,
 * sub-minute as `30s`, half-minute steps as `1.5 min`. Quick's custom intervals
 * snap to 30-second steps, so the fraction is always a clean `.0`/`.5`.
 */
export function formatPoseLength(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = seconds / 60
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)} min`
}

/**
 * The run's shape as a compact one-liner for the setup FYI — consecutive equal
 * durations collapse to `N× length`, joined by arrows: `10× 1 min → 8× 2 min`.
 * The Class plan is ascending, so its tiers group cleanly; a uniform Quick run
 * collapses to a single group. Empty plan → empty string.
 */
export function formatSequence(plan: readonly number[]): string {
  const groups: { seconds: number; count: number }[] = []
  for (const seconds of plan) {
    const last = groups[groups.length - 1]
    if (last && last.seconds === seconds) last.count += 1
    else groups.push({ seconds, count: 1 })
  }
  return groups.map((g) => `${g.count}× ${formatPoseLength(g.seconds)}`).join(' → ')
}
