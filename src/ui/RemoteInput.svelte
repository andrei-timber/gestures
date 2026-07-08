<script lang="ts">
  import { fetchDriveImages, DriveError } from '@/lib/source/drive'
  import { source } from '@/state/source.svelte'
  import { settings } from '@/state/settings.svelte'

  // App-owned, referrer-restricted key inlined by Vite (spec §3; docs/deploy-notes.md).
  // Absent in a dev checkout without .env.local → the Drive row explains rather than fails.
  const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY ?? ''
  const configured = apiKey !== ''

  // Seed from the remembered link so the iPad path is one tap; the user still
  // presses Load (no surprise fetch / quota spend on every Setup visit).
  let link = $state(settings.driveLink)
  let status = $state<'idle' | 'loading'>('idle')
  let error = $state('')

  // Box / Dropbox were scoped out: both need a server-side app token (no anonymous
  // link listing like Drive), not worth a Worker for a solo tool. Revisit on demand.
  // Decided 2026-07-08 (docs/decisions.md; spec §3).

  async function load(): Promise<void> {
    if (status === 'loading' || link.trim() === '') return
    status = 'loading'
    error = ''
    try {
      const images = await fetchDriveImages(link, apiKey)
      if (images.length === 0) {
        // A resolved-but-empty folder isn't a source: don't wipe an already-loaded
        // local pick, and don't remember a link that yields nothing.
        error = 'That folder has no .jpg, .png, or .webp images.'
        return
      }
      source.loadRemote(images)
      settings.driveLink = link.trim() // remember only a link that actually resolved
    } catch (err) {
      error = err instanceof DriveError ? err.message : 'Something went wrong loading the folder.'
    } finally {
      status = 'idle'
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') void load()
  }
</script>

<div class="remote">
  <div class="row">
    <input
      type="url"
      inputmode="url"
      class:filled={link.trim() !== ''}
      placeholder="https://drive.google.com/drive/folders/…"
      bind:value={link}
      onkeydown={onKeydown}
      disabled={!configured || status === 'loading'}
      aria-label="Public Google Drive folder link"
    />
    <button onclick={load} disabled={!configured || status === 'loading' || link.trim() === ''}>
      {status === 'loading' ? 'Loading…' : 'Load'}
    </button>
  </div>

  {#if !configured}
    <p class="note">Drive loading isn’t configured in this build (no API key).</p>
  {:else if error}
    <p class="note error">{error}</p>
  {/if}
</div>

<style>
  .remote {
    display: grid;
    gap: 0.5rem;
    width: var(--setup-col, 21rem);
    text-align: left;
  }

  .row {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }

  input {
    flex: 1;
    min-width: 0;
    font: inherit;
    font-size: 0.85rem;
    color: var(--fg);
    background: color-mix(in srgb, var(--bg) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--fg-muted) 55%, transparent);
    border-radius: 0.4rem;
    padding: 0.45rem 0.6rem;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  /* Empty vs pasted needs to read at a glance (owner feedback): an empty field
     sits fainter with a dim placeholder, so it's obviously blank; a field with a
     link picks up an accent-tinted border + fill so a pasted value shows without
     clicking in and scrolling the long URL. */
  input::placeholder {
    color: color-mix(in srgb, var(--fg-muted) 55%, transparent);
  }

  input.filled {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 8%, color-mix(in srgb, var(--bg) 55%, transparent));
  }

  input:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--fg-muted) 85%, transparent);
  }

  input:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--accent) 65%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 26%, transparent);
  }

  button {
    white-space: nowrap;
    border: 1px solid var(--fg-muted);
    border-radius: 0.4rem;
    padding: 0.45rem 0.9rem;
    cursor: pointer;
    transition: border-color 0.15s ease;
  }

  button:hover:not(:disabled) {
    border-color: var(--fg);
  }

  button:disabled,
  input:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .note {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.78rem;
  }

  .error {
    color: color-mix(in srgb, var(--accent) 70%, var(--fg));
  }
</style>
