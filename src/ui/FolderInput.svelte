<script lang="ts">
  import { source } from '@/state/source.svelte'
  import { filesFromDataTransfer } from '@/lib/source/dropped-files'

  // Two ways in, same `source.load(File[])` contract:
  //   • Button — `<input webkitdirectory>`, enumerates the whole tree including
  //     odd/mojibake names. `showDirectoryPicker()` was tried and reverted (it
  //     silently drops files with characters Chrome dislikes); the cost is
  //     Chrome's scary "upload all files" prompt on this path.
  //   • Drop a folder — the Entry API (`webkitGetAsEntry`) walks the same tree
  //     with NO prompt (the drag gesture is the grant). See docs/folder-picker-
  //     permission-2026-07-04.md.
  // `multiple` also lets a plain multi-file selection through; non-images are
  // dropped by source.load.
  let dragging = $state(false)
  let error = $state('')

  function onChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement
    error = ''
    source.load(input.files ? Array.from(input.files) : [])
  }

  function onDragOver(event: DragEvent): void {
    event.preventDefault() // required for a drop to fire
    dragging = true
  }

  function onDragLeave(event: DragEvent): void {
    // Ignore leaves that land on a descendant — only clear when the pointer
    // actually exits the card, so moving over the button doesn't flicker it.
    const next = event.relatedTarget
    const card = event.currentTarget as Node
    if (next instanceof Node && card.contains(next)) return
    dragging = false
  }

  async function onDrop(event: DragEvent): Promise<void> {
    event.preventDefault()
    dragging = false
    if (!event.dataTransfer) return
    error = ''
    // A rejected entry read (permission/IO, a network-mounted folder, a file
    // removed mid-drop) would otherwise be a silent no-op — surface it and point
    // the user at the Pick button, which walks the tree without the Entry API.
    try {
      source.load(await filesFromDataTransfer(event.dataTransfer))
    } catch {
      error = 'Couldn’t read that folder — try the Pick button instead.'
    }
  }
</script>

<!-- The dashed card is the drop target (dropping a folder skips the browser's
     upload prompt — docs/folder-picker-permission-2026-07-04.md). The section
     prompt, privacy reassurance, and shared "N images loaded" count all live once
     in Setup, since the remote card feeds the same `source`. -->
<div
  class="folder"
  class:dragging
  role="button"
  tabindex="-1"
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
>
  <label>
    <input type="file" accept="image/*" multiple webkitdirectory onchange={onChange} />
    <span>Pick</span>
  </label>
  <p class="hint">…or drag-and-drop a folder here.</p>
  {#if error}<p class="hint error">{error}</p>{/if}
</div>

<style>
  .folder {
    /* Stretches to match the remote links block's height (Setup stretches the row). */
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.5rem;
    width: var(--setup-col, 21rem);
    padding: 1.25rem 1.5rem;
    /* Faint resting outline so the card reads as a drop target; it strengthens
       (+ tint) while a folder is dragged over. */
    border: 1px dashed color-mix(in srgb, var(--fg-muted) 45%, transparent);
    border-radius: 0.6rem;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
  }

  /* Highlight while a folder is dragged over the card. */
  .folder.dragging {
    border-color: var(--fg-muted);
    background-color: color-mix(in srgb, var(--fg) 6%, transparent);
  }

  label span {
    display: inline-block;
    white-space: nowrap;
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

  .hint {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.85rem;
  }

  .hint.error {
    color: color-mix(in srgb, var(--accent) 70%, var(--fg));
  }

</style>
