<script lang="ts">
  import { source } from '@/state/source.svelte'

  // Folder pick (webkitdirectory) is the M0 local source; `multiple` also lets
  // a plain multi-file selection through. Non-images are dropped by source.load.
  function onChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement
    source.load(input.files ? Array.from(input.files) : [])
  }
</script>

<div class="folder">
  <label>
    <input
      type="file"
      accept="image/*"
      multiple
      webkitdirectory
      onchange={onChange}
    />
    <span>Choose a reference folder</span>
  </label>
  {#if source.count > 0}
    <p class="count">{source.count} image{source.count === 1 ? '' : 's'} loaded</p>
  {/if}
</div>

<style>
  .folder {
    display: grid;
    justify-items: center;
    gap: 0.5rem;
  }

  label span {
    display: inline-block;
    border: 1px solid var(--fg-muted);
    border-radius: 0.4rem;
    padding: 0.5rem 1.1rem;
    cursor: pointer;
    transition: border-color 0.15s ease;
  }

  label:hover span {
    border-color: var(--fg);
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .count {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.85rem;
  }
</style>
