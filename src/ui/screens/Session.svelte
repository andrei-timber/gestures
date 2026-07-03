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
