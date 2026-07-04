/**
 * Pace cue (`gestures-spec.md` §6, step 21). The countdown pill carries a faint,
 * always-on tint that warms as the pose drains — a calm "where am I" signal read
 * peripherally, without watching the digits.
 *
 * Bands by the share of the pose *remaining* (mirror of elapsed):
 *   ≥ 50% left → green | 20–50% → yellow | 5–20% → orange | < 5% → red
 * i.e. green for the first half, yellow through 80% elapsed, orange through 95%,
 * red in the last 5%. Extending a pose lifts `remaining` back above its total, so
 * the tint resets to green — reading correctly as "you bought time".
 */
export type CueBand = 'green' | 'yellow' | 'orange' | 'red'

export function cueBand(remaining: number, total: number): CueBand {
  // No live pose (total ≤ 0) reads as fully fresh; extension (remaining > total)
  // yields frac > 1, which lands in green just the same.
  const frac = total > 0 ? remaining / total : 1
  if (frac >= 0.5) return 'green'
  if (frac >= 0.2) return 'yellow'
  if (frac >= 0.05) return 'orange'
  return 'red'
}
