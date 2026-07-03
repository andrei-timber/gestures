<script lang="ts">
  import { formatClock } from '@/lib/format'
  import { screen } from '@/state/screen.svelte'
  import { session } from '@/state/session.svelte'

  // Auto-advance is driven by the session store's 1s tick: each pose drains,
  // `index` rolls to the next, and `currentImage` follows. When the final pose
  // ends the run, hand off to the summary (the calm recap lands in step 14).
  $effect(() => {
    if (session.phase === 'ended') screen.show('summary')
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

  function togglePause(): void {
    if (session.phase === 'running') session.pause()
    else if (session.phase === 'paused') session.resume()
  }

  function endSession(): void {
    screen.show('summary')
  }

  function onKeydown(event: KeyboardEvent): void {
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

  <!-- Rule-of-thirds construction grid — a per-pose placement check.
       Spans the viewport (not the letterboxed image bounds); tightening it to
       the image is a follow-up. `non-scaling-stroke` keeps hairlines crisp. -->
  {#if session.aids.grid}
    <svg class="grid" viewBox="0 0 3 3" preserveAspectRatio="none" aria-hidden="true">
      <line x1="1" y1="0" x2="1" y2="3" />
      <line x1="2" y1="0" x2="2" y2="3" />
      <line x1="0" y1="1" x2="3" y2="1" />
      <line x1="0" y1="2" x2="3" y2="2" />
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

  <!-- Countdown: glass pill, bottom-centre, legible over bright references. -->
  <span class="clock glass" class:resting={session.resting}>{formatClock(session.remaining)}</span>

  <div class="hud">
    <div class="left">
      <span class="count">Pose {session.poseNumber} of {session.poseCount}</span>
      <span class="legend"
        >space pause · ← → prev/next · + extend · m/v mirror · g gray · r grid</span
      >
    </div>
    <button class="end" onclick={endSession}>End (esc)</button>
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

  /* Rule-of-thirds overlay: four hairlines, faint, never intercepting clicks. */
  .grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .grid line {
    stroke: color-mix(in srgb, var(--fg) 40%, transparent);
    stroke-width: 1;
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

  /*
   * Frosted-glass "pill" — an Apple-style translucent surface so controls stay
   * legible over bright references. Applied to the clock, nav arrows, and pause
   * badge now; the rest of the chrome migrates to the design system in the
   * creative-direction pass (spec §14).
   */
  .glass {
    background: color-mix(in srgb, var(--bg) 52%, transparent);
    backdrop-filter: blur(14px) saturate(1.6);
    -webkit-backdrop-filter: blur(14px) saturate(1.6);
    border: 1px solid color-mix(in srgb, white 20%, transparent);
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, white 14%, transparent),
      0 6px 20px rgb(0 0 0 / 0.28);
  }

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
    transition: opacity 0.15s ease;
  }

  .clock.resting {
    opacity: 0.55;
  }

  .hud {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    color: var(--fg-muted);
  }

  .count {
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  /* Info cluster: pose counter with the shortcut legend beside it. */
  .left {
    display: flex;
    align-items: baseline;
    gap: 0.9rem;
    min-width: 0;
  }

  /* One-line shortcut guide, sat left of End. Placeholder chrome — folded into
     the design system / shortcuts legend (steps 21–22, spec §14) later. */
  .legend {
    font-size: 0.78rem;
    letter-spacing: 0.02em;
    opacity: 0.7;
  }

  .end {
    font: inherit;
    font-size: 0.85rem;
    color: var(--fg-muted);
    background: transparent;
    border: 1px solid var(--fg-muted);
    border-radius: 0.4rem;
    padding: 0.25rem 0.7rem;
  }
</style>
