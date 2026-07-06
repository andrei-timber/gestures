/**
 * In-session image refresh (`gestures-spec.md` §6). When a reference feels
 * too-recently-seen, the artist swaps it for one they haven't drawn yet without
 * leaving the pose. Two pure pieces the session store composes:
 *
 *   • {@link pickSpare} — a random unseen image from the loaded pool (one that
 *     was never placed in the run), or `null` when the pool is exhausted.
 *   • {@link refreshRun} — slide the upcoming poses forward over the current
 *     slot and drop the spare in at the tail.
 *
 * Sliding (rather than dropping the spare straight into the current slot) means
 * the current slot inherits the *next* pose — already warmed by the prefetch
 * window, so the swap paints instantly — while the cold spare lands far ahead
 * where the window reaches it before it's shown. The displaced image leaves the
 * run entirely, so nothing the artist has seen ever reappears (no overlap).
 *
 * Kept generic over `{ url }` so this stays framework-free; the RNG is injected,
 * matching `order.ts` / `select.ts`.
 */

/**
 * A random image from `pool` whose URL is not in `used` (every URL ever placed
 * in the run), or `null` when none remain — the signal to disable Refresh.
 */
export function pickSpare<T extends { url: string }>(
  pool: readonly T[],
  used: ReadonlySet<string>,
  rng: () => number,
): T | null {
  const spares = pool.filter((img) => !used.has(img.url))
  if (spares.length === 0) return null
  return spares[Math.floor(rng() * spares.length)]
}

/**
 * The run images with the pose at `index` refreshed: upcoming poses shift one
 * slot forward over it, and `spare` takes the vacated tail. The displaced image
 * is dropped. Length is preserved. On the final pose (nothing ahead to pull
 * forward) the spare lands directly in the current slot.
 */
export function refreshRun<T extends { url: string }>(
  run: readonly T[],
  index: number,
  spare: T,
): T[] {
  const next = run.slice()
  for (let k = index; k < next.length - 1; k++) next[k] = run[k + 1]
  next[next.length - 1] = spare
  return next
}
