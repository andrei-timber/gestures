<script lang="ts">
  import { type DirEntry, collectFiles } from '@/lib/source/directory'
  import { source } from '@/state/source.svelte'

  // Prefer the File System Access API where present (Chromium, the deploy
  // target): its permission prompt reads "view files", not the misleading
  // "upload all files from … to this site" that a webkitdirectory <input>
  // forces (docs/folder-picker-permission.md). Nothing is ever uploaded either
  // way — source.load only reads File objects locally (spec §9). Where the API
  // is missing (Firefox/Safari) we fall back to the classic input.
  // Not yet in the TS DOM lib; narrow to the one method we call.
  type DirectoryPicker = { showDirectoryPicker(): Promise<unknown> }
  const canPickDirectory = 'showDirectoryPicker' in window

  let fallbackInput: HTMLInputElement

  async function pick(): Promise<void> {
    if (canPickDirectory) {
      let handle: DirEntry
      try {
        handle = (await (window as unknown as DirectoryPicker).showDirectoryPicker()) as DirEntry
      } catch {
        return // the user dismissed the picker — leave the current set untouched
      }
      source.load(await collectFiles(handle))
    } else {
      fallbackInput.click()
    }
  }

  function onChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement
    source.load(input.files ? Array.from(input.files) : [])
  }
</script>

<div class="folder">
  <button type="button" class="pick" onclick={pick}>Choose a reference folder</button>
  <!-- Fallback picker, triggered programmatically only when the API is absent. -->
  <input
    class="fallback"
    type="file"
    accept="image/*"
    multiple
    webkitdirectory
    bind:this={fallbackInput}
    onchange={onChange}
  />
  <p class="reassure">Files stay in your browser — nothing is uploaded.</p>
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

  .pick {
    font: inherit;
    color: var(--fg);
    background: transparent;
    border: 1px solid var(--fg-muted);
    border-radius: 0.4rem;
    padding: 0.5rem 1.1rem;
    cursor: pointer;
    transition: border-color 0.15s ease;
  }

  .pick:hover {
    border-color: var(--fg);
  }

  .fallback {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .reassure {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.78rem;
    opacity: 0.8;
  }

  .count {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.85rem;
  }
</style>
