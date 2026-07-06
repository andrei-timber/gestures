<script lang="ts">
  import { screen } from '@/state/screen.svelte'
  import { session } from '@/state/session.svelte'

  // "Continue the pose" (reached from Summary): the last reference held on screen
  // with no timer, no HUD — just the pose, to keep drawing it as long as you
  // like. The session store keeps `currentImage` on the pose it ended on, so this
  // reads it straight off the still-loaded run. Esc (or the corner exit) returns
  // to Setup; a reload does the same. Nothing here ticks the clock.
  function exit(): void {
    screen.show('setup')
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (event.key === 'Escape') {
      event.preventDefault()
      exit()
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<section class="screen">
  {#if session.currentImage}
    <img class="pose" src={session.currentImage.url} alt="Pose reference" />
  {/if}

  <!-- Same top-left glass exit as the session, so leaving free-draw is the same
       gesture. Esc is wired above; the disc keeps it reachable on touch (iPad). -->
  <button class="exit glass" title="Exit (esc)" aria-label="Exit (esc)" onclick={exit}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6 18 18M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </button>
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
</style>
