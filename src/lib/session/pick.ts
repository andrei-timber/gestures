/**
 * Spaced pose picking (`gestures-spec.md` §5 — Pose picking). Ordered reference
 * libraries repeat a pose across a run of consecutive files, so choosing N
 * images at random would draw near-duplicates. This selects N *distinct* source
 * indices, pairwise ≥ a gap apart, spread uniformly at random:
 *
 *  - target gap 30 (a same-pose run rarely exceeds it);
 *  - on a pool too small for 30, the gap shrinks to `⌊(pool-1)/(n-1)⌋` so the
 *    picks spread as evenly as the pool allows ("modulo-divided");
 *  - never repeats an image — if the pool holds fewer than N, every image is
 *    used once (effective N = pool size).
 *
 * The RNG is injected, so a pick is deterministic under a seed — like
 * `shuffle` in `order.ts`. Display order is applied separately (shuffle).
 */

/** Target minimum gap, in source indices, between picked images. */
export const SPACING_GAP = 30

/**
 * `n` distinct indices from `[0, poolSize)`, sorted ascending, each consecutive
 * pair ≥ the effective gap apart. Returns a uniform-random valid selection;
 * caps `n` at `poolSize` (no repeats possible beyond the pool).
 */
export function pickSpaced(
  poolSize: number,
  n: number,
  rng: () => number,
  gap: number = SPACING_GAP,
): number[] {
  const pool = Math.max(0, Math.floor(poolSize))
  const count = Math.min(Math.max(0, Math.floor(n)), pool)
  if (count <= 0) return []
  if (count === 1) return [Math.floor(rng() * pool)]
  if (count >= pool) return Array.from({ length: count }, (_, i) => i)

  // Largest gap that lets `count` picks fit the pool, capped at the target.
  const g = Math.max(1, Math.min(Math.floor(gap), Math.floor((pool - 1) / (count - 1))))
  // Collapse the required spacing to plain distinct "slots", pick uniformly,
  // then re-expand by (g-1) per rank so consecutive picks land ≥ g apart.
  const slots = pool - (count - 1) * (g - 1)
  const chosen = chooseDistinct(slots, count, rng).sort((a, b) => a - b)
  return chosen.map((y, i) => y + i * (g - 1))
}

/** `k` distinct integers from `[0, range)` via a partial Fisher–Yates. */
function chooseDistinct(range: number, k: number, rng: () => number): number[] {
  const pool = Array.from({ length: range }, (_, i) => i)
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rng() * (range - i))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, k)
}
