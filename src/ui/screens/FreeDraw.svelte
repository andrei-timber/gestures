<script lang="ts">
  import { screen } from '@/state/screen.svelte'
  import { session } from '@/state/session.svelte'

  // "Continue the pose" (reached from Summary): the last reference held on screen
  // with no timer — just the pose, to keep drawing it as long as you like. The
  // session store keeps `currentImage` on the pose it ended on, so this reads it
  // straight off the still-loaded run. Esc (or the corner exit) returns to Setup.
  //
  // The view aids (mirror / grayscale / grid) carry over from the run, but the
  // session runtime is `ended` here and refuses its toggles — so free-draw owns
  // its own aids state. No timing controls and no pose counter: the timer is the
  // whole thing you left behind. (Aid icons mirror Session.svelte's tool menu.)
  let aids = $state({ mirrorH: false, mirrorV: false, grayscale: false, grid: false })

  const poseTransform = $derived(
    [aids.mirrorH && 'scaleX(-1)', aids.mirrorV && 'scaleY(-1)'].filter(Boolean).join(' ') || 'none',
  )
  const poseFilter = $derived(aids.grayscale ? 'grayscale(1)' : 'none')

  const keymap: Record<string, () => void> = {
    m: () => (aids.mirrorH = !aids.mirrorH),
    v: () => (aids.mirrorV = !aids.mirrorV),
    g: () => (aids.grayscale = !aids.grayscale),
    r: () => (aids.grid = !aids.grid),
    Escape: exit,
  }

  function exit(): void {
    screen.show('setup')
  }

  function onKeydown(event: KeyboardEvent): void {
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

  <!-- Fine construction grid — the same viewport-spanning ninths as the session. -->
  {#if aids.grid}
    <svg class="grid" viewBox="0 0 9 9" preserveAspectRatio="none" aria-hidden="true">
      {#each [1, 2, 3, 4, 5, 6, 7, 8] as n (n)}
        <line x1={n} y1="0" x2={n} y2="9" />
        <line x1="0" y1={n} x2="9" y2={n} />
      {/each}
    </svg>
  {/if}

  <!-- Same top-left glass exit as the session, so leaving free-draw is the same
       gesture. Esc is wired above; the disc keeps it reachable on touch (iPad). -->
  <button class="exit glass" title="Exit (esc)" aria-label="Exit (esc)" onclick={exit}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6 18 18M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </button>

  <!-- View aids only — no timing controls, no pose counter. Centred on the left
       edge (no nav arrow to split the rail around, unlike the session). -->
  <div class="menu glass">
    <button class="tool" class:on={aids.mirrorH} aria-pressed={aids.mirrorH} title="Mirror horizontal (m)" aria-label="Mirror horizontal (m)" onclick={() => (aids.mirrorH = !aids.mirrorH)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" stroke-linecap="round" />
        <path d="M9.5 7.5 5 12l4.5 4.5z" fill="currentColor" />
        <path d="M14.5 7.5 19 12l-4.5 4.5z" fill="currentColor" />
      </svg>
    </button>
    <button class="tool" class:on={aids.mirrorV} aria-pressed={aids.mirrorV} title="Mirror vertical (v)" aria-label="Mirror vertical (v)" onclick={() => (aids.mirrorV = !aids.mirrorV)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" stroke-linecap="round" />
        <path d="M7.5 9.5 12 5l4.5 4.5z" fill="currentColor" />
        <path d="M7.5 14.5 12 19l4.5-4.5z" fill="currentColor" />
      </svg>
    </button>
    <button class="tool" class:on={aids.grayscale} aria-pressed={aids.grayscale} title="Grayscale (g)" aria-label="Grayscale (g)" onclick={() => (aids.grayscale = !aids.grayscale)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
      </svg>
    </button>
    <button class="tool" class:on={aids.grid} aria-pressed={aids.grid} title="Grid (r)" aria-label="Grid (r)" onclick={() => (aids.grid = !aids.grid)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">
        <rect x="4.5" y="4.5" width="15" height="15" rx="1" />
        <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" />
        <line x1="14.5" y1="4.5" x2="14.5" y2="19.5" />
        <line x1="4.5" y1="9.5" x2="19.5" y2="9.5" />
        <line x1="4.5" y1="14.5" x2="19.5" y2="14.5" />
      </svg>
    </button>
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

  .grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .grid line {
    stroke: var(--grid);
    stroke-width: 1;
    opacity: 0.55;
    vector-effect: non-scaling-stroke;
  }

  /* Standalone glass disc pinned top-left — mirrors the session's Exit control. */
  .exit {
    position: absolute;
    top: 0.9rem;
    left: 0.9rem;
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

  .exit:hover,
  .exit:focus-visible {
    opacity: 1;
    border-color: color-mix(in srgb, white 20%, transparent);
  }

  .exit svg {
    width: 1.4rem;
    height: 1.4rem;
  }

  /* One frosted glass column of view aids, vertically centred on the left edge. */
  .menu {
    position: absolute;
    left: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
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

  .tool:focus-visible {
    opacity: 1;
    background: color-mix(in srgb, white 8%, transparent);
    border-color: transparent;
  }

  /* Hover feedback only where a real pointer exists — keeps a tapped aid from
     latching its hover look on touch (see Session.svelte for the full note). */
  @media (hover: hover) {
    .tool:hover {
      opacity: 1;
      background: color-mix(in srgb, white 8%, transparent);
      border-color: transparent;
    }
  }

  .tool svg {
    width: 1.3rem;
    height: 1.3rem;
  }

  /* Toggled-on view aid: accent tint + hairline, matching the session. */
  .tool.on {
    opacity: 1;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  }
</style>
