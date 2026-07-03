<script lang="ts">
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

  <!-- Faint side controls: skip a pose either way to scrub through the run. -->
  <button class="nav prev" aria-label="Previous pose" onclick={() => session.prev()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
  </button>
  <button class="nav next" aria-label="Next pose" onclick={() => session.next()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
  </button>

  <div class="hud">
    <span class="count">Pose {session.poseNumber} of {session.poseCount}</span>
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
