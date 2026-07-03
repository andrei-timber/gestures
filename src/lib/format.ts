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
