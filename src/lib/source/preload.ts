/**
 * Window prefetch for instant pose swaps (`docs/prefetch-window.md`). At display
 * time a pose swap costs disk-read → **JPEG decode** → paint, and the decode is
 * the visible hitch. This warms a small rolling window of upcoming poses into
 * the browser's URL-keyed decode cache so the next `<img src>` paints on the
 * following frame. Memory stays bounded to the window, independent of library
 * size (a whole-set decode would OOM — see the design note).
 *
 * Split by the repo's "test the logic, browser-verify UI" line: {@link
 * prefetchWindow} is pure and unit-tested; {@link warm} performs the DOM-only
 * `HTMLImageElement.decode()` side-effect and is browser-verified.
 */

/** Default look-ahead: poses to decode past the cursor. 2–3 is ample at 30–120s/swap. */
export const PREFETCH_AHEAD = 2

/**
 * The URLs to keep decoded around `index`: the next `ahead` poses plus the one
 * behind (instant back-scrub via `←`). The current pose is excluded — it's
 * already painted. Nearest-ahead first; out-of-bounds neighbours are dropped and
 * the result is de-duplicated (very short runs can overlap).
 */
export function prefetchWindow(
  urls: readonly string[],
  index: number,
  ahead = PREFETCH_AHEAD,
): string[] {
  const out: string[] = []
  for (let d = 1; d <= ahead; d++) {
    if (index + d < urls.length) out.push(urls[index + d])
  }
  if (index - 1 >= 0) out.push(urls[index - 1])
  return [...new Set(out)]
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
