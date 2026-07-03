<script lang="ts">
  import { APP_NAME } from '@/lib/constants'
</script>

<main>
  <h1>{APP_NAME}</h1>
  <p>Skeleton ready. Core drawing experience arrives in M0.</p>
</main>

<style>
  main {
    min-height: 100dvh;
    display: grid;
    place-content: center;
    gap: 0.5rem;
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
