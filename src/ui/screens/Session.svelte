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
</script>

<section class="screen">
  {#if session.currentImage}
    <img class="pose" src={session.currentImage.url} alt="Pose reference" />
  {/if}

  <!-- Rest slide: a dim pause between poses, the reference faint behind it. -->
  {#if session.resting}
    <div class="rest"><span>Rest</span></div>
  {/if}

  <!-- Faint side controls: skip a pose either way to scrub through the run. -->
  <button class="nav prev" aria-label="Previous pose" onclick={() => session.prev()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
  </button>
  <button class="nav next" aria-label="Next pose" onclick={() => session.next()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
  </button>

  <div class="hud">
    <span class="count">Pose {session.poseNumber} of {session.poseCount}</span>
    <span class="clock" class:resting={session.resting}>{formatClock(session.remaining)}</span>
    <button class="end" onclick={() => screen.show('summary')}>End</button>
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

  .rest {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
  }

  .rest span {
    color: var(--fg-muted);
    font-size: 1.1rem;
    letter-spacing: 0.35em;
    text-transform: uppercase;
  }

  .nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 3rem;
    height: 4.5rem;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--fg-muted);
    opacity: 0.25;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .nav:hover,
  .nav:focus-visible {
    opacity: 0.85;
  }

  .nav.prev {
    left: 0.5rem;
  }

  .nav.next {
    right: 0.5rem;
  }

  .nav svg {
    width: 2rem;
    height: 2rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
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
  }

  .clock {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.05em;
    opacity: 0.9;
  }

  .clock.resting {
    opacity: 0.5;
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
