/**
 * Run selection (`gestures-spec.md` §5) — composes the two pose-picking pieces
 * into the ordered list a session actually plays. First {@link pickSpaced}
 * chooses `n` distinct, spaced source indices (dedups ordered libraries; always
 * on — it's a content-quality mechanism); then, when the user leaves "shuffle
 * poses" on, {@link shuffle} randomizes display order. With shuffle off the
 * picks stay in ascending source order (a natural spread through the folder).
 *
 * The RNG is injected — both stages draw from the same stream — so a run is
 * deterministic under a seed, matching `order.ts` / `pick.ts`. Kept generic over
 * the item type so this stays framework-free (no image/UI types leak in).
 */

import { shuffle } from './order'
import { pickSpaced } from './pick'

/**
 * `n` items chosen from `items` for a session: distinct, spaced, and either
 * shuffled (`randomize`) or in ascending source order. Caps at `items.length`
 * (no repeats beyond the pool), so the result length is `min(n, items.length)`.
 */
export function selectRun<T>(
  items: readonly T[],
  n: number,
  rng: () => number,
  randomize = true,
): T[] {
  const picked = pickSpaced(items.length, n, rng).map((i) => items[i])
  return randomize ? shuffle(picked, rng) : picked
}
