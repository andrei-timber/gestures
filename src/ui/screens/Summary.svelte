<script lang="ts">
  import { screen } from '@/state/screen.svelte'

  // Placeholder shell (step 8). Step 14 replaces this with the calm recap
  // (poses drawn, total time) before returning to setup.
</script>

<section class="screen">
  <p>Session complete.</p>
  <button onclick={() => screen.show('setup')}>New session</button>
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
