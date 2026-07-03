<script lang="ts">
  import { screen } from '@/state/screen.svelte'
  import Setup from './screens/Setup.svelte'
  import Session from './screens/Session.svelte'
  import Summary from './screens/Summary.svelte'
</script>

{#if screen.current === 'setup'}
  <Setup />
{:else if screen.current === 'session'}
  <Session />
{:else}
  <Summary />
{/if}
