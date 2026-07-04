<script lang="ts">
  import { cueBand } from '@/lib/session/cue'
  import { formatClock } from '@/lib/format'
  import { warm } from '@/lib/source/preload'
  import { screen } from '@/state/screen.svelte'
  import { session } from '@/state/session.svelte'

  // Auto-advance is driven by the session store's 1s tick: each pose drains,
  // `index` rolls to the next, and `currentImage` follows. When the final pose
  // ends the run, hand off to the summary (the calm recap lands in step 14).
  $effect(() => {
    if (session.phase === 'ended') screen.show('summary')
  })

  // Window prefetch (docs/prefetch-window.md): as the cursor moves, decode the
  // next couple of poses (and keep the one behind warm) into the browser cache
  // so each swap paints without the JPEG-decode hitch. Pure side-effect layer;
  // memory stays bounded to the window.
  //
  // The store reassigns its whole runtime object on every 1s tick, so reading
  // `session.index` directly would re-fire this effect (and re-issue decodes)
  // each second. A $derived memoises the index by value, so the effect wakes
  // only on an actual pose advance.
  const prefetchIndex = $derived(session.index)
  $effect(() => {
    void warm(session.prefetchUrls(prefetchIndex))
  })

  // Keyboard dispatcher: a key→action map so later helpers (prev/next, add-time)
  // drop in as one-line entries. Every mapped key preventDefaults (e.g. space's
  // page scroll); unmapped keys fall through untouched.
  const keymap: Record<string, () => void> = {
    ' ': togglePause,
    ArrowLeft: () => session.prev(),
    ArrowRight: () => session.next(),
    // Both the shifted "+" and its unshifted "=" so no modifier is needed.
    '+': () => session.addTime(),
    '=': () => session.addTime(),
    // Per-pose sanity checks — mirror / grayscale / grid — that reset on advance.
    m: () => session.toggleMirrorH(),
    v: () => session.toggleMirrorV(),
    g: () => session.toggleGrayscale(),
    r: () => session.toggleGrid(),
    // Esc ends the run, same as the End button.
    Escape: endSession,
  }

  // Compose the mirror flips into one CSS transform on the reference image.
  const poseTransform = $derived(
    [session.aids.mirrorH && 'scaleX(-1)', session.aids.mirrorV && 'scaleY(-1)']
      .filter(Boolean)
      .join(' ') || 'none',
  )
  const poseFilter = $derived(session.aids.grayscale ? 'grayscale(1)' : 'none')

  // Pace cue (step 21): a faint, always-on tint on the countdown pill that warms
  // green → yellow → orange → red as the pose drains (see `cueBand`). A calm
  // peripheral "where am I" signal, no sound. Suppressed on rest slides and once
  // the run has ended (no live pose to pace) — the pill stays neutral there.
  const band = $derived(
    session.phase !== 'ended' && !session.resting
      ? cueBand(session.remaining, session.poseDuration)
      : null,
  )

  function togglePause(): void {
    if (session.phase === 'running') session.pause()
    else if (session.phase === 'paused') session.resume()
  }

  // End the run: stop the runtime (halting its 1s tick) before navigating, so no
  // interval keeps ticking in the background behind the summary. The ended-phase
  // effect above also fires; showing the summary here keeps the intent explicit.
  function endSession(): void {
    session.end()
    screen.show('summary')
  }

  function onKeydown(event: KeyboardEvent): void {
    // Let browser/OS chords through (Cmd/Ctrl+R reload, Cmd+V, etc.) — the aids
    // are bare single keys, so a held modifier means the keypress isn't for us.
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const action = keymap[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<section class="screen">
  {#if session.currentImage}
    <img
      class="pose"
      src={session.currentImage.url}
      alt="Pose reference"
      style:transform={poseTransform}
      style:filter={poseFilter}
    />
  {/if}

  <!-- Fine construction grid — a per-pose placement / proportion check.
       Ninths (3× finer than rule-of-thirds) in bright light blue so the lattice
       reads over white references. Spans the viewport (not the letterboxed image
       bounds); tightening it to the image is a follow-up. `non-scaling-stroke`
       keeps hairlines crisp. -->
  {#if session.aids.grid}
    <svg class="grid" viewBox="0 0 9 9" preserveAspectRatio="none" aria-hidden="true">
      {#each [1, 2, 3, 4, 5, 6, 7, 8] as n (n)}
        <line x1={n} y1="0" x2={n} y2="9" />
        <line x1="0" y1={n} x2="9" y2={n} />
      {/each}
    </svg>
  {/if}

  <!-- Pace glow: the same green→red cue as the pill, cast as an inset edge glow
       over the canvas backdrop / around the pose so the whole frame — not just
       the clock — warms as the pose drains. Pointer-events-none, centre clear so
       the reference stays untouched; tracks the same `band` (off on rest/ended). -->
  <div
    class="cue-glow"
    class:cue-green={band === 'green'}
    class:cue-yellow={band === 'yellow'}
    class:cue-orange={band === 'orange'}
    class:cue-red={band === 'red'}
    aria-hidden="true"
  ></div>

  <!-- Rest slide: a dim pause between poses, the reference faint behind it. -->
  {#if session.resting}
    <div class="veil"><span>Rest</span></div>
  {/if}

  <!-- Paused: a large glass pause badge over a lightly-dimmed reference,
       held until space resumes the run. -->
  {#if session.phase === 'paused'}
    <div class="veil paused">
      <div class="pause-badge glass" aria-label="Paused" role="img">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="5" width="3.4" height="14" rx="1.2" />
          <rect x="13.6" y="5" width="3.4" height="14" rx="1.2" />
        </svg>
      </div>
    </div>
  {/if}

  <!-- Glass side controls: skip a pose either way to scrub through the run. -->
  <button class="nav prev glass" aria-label="Previous pose" onclick={() => session.prev()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
  </button>
  <button class="nav next glass" aria-label="Next pose" onclick={() => session.next()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
  </button>

  <!-- Countdown: glass pill, bottom-centre, legible over bright references. Its
       faint fill tint tracks the pace band (green → red) as the pose drains. -->
  <span
    class="clock glass"
    class:resting={session.resting}
    class:cue-green={band === 'green'}
    class:cue-yellow={band === 'yellow'}
    class:cue-orange={band === 'orange'}
    class:cue-red={band === 'red'}>{formatClock(session.remaining)}</span>

  <!-- Exit, decoupled from the tool menu and pinned top-left: ending the run is a
       deliberate, separate gesture, kept away from the per-pose tools so it's
       never fat-fingered. Keyed by Esc. -->
  <button class="exit glass" title="Exit session (esc)" aria-label="Exit session (esc)" onclick={endSession}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6 18 18M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </button>

  <!-- Every in-session control lives in one vertical glass menu at the bottom-left
       (nothing on the right but the directional nav arrow). Icon-only; the label +
       hotkey ride in the tooltip. View aids sit above a divider, timing below; the
       pose counter sits under the menu. Keyboard shortcuts stay wired through
       `onKeydown` unchanged — the icons just make them mouse-clickable too. -->
  <div class="controls-cluster">
    <div class="menu glass">
      <button class="tool" class:on={session.aids.mirrorH} aria-pressed={session.aids.mirrorH} title="Mirror horizontal (m)" aria-label="Mirror horizontal (m)" onclick={() => session.toggleMirrorH()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" stroke-linecap="round" />
          <path d="M9.5 7.5 5 12l4.5 4.5z" fill="currentColor" />
          <path d="M14.5 7.5 19 12l-4.5 4.5z" fill="currentColor" />
        </svg>
      </button>
      <button class="tool" class:on={session.aids.mirrorV} aria-pressed={session.aids.mirrorV} title="Mirror vertical (v)" aria-label="Mirror vertical (v)" onclick={() => session.toggleMirrorV()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" stroke-linecap="round" />
          <path d="M7.5 9.5 12 5l4.5 4.5z" fill="currentColor" />
          <path d="M7.5 14.5 12 19l4.5-4.5z" fill="currentColor" />
        </svg>
      </button>
      <button class="tool" class:on={session.aids.grayscale} aria-pressed={session.aids.grayscale} title="Grayscale (g)" aria-label="Grayscale (g)" onclick={() => session.toggleGrayscale()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
        </svg>
      </button>
      <button class="tool" class:on={session.aids.grid} aria-pressed={session.aids.grid} title="Grid (r)" aria-label="Grid (r)" onclick={() => session.toggleGrid()}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">
          <rect x="4.5" y="4.5" width="15" height="15" rx="1" />
          <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" />
          <line x1="14.5" y1="4.5" x2="14.5" y2="19.5" />
          <line x1="4.5" y1="9.5" x2="19.5" y2="9.5" />
          <line x1="4.5" y1="14.5" x2="19.5" y2="14.5" />
        </svg>
      </button>
      <span class="menu-sep" aria-hidden="true"></span>
      <button class="tool" title={session.phase === 'paused' ? 'Resume (space)' : 'Pause (space)'} aria-label={session.phase === 'paused' ? 'Resume (space)' : 'Pause (space)'} onclick={togglePause}>
        {#if session.phase === 'paused'}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 19 12 8 18.5z" fill="currentColor" /></svg>
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="currentColor" />
            <rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="currentColor" />
          </svg>
        {/if}
      </button>
      <button class="tool" title="Extend pose (+)" aria-label="Extend pose (+)" onclick={() => session.addTime()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
      </button>
    </div>
  </div>

  <!-- Pose counter kept in the bottom-left corner, away from the top-left menu. -->
  <span class="count">Pose {session.poseNumber} of {session.poseCount}</span>
</section>

<style>
  .screen {
    position: relative;
    min-height: 100dvh;
    background: var(--bg);
  }

  .pose {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* Fine construction overlay: a lattice of hairlines, never intercepting clicks. */
  .grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* Construction stroke in the theme's grid hue, legible over white references. */
  .grid line {
    stroke: var(--grid);
    stroke-width: 1;
    opacity: 0.55;
    vector-effect: non-scaling-stroke;
  }

  /* Pace glow: an inset edge vignette in the band hue, intensifying as the pose
     drains (widening blur + rising alpha, red strongest). Centre stays fully
     transparent so the reference is never washed; only the borders / backdrop
     glow. Shares the pill's `--pace-*` tokens, so it re-tints per theme. */
  .cue-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition:
      box-shadow 0.6s ease,
      opacity 0.6s ease;
  }

  .cue-glow.cue-green {
    opacity: 1;
    box-shadow: inset 0 0 90px 2px color-mix(in srgb, var(--pace-1) 16%, transparent);
  }

  .cue-glow.cue-yellow {
    opacity: 1;
    box-shadow: inset 0 0 110px 4px color-mix(in srgb, var(--pace-2) 22%, transparent);
  }

  .cue-glow.cue-orange {
    opacity: 1;
    box-shadow: inset 0 0 140px 8px color-mix(in srgb, var(--pace-3) 30%, transparent);
  }

  .cue-glow.cue-red {
    opacity: 1;
    box-shadow: inset 0 0 190px 14px color-mix(in srgb, var(--pace-4) 42%, transparent);
  }

  .veil {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
  }

  /* Pause dims the reference only lightly (half the rest veil) — the artist
     keeps studying the pose while stopped. */
  .veil.paused {
    background: color-mix(in srgb, var(--bg) 44%, transparent);
  }

  .veil span {
    color: var(--fg-muted);
    font-size: 1.1rem;
    letter-spacing: 0.35em;
    text-transform: uppercase;
  }

  /* The frosted `.glass` surface (clock, nav, pause badge, HUD chips) is a shared
     design-system class in `app.css`; per-element sizing/layout lives below. */

  .pause-badge {
    display: grid;
    place-items: center;
    width: 5.25rem;
    height: 5.25rem;
    border-radius: 50%;
    color: var(--fg);
  }

  .pause-badge svg {
    width: 2.5rem;
    height: 2.5rem;
    fill: currentColor;
  }

  .nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 3.25rem;
    height: 3.25rem;
    padding: 0;
    border-radius: 50%;
    color: var(--fg);
    opacity: 0.68;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .nav:hover,
  .nav:focus-visible {
    opacity: 1;
  }

  .nav.prev {
    left: 0.9rem;
  }

  .nav.next {
    right: 0.9rem;
  }

  .nav svg {
    width: 1.6rem;
    height: 1.6rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .clock {
    position: absolute;
    left: 50%;
    bottom: 0.7rem;
    transform: translateX(-50%);
    padding: 0.32rem 0.85rem;
    border-radius: 999px;
    color: var(--fg);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.05em;
    transition:
      opacity 0.15s ease,
      color 0.6s ease,
      background 0.6s ease,
      border-color 0.6s ease,
      box-shadow 0.6s ease;
  }

  .clock.resting {
    opacity: 0.55;
  }

  /* Pace-cue tints: a faint wash of the band hue over the glass fill, warming as
     the pose drains. The band hues are theme tokens (`--pace-1..4`), so the cue
     re-tints with the palette. The red band also lifts a soft glow, echoing the
     old final-seconds cue. */
  .clock.cue-green {
    background: color-mix(in srgb, var(--pace-1) 18%, color-mix(in srgb, var(--bg) 52%, transparent));
    border-color: color-mix(in srgb, var(--pace-1) 40%, transparent);
  }

  .clock.cue-yellow {
    background: color-mix(in srgb, var(--pace-2) 20%, color-mix(in srgb, var(--bg) 52%, transparent));
    border-color: color-mix(in srgb, var(--pace-2) 45%, transparent);
  }

  .clock.cue-orange {
    background: color-mix(in srgb, var(--pace-3) 22%, color-mix(in srgb, var(--bg) 52%, transparent));
    border-color: color-mix(in srgb, var(--pace-3) 50%, transparent);
  }

  .clock.cue-red {
    background: color-mix(in srgb, var(--pace-4) 26%, color-mix(in srgb, var(--bg) 52%, transparent));
    border-color: color-mix(in srgb, var(--pace-4) 58%, transparent);
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, white 14%, transparent),
      0 6px 20px rgb(0 0 0 / 0.28),
      0 0 16px color-mix(in srgb, var(--pace-4) 48%, transparent);
  }

  /* Exit — a standalone glass disc pinned top-left, deliberately apart from the
     tool menu so ending the run reads as its own gesture. */
  .exit {
    position: absolute;
    top: 0.9rem;
    left: 0.9rem;
    display: grid;
    place-items: center;
    /* Same diameter as the nav arrows, and — with the menu 3.25rem wide too —
       the same width as the menu column it sits above. */
    width: 3.25rem;
    height: 3.25rem;
    padding: 0;
    border-radius: 50%;
    color: var(--fg);
    opacity: 0.68;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .exit:hover,
  .exit:focus-visible {
    opacity: 1;
    border-color: color-mix(in srgb, white 20%, transparent);
  }

  .exit svg {
    width: 1.4rem;
    height: 1.4rem;
  }

  /* Tool menu on the left edge, vertically centred in the gap between the Exit
     disc above and the mid-screen nav arrow below, so it's equally spaced from
     both. Nothing lives on the right but the nav arrow. */
  .controls-cluster {
    position: absolute;
    left: 0.9rem;
    /* Midpoint between the Exit centre (2.525rem) and the arrow centre (50%). */
    top: calc(25% + 1.26rem);
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /* A single frosted glass column of icon tools. 0.3125rem padding around the
     2.5rem buttons (plus the 1px glass border) makes the column exactly 3.25rem
     wide — matching the Exit disc and the nav arrows. */
  .menu {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.3125rem;
    border-radius: 0.85rem;
  }

  .tool {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 0.6rem;
    background: transparent;
    color: var(--fg);
    opacity: 0.78;
    cursor: pointer;
    transition:
      opacity 0.15s ease,
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .tool:hover,
  .tool:focus-visible {
    opacity: 1;
    background: color-mix(in srgb, white 8%, transparent);
    border-color: transparent;
  }

  .tool svg {
    width: 1.3rem;
    height: 1.3rem;
  }

  /* Toggled-on view aid: accent tint + hairline, matching the design system. */
  .tool.on {
    opacity: 1;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  }

  /* Hairline between the per-pose view aids and the timing controls. */
  .menu-sep {
    height: 1px;
    margin: 0.2rem 0.35rem;
    background: color-mix(in srgb, white 14%, transparent);
  }

  /* Pose counter kept in the bottom-left corner, apart from the top-left menu. */
  .count {
    position: absolute;
    left: 0.9rem;
    bottom: 0.9rem;
    font-size: 0.8rem;
    letter-spacing: 0.03em;
    white-space: nowrap;
    color: var(--fg-muted);
  }
</style>
