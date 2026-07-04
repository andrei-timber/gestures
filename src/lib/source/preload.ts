/**
 * Window prefetch for instant pose swaps (`docs/prefetch-window.md`). At display
 * time a pose swap costs disk-read → **JPEG decode** → paint, and the decode is
 * the visible hitch. This warms a small rolling window of upcoming poses into
 * the browser's URL-keyed decode cache so the next `<img src>` paints on the
 * following frame. Memory stays bounded to the window, independent of library
 * size (a whole-set decode would OOM — see the design note).
 *
 * Split by the repo's "test the logic, browser-verify UI" line: {@link
 * prefetchIndices} is pure and unit-tested; {@link warm} performs the DOM-only
 * `HTMLImageElement.decode()` side-effect and is browser-verified.
 */

/** Default look-ahead: poses to decode past the cursor. 2–3 is ample at 30–120s/swap. */
export const PREFETCH_AHEAD = 2

/**
 * The indices to keep decoded around `index`: the next `ahead` poses plus the
 * one behind (instant back-scrub via `←`). The current pose is excluded — it's
 * already painted. Nearest-ahead first; out-of-bounds neighbours are dropped.
 * The indices are distinct by construction. The store maps these straight onto
 * the run images, so a swap never materialises every URL to read three of them.
 */
export function prefetchIndices(length: number, index: number, ahead = PREFETCH_AHEAD): number[] {
  const out: number[] = []
  for (let d = 1; d <= ahead; d++) {
    if (index + d < length) out.push(index + d)
  }
  if (index - 1 >= 0) out.push(index - 1)
  return out
}

/**
 * Warm `urls` into the browser's decode cache. Best-effort: a failed decode
 * (evicted, aborted, unreadable) is swallowed — the worst case is a re-decode at
 * display time. Resolves once all settle. DOM-only; no-op-safe to call with [].
 */
export function warm(urls: readonly string[]): Promise<void> {
  return Promise.all(urls.map(decodeOne)).then(() => {})
}

function decodeOne(url: string): Promise<void> {
  const img = new Image()
  img.src = url
  return img.decode().catch(() => {})
}
