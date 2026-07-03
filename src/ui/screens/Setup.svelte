<script lang="ts">
  import { APP_NAME } from '@/lib/constants'
  import { screen } from '@/state/screen.svelte'

  // Placeholder shell (step 8). Step 10 replaces this with mode/param inputs,
  // the live total-time FYI, and a Start that builds the pose plan.
</script>

<section class="screen">
  <h1>{APP_NAME}</h1>
  <p>Set up a drawing session.</p>
  <button onclick={() => screen.show('session')}>Start session</button>
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

  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  p {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.95rem;
  }
</style>
