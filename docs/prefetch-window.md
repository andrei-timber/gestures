# Design note — window prefetch for blazing pose swaps

**Status:** proposed, not built. Parked as a Follow-up in `STATUS.md`.
**Origin:** noticed a visible per-swap delay in the slideshow (2026-07-03).

## Problem

The slideshow shows a pose via `<img src={session.currentImage.url}>` in
`Session.svelte`. `currentImage.url` is a `blob:` object URL minted in
`state/source.svelte.ts` (`URL.createObjectURL(file)` per accepted image). The
folder pick itself is instant — `File` objects are just on-disk handles and
object URLs are cheap registrations; **nothing is read or decoded at pick time.**

The cost lands at *display* time: when `src` swaps to the next pose, the browser
does disk-read → **JPEG decode** → paint. The decode is the expensive part and
is what shows up as a lag on each advance.

## Why not "decode the whole set into memory at start"

Two different costs hide behind "load":

| Cost | What | Size |
|---|---|---|
| Read | JPEG bytes off disk | ~file size (1–5 MB) |
| Decode | JPEG → raw RGBA bitmap | `width × height × 4` bytes |

Decoded bitmaps are huge vs. the file: a 3000×4000 photo is a ~2 MB JPEG but
**~48 MB** decoded. A 200-image library is ~200 MB on disk but **~10 GB**
decoded. Eager whole-set decode would thrash or OOM on a real library. So the
answer is a **rolling window**, not the whole set.

## Approach — decode a small window ahead of the cursor

Use the browser's built-in `HTMLImageElement.decode()`, which resolves once an
image is fully decoded and paint-ready and warms the browser's URL-keyed decode
cache:

```js
const img = new Image()
img.src = nextUrl
await img.decode()   // subsequent <img src={nextUrl}> paints on the next frame
```

Plan:
- On session start (and on each `session.index` change), kick off `decode()` for
  `index+1 … index+N` (and cheaply keep `index-1` warm for back-scrubbing).
- Window `N = 2–3` is plenty: with 30–120 s between swaps there's ample idle
  time to decode ahead. Bigger N buys nothing and costs memory.
- Warm the **first** pose during the Setup→Session transition so the opening
  frame is instant too.

## Why it fits the architecture

- The **sequence is known up front**: the runtime `plan` fixes the pose count and
  `source.images` is ordered, so at start we already know the exact ordered list
  of URLs to prefetch — no guessing. (Shuffle order works the same as long as the
  order is materialized before playback, which it is.)
- This is a pure **side-effect layer** — a `$effect` keyed on `session.index`
  plus a small helper (e.g. `src/lib/source/preload.ts`). The framework-free
  runtime stays untouched, matching the repo's "test the logic, browser-verify
  UI" split. **No new vitest surface; browser-verify against `~/Art Practice/Refs`.**

## Knobs / trade-offs

- **N (window size):** 2–3. Tune by eye if a very heavy library still hitches.
- **Direction:** keep `index-1` warm too for instant back-scrub (`←`).
- **Memory bound:** ~N decoded images live at once, independent of library size —
  can't fall over on a big folder.
- **Cache eviction:** the browser may evict decodes under pressure; the window
  re-warms on the next index change, so a rare re-decode is the worst case.

## Verify

Browser only. Load `~/Art Practice/Refs`, run a session, confirm swaps paint
without the decode hitch (compare before/after on the same folder). Watch memory
stays flat across a long run (no whole-set blow-up).
