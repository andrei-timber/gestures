<script lang="ts">
  import { screen } from '@/state/screen.svelte'

  // Placeholder shell (step 8). Steps 11–13 replace this with the full-bleed
  // slideshow, "pose N of M", the calm countdown, and rest slides.
</script>

<section class="screen">
  <p>Session in progress.</p>
  <button onclick={() => screen.show('summary')}>End session</button>
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

  p {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.95rem;
  }
</style>
