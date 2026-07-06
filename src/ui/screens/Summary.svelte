<script lang="ts">
  import { formatDuration } from '@/lib/format'
  import { screen } from '@/state/screen.svelte'
  import { session } from '@/state/session.svelte'

  // Calm recap of the run just finished (step 14): how many poses, how long.
  // Reports the *actual* run — poses reached and seconds ticked — so ending
  // early via End/Esc reads truthfully rather than restating the plan. On a run
  // played to the end these equal the planned count/total. Reads from the
  // still-loaded session; "New session" returns to setup, where starting again
  // reloads the runtime fresh.
</script>

<section class="screen">
  <p class="lead">Session complete</p>
  <p class="recap">
    {session.posesDrawn} pose{session.posesDrawn === 1 ? '' : 's'} · {formatDuration(
      session.elapsedSeconds,
    )}
  </p>
  <div class="actions">
    <!-- Keep drawing the last pose with no timer (Esc → Setup). Offered only when
         a pose is still loaded to continue. -->
    {#if session.currentImage}
      <button class="continue" onclick={() => screen.show('freedraw')}>Continue the pose</button>
    {/if}
    <button class="again" onclick={() => screen.show('setup')}>New session</button>
  </div>
</section>

<style>
  .screen {
    min-height: 100dvh;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 1rem;
    text-align: center;
  }

  .lead {
    margin: 0;
    font-size: 1.4rem;
    letter-spacing: 0.02em;
  }

  .recap {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.95rem;
  }

  /* Two side-by-side actions; wrap on very narrow screens. */
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }

  .again {
    background: var(--accent);
    border-color: transparent;
    color: var(--on-accent);
    font-weight: 500;
  }

  .again:hover {
    border-color: transparent;
    background: color-mix(in srgb, var(--accent) 88%, white);
  }

  /* Secondary action — an outline button, subordinate to the accent "New session". */
  .continue {
    border: 1px solid var(--fg-muted);
    color: var(--fg);
  }

  .continue:hover {
    border-color: var(--fg);
  }
</style>
