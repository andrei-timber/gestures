<script lang="ts">
  import { formatDuration } from '@/lib/format'
  import { PsdReadError, extractPsdDrawings, type DrawingImage } from '@/lib/capture/psd'
  import { sessionFolderName } from '@/lib/source/drive-write'
  import { capture } from '@/state/capture.svelte'
  import { screen } from '@/state/screen.svelte'
  import { session } from '@/state/session.svelte'

  // Calm recap of the run just finished (step 14): how many poses, how long.
  // Reports the *actual* run — poses reached and seconds ticked — so ending
  // early via End/Esc reads truthfully rather than restating the plan. On a run
  // played to the end these equal the planned count/total. Reads from the
  // still-loaded session; "New session" returns to setup, where starting again
  // reloads the runtime fresh.

  // Optional capture (M2 slice a): log the session to the user's Drive. Sign-in is
  // deferred to the actual Save click (spec §3) — the panel just gathers notes and
  // the session PSD. Save writes notes.txt, copies the run's ordered references
  // (Ref_1…N), and — for each numbered PSD layer — the paired reference↔drawing
  // composite (Pair_N). The bare drawing is never saved on its own.
  let logging = $state(false)
  let notes = $state('')
  const today = sessionFolderName(new Date())

  // The drawings are read from the PSD at *pick* time, not at Save: a wrong file
  // or an unexpected layer naming surfaces immediately, before any sign-in popup.
  let drawings = $state<DrawingImage[]>([])
  let psdName = $state('')
  let psdError = $state('')
  let reading = $state(false)

  const busy = $derived(capture.status === 'working' || reading)
  // Only layers whose pose the run actually reached can be paired with a reference.
  const pairable = $derived(
    drawings.map((d) => d.number).filter((n) => n >= 1 && n <= session.posesDrawn),
  )

  async function pickPsd(event: Event): Promise<void> {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    reading = true
    psdError = ''
    psdName = file.name
    drawings = []
    try {
      drawings = await extractPsdDrawings(file)
      if (drawings.length === 0) {
        psdError = 'No numbered layers found — name each drawing’s layer “Layer 1”, “Layer 2”, …'
      }
    } catch (err) {
      psdError = err instanceof PsdReadError ? err.message : 'Couldn’t read that Photoshop file.'
      psdName = ''
    } finally {
      reading = false
    }
  }

  function clearPsd(): void {
    drawings = []
    psdName = ''
    psdError = ''
  }

  // Fresh recap for a fresh session: clear any prior "logged" result and the
  // cached folder, so starting another session before uploading doesn't show the
  // last one's status and the next log lands in its own dated folder.
  capture.newSession()

  function openLog(): void {
    capture.reset()
    logging = true
  }
  function closeLog(): void {
    logging = false
    capture.reset()
    clearPsd()
  }
</script>

<section class="screen">
  <p class="lead">Session complete</p>
  <p class="recap">
    {session.posesDrawn} pose{session.posesDrawn === 1 ? '' : 's'} · {formatDuration(
      session.elapsedSeconds,
    )}
  </p>
  <div class="actions">
    <!-- Keep drawing the last pose with no timer (Esc → Setup). Offered only when
         a pose is still loaded to continue. -->
    {#if session.currentImage}
      <button class="continue" onclick={() => screen.show('freedraw')}>Continue the pose</button>
    {/if}
    <button class="again" onclick={() => screen.show('setup')}>New session</button>
  </div>

  {#if capture.configured}
    <div class="log">
      {#if !logging}
        <button class="log-toggle" onclick={openLog}>Log session to Drive…</button>
      {:else}
        <p class="disclaimer">
          Saves to <strong>Gestures&nbsp;Sessions/{today}/</strong> in your Google&nbsp;Drive — creates the
          folder, writes a <strong>notes.txt</strong>, and copies the
          <strong>{session.posesDrawn}</strong> reference{session.posesDrawn === 1 ? '' : 's'} you drew,
          plus a reference↔drawing pair for each layer of the PSD you attach. You’ll sign in with
          Google the first time.
        </p>
        <textarea
          bind:value={notes}
          rows="4"
          placeholder="Free-form notes (optional)"
          aria-label="Free-form session notes"
          disabled={busy}
        ></textarea>

        <!-- Drawings ride along as the session .psd: one layer per pose, named
             "Layer N", exploded in-browser and saved as reference↔drawing
             composites (Pair_N) rather than as bare drawings (spec §7). -->
        <div class="psd">
          <label class="psd-pick" class:disabled={busy}>
            <input type="file" accept=".psd,image/vnd.adobe.photoshop" onchange={pickPsd} disabled={busy} />
            {psdName ? 'Choose a different PSD…' : 'Add your drawings (.psd)…'}
          </label>
          {#if reading}
            <p class="psd-note">Reading layers…</p>
          {:else if psdError}
            <p class="psd-note err">{psdError}</p>
          {:else if drawings.length > 0}
            <p class="psd-note">
              <strong>{psdName}</strong> → {pairable.length} pair{pairable.length === 1 ? '' : 's'}
              for pose{pairable.length === 1 ? '' : 's'}
              {pairable.join(', ')}
              {#if pairable.length < drawings.length}
                <span class="hint">({drawings.length - pairable.length} layer(s) past this run’s poses)</span>
              {/if}
              <button class="psd-clear" onclick={clearPsd} disabled={busy}>remove</button>
            </p>
          {:else}
            <p class="psd-note hint">One layer per pose, named “Layer 1”, “Layer 2”, … Optional.</p>
          {/if}
        </div>

        <div class="log-actions">
          <button
            class="save"
            disabled={busy}
            onclick={() => capture.log(notes, session.images.slice(0, session.posesDrawn), drawings)}
          >
            {capture.status === 'working' ? 'Saving…' : 'Save to Drive'}
          </button>
          <button class="cancel" onclick={closeLog} disabled={busy}>Cancel</button>
        </div>
      {/if}

      {#if capture.status === 'done'}
        <p class="result ok">
          {capture.message}
          <a href={capture.folderUrl} target="_blank" rel="noopener noreferrer">Open folder ↗</a>
        </p>
      {:else if capture.status === 'error'}
        <p class="result err">{capture.message}</p>
      {/if}
    </div>
  {/if}
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

  .lead {
    margin: 0;
    font-size: 1.4rem;
    letter-spacing: 0.02em;
  }

  .recap {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.95rem;
  }

  /* Two side-by-side actions; wrap on very narrow screens. */
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }

  .again {
    background: var(--accent);
    border-color: transparent;
    color: var(--on-accent);
    font-weight: 500;
  }

  .again:hover {
    border-color: transparent;
    background: color-mix(in srgb, var(--accent) 88%, white);
  }

  /* Secondary action — an outline button, subordinate to the accent "New session". */
  .continue {
    border: 1px solid var(--fg-muted);
    color: var(--fg);
  }

  .continue:hover {
    border-color: var(--fg);
  }

  /* Capture panel — a quiet, subordinate affordance below the primary actions. */
  .log {
    display: grid;
    gap: 0.6rem;
    justify-items: center;
    width: min(30rem, 90vw);
    margin-top: 0.5rem;
  }

  .log-toggle {
    border: 1px solid color-mix(in srgb, var(--fg-muted) 60%, transparent);
    color: var(--fg-muted);
    font-size: 0.85rem;
  }

  .log-toggle:hover {
    border-color: var(--fg-muted);
    color: var(--fg);
  }

  .disclaimer {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.8rem;
    line-height: 1.5;
    text-align: center;
  }

  /* PSD picker — same quiet register as the notes field, one row below it. */
  .psd {
    display: grid;
    gap: 0.35rem;
    justify-items: center;
    width: 100%;
  }

  /* The native file input is hidden; the label carries the button affordance. */
  .psd-pick {
    display: inline-block;
    padding: 0.4rem 0.75rem;
    border: 1px dashed color-mix(in srgb, var(--fg-muted) 55%, transparent);
    border-radius: 0.4rem;
    color: var(--fg-muted);
    font-size: 0.82rem;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .psd-pick:hover {
    border-color: var(--fg-muted);
    color: var(--fg);
  }

  .psd-pick.disabled {
    opacity: 0.5;
    cursor: default;
  }

  .psd-pick input {
    display: none;
  }

  .psd-note {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .psd-note.hint {
    opacity: 0.7;
    font-style: italic;
  }

  .psd-note.err {
    color: color-mix(in srgb, var(--accent) 70%, var(--fg));
  }

  /* An inline "remove", not a button-shaped control — it sits inside a sentence. */
  .psd-clear {
    padding: 0;
    border: none;
    background: none;
    color: color-mix(in srgb, var(--accent) 80%, var(--fg));
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  textarea {
    width: 100%;
    font: inherit;
    font-size: 0.85rem;
    color: var(--fg);
    background: color-mix(in srgb, var(--bg) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--fg-muted) 55%, transparent);
    border-radius: 0.4rem;
    padding: 0.5rem 0.6rem;
    resize: vertical;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  textarea::placeholder {
    color: color-mix(in srgb, var(--fg-muted) 55%, transparent);
  }

  textarea:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--accent) 65%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 26%, transparent);
  }

  .log-actions {
    display: flex;
    gap: 0.6rem;
  }

  .save {
    background: var(--accent);
    border-color: transparent;
    color: var(--on-accent);
    font-weight: 500;
  }

  .save:hover:not(:disabled) {
    border-color: transparent;
    background: color-mix(in srgb, var(--accent) 88%, white);
  }

  .save:disabled,
  .cancel:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .cancel {
    border: 1px solid var(--fg-muted);
    color: var(--fg-muted);
  }

  .cancel:hover:not(:disabled) {
    border-color: var(--fg);
    color: var(--fg);
  }

  .result {
    margin: 0;
    font-size: 0.82rem;
  }

  .result.ok {
    color: var(--fg-muted);
  }

  .result.ok a {
    color: color-mix(in srgb, var(--accent) 80%, var(--fg));
    white-space: nowrap;
  }

  .result.err {
    color: color-mix(in srgb, var(--accent) 70%, var(--fg));
  }
</style>
