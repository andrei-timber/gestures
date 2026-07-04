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

  <!-- HUD as two vertical glass-button stacks, one per bottom corner, so neither
       legend stretches across the reference and each control is mouse-clickable
       (handy alongside a parallel Photoshop file) as well as keyed. Each button
       names its shortcut in parens. The stacks grow upward from the corner rather
       than invading the image, and the vertical layout shrinks cleanly (iPad).
       The per-pose view aids sit left above the counter; timing sits right above
       End. Keyboard shortcuts stay wired through `onKeydown` unchanged. -->
  <div class="hud">
    <div class="col left">
      <button class="chip glass" class:on={session.aids.mirrorH} onclick={() => session.toggleMirrorH()}>Mirror ⇄ <span class="key">(m)</span></button>
      <button class="chip glass" class:on={session.aids.mirrorV} onclick={() => session.toggleMirrorV()}>Mirror ⇅ <span class="key">(v)</span></button>
      <button class="chip glass" class:on={session.aids.grayscale} onclick={() => session.toggleGrayscale()}>Gray <span class="key">(g)</span></button>
      <button class="chip glass" class:on={session.aids.grid} onclick={() => session.toggleGrid()}>Grid <span class="key">(r)</span></button>
      <span class="count">Pose {session.poseNumber} of {session.poseCount}</span>
    </div>
    <div class="col right">
      <button class="chip glass" onclick={togglePause}>{session.phase === 'paused' ? 'Resume' : 'Pause'} <span class="key">(space)</span></button>
      <button class="chip glass" onclick={() => session.addTime()}>Extend <span class="key">(+)</span></button>
      <button class="chip glass" onclick={endSession}>End <span class="key">(esc)</span></button>
    </div>
  </div>
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

  .hud {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    color: var(--fg-muted);
  }

  /* Corner stacks: buttons pile upward from the counter (left) / End (right),
     so the layout stays vertical and shrinks cleanly on narrow / touch screens. */
  .col {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  .col.left {
    align-items: flex-start;
  }

  .col.right {
    align-items: flex-end;
  }

  .count {
    margin-top: 0.15rem;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  /* Glass control button — the legend's shortcuts made clickable. Shares the
     .glass frosted surface with the nav arrows and clock; the shortcut key rides
     along in a muted parenthetical (`.key`). */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
    font: inherit;
    font-size: 0.8rem;
    line-height: 1;
    white-space: nowrap;
    color: var(--fg);
    padding: 0.4rem 0.72rem;
    border-radius: 999px;
    cursor: pointer;
    opacity: 0.9;
    transition:
      opacity 0.15s ease,
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .chip:hover,
  .chip:focus-visible {
    opacity: 1;
  }

  .chip .key {
    font-size: 0.72rem;
    color: var(--fg-muted);
  }

  /* Toggled-on view aid: a brighter glass with an accent hairline so active aids
     read at a glance. */
  .chip.on {
    background: color-mix(in srgb, var(--bg) 30%, transparent);
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
    opacity: 1;
  }

  .chip.on .key {
    color: var(--fg);
  }
</style>
