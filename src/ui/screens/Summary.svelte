<script lang="ts">
  import { formatDuration } from '@/lib/format'
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
  // deferred to the actual Save click (spec §3) — the panel just gathers notes.
  // Save writes notes.txt + copies the run's ordered references (Ref_1…N); the
  // user's own drawing upload arrives in a3. The disclaimer stays honest to what
  // this build writes today.
  let logging = $state(false)
  let notes = $state('')
  const today = sessionFolderName(new Date())

  function openLog(): void {
    capture.reset()
    logging = true
  }
  function closeLog(): void {
    logging = false
    capture.reset()
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
          <strong>{session.posesDrawn}</strong> reference{session.posesDrawn === 1 ? '' : 's'} you drew.
          You’ll sign in with Google the first time.
          <span class="soon">(Uploading your own drawings comes next.)</span>
        </p>
        <textarea
          bind:value={notes}
          rows="4"
          placeholder="Free-form notes (optional)"
          aria-label="Free-form session notes"
          disabled={capture.status === 'working'}
        ></textarea>
        <div class="log-actions">
          <button
            class="save"
            disabled={capture.status === 'working'}
            onclick={() => capture.log(notes, session.images.slice(0, session.posesDrawn))}
          >
            {capture.status === 'working' ? 'Saving…' : 'Save to Drive'}
          </button>
          <button class="cancel" onclick={closeLog} disabled={capture.status === 'working'}>Cancel</button>
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

  .disclaimer .soon {
    opacity: 0.7;
    font-style: italic;
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
