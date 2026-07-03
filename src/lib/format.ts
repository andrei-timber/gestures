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
