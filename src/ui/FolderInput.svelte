<script lang="ts">
  import { source } from '@/state/source.svelte'

  // Folder pick uses the classic `<input webkitdirectory>`: it enumerates the
  // whole tree completely, including files with odd/mojibake names. The nicer
  // `showDirectoryPicker()` prompt was tried and reverted — Chrome silently
  // drops files whose names contain characters it dislikes (nbsp, soft hyphen,
  // combining marks), handing back a partial or empty set with no error, which
  // is worse than a scary prompt for a reference library (docs/folder-picker-
  // permission.md). `multiple` also lets a plain multi-file selection through;
  // non-images are dropped by source.load.
  function onChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement
    source.load(input.files ? Array.from(input.files) : [])
  }
</script>

<div class="folder">
  <label>
    <input type="file" accept="image/*" multiple webkitdirectory onchange={onChange} />
    <span>Choose a reference folder</span>
  </label>
  <!-- Reassurance: the webkitdirectory prompt reads as "upload all files…", but
       nothing leaves the browser — source.load only reads File objects locally. -->
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
