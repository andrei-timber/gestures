/**
 * Pose ordering (`gestures-spec.md` §5 — Randomization: shuffle, no
 * within-session repeats). A Fisher-Yates shuffle produces a permutation of the
 * pool, so every reference appears at most once per pass. The RNG is injected so
 * the order is deterministic under a seed — trivial to test and reproducible.
 */

/**
 * Seedable PRNG (mulberry32) → a function returning a number in `[0, 1)`.
 * The same seed yields the same stream; the session engine seeds it once per
 * session so a run is reproducible.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Return a shuffled copy of `items` (input untouched). Being a permutation, no
 * item repeats within the result. `rng` must return values in `[0, 1)`.
 */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
