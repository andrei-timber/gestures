<script lang="ts">
  import { APP_NAME } from '@/lib/constants'
  import { MIN_POSES } from '@/lib/session/limits'
  import { formatDuration } from '@/lib/format'
  import { makeRng } from '@/lib/session/order'
  import { buildPlan } from '@/lib/session/plan'
  import { QUICK_INTERVALS_SECONDS, customIntervalSeconds, quickCeiling } from '@/lib/session/quick'
  import {
    clampIntervalSeconds,
    clampPoseCount,
    clampRestSeconds,
  } from '@/lib/session/settings'
  import { selectRun } from '@/lib/session/select'
  import { warm } from '@/lib/source/preload'
  import { totalSeconds } from '@/lib/session/timing'
  import type { Theme } from '@/lib/session/settings'
  import { screen } from '@/state/screen.svelte'
  import { session } from '@/state/session.svelte'
  import { settings } from '@/state/settings.svelte'
  import { source } from '@/state/source.svelte'
  import FolderInput from '../FolderInput.svelte'

  // Icon-only theme picker (spec §14). Each swatch previews its own theme, so it
  // carries that theme's canvas + accent literally (the root only holds the
  // active theme's tokens); the canonical hex live in `app.css`, mirrored here
  // just for the un-selected previews. Glyph disambiguates beyond colour (a11y).
  const themeOptions: { id: Theme; name: string; bg: string; ink: string }[] = [
    { id: 'moonlit', name: 'Moonlit', bg: '#0b0d13', ink: '#5aa9ff' },
    { id: 'candlelit', name: 'Candlelit', bg: '#12100c', ink: '#f0a850' },
    { id: 'sanguine', name: 'Sanguine', bg: '#14100c', ink: '#c1553a' },
  ]

  // The folder's image count is a hard ceiling on the run (spec §5 — no repeats
  // beyond the pool). It flows into buildPlan as the pool cap so the plan (and
  // the FYI) never overstate the run. Unknown before a folder is chosen.
  const poolSize = $derived(source.count > 0 ? source.count : Infinity)
  // Class mode's geometric arc needs its ≥10-pose minimum, which a folder of
  // fewer images can't fill without repeats — so Class is only offered at ≥10
  // images; below that the mode falls back to Quick (spec §5). Unknown folder
  // (no pick yet) keeps Class available as the default.
  const classAllowed = $derived(source.count === 0 || source.count >= MIN_POSES)
  $effect(() => {
    if (!classAllowed && settings.mode === 'class') settings.mode = 'quick'
  })

  // Live plan + total-time FYI recompute from settings as the user tweaks.
  const plan = $derived(buildPlan(settings, poolSize))
  const total = $derived(totalSeconds(plan, settings.restSeconds))
  const effectiveCount = $derived(Math.min(settings.poseCount, poolSize))
  // Two reasons the run may be shorter than asked: health caps clamp the count,
  // or the folder holds fewer images than requested.
  const healthCapped = $derived(plan.length > 0 && plan.length < effectiveCount)
  const folderCapped = $derived(source.count > 0 && source.count < settings.poseCount)
  // A Quick interval out of range (≤0 or past the 90-min cap) fits zero poses,
  // so the plan is empty and Start disables. Unlike healthCapped — a shorter but
  // runnable plan — this is a dead end, so the FYI says why instead of "0 poses".
  const intervalOutOfRange = $derived(
    settings.mode === 'quick' && quickCeiling(settings.intervalSeconds) < 1,
  )

  const presets = QUICK_INTERVALS_SECONDS as readonly number[]
  const isCustomInterval = $derived(!presets.includes(settings.intervalSeconds))
  const intervalSelectValue = $derived(
    isCustomInterval ? 'custom' : String(settings.intervalSeconds),
  )

  // Remember the last custom interval so returning to "Custom…" restores it,
  // rather than discarding the user's entry and snapping back to a 3-min default.
  let lastCustomSeconds = $state(customIntervalSeconds(3))
  $effect(() => {
    if (isCustomInterval) lastCustomSeconds = settings.intervalSeconds
  })

  function selectInterval(value: string): void {
    settings.intervalSeconds = value === 'custom' ? lastCustomSeconds : Number(value)
  }

  const ready = $derived(source.count > 0 && plan.length > 0)

  function start(): void {
    if (!ready) return
    // Seed once per run (deterministic core, random seed at the edge): pick the
    // spaced, display-ordered images, then play them alongside the plan.
    const rng = makeRng(Math.floor(Math.random() * 0x1_0000_0000))
    const images = selectRun(source.images, plan.length, rng, settings.randomize)
    session.load(plan, images, settings.restSeconds)
    session.start()
    // Warm the opening frame during the transition so the first pose paints
    // instantly; the in-session window prefetch takes over from there.
    void warm([images[0].url])
    screen.show('session')
  }
</script>

<section class="screen">
  <h1>{APP_NAME}</h1>
  <p class="tagline">
    Use this simple tool to practice timed figure drawing with your own reference folders.
  </p>

  <FolderInput />

  <div class="panel">
    <div class="modes" role="group" aria-label="Session mode">
      <button
        class:active={settings.mode === 'class'}
        disabled={!classAllowed}
        title="Pose lengths taper like a life-drawing class — many short warm-ups building to a few long holds."
        onclick={() => (settings.mode = 'class')}
      >
        Class
      </button>
      <button
        class:active={settings.mode === 'quick'}
        title="Every pose runs for the same fixed interval you choose."
        onclick={() => (settings.mode = 'quick')}
      >
        Quick
      </button>
    </div>
    {#if !classAllowed}
      <p class="note">Class mode needs {MIN_POSES}+ images — using Quick for this folder.</p>
    {/if}

    <label class="row">
      <span>Poses</span>
      <input
        type="number"
        min="10"
        step="1"
        bind:value={settings.poseCount}
        onblur={() => (settings.poseCount = clampPoseCount(settings.poseCount))}
      />
    </label>

    {#if settings.mode === 'quick'}
      <label class="row">
        <span>Interval</span>
        <span class="select-wrap">
          <select value={intervalSelectValue} onchange={(e) => selectInterval(e.currentTarget.value)}>
            <option value="30">30s</option>
            <option value="60">60s</option>
            <option value="120">2 min</option>
            <option value="300">5 min</option>
            <option value="custom">Custom…</option>
          </select>
        </span>
      </label>
      {#if isCustomInterval}
        <label class="row">
          <span>Custom (min)</span>
          <input
            type="number"
            min="0.5"
            max="90"
            step="0.5"
            value={settings.intervalSeconds / 60}
            oninput={(e) =>
              (settings.intervalSeconds = customIntervalSeconds(Number(e.currentTarget.value)))}
            onblur={() => (settings.intervalSeconds = clampIntervalSeconds(settings.intervalSeconds))}
          />
        </label>
      {/if}
    {/if}

    <label class="row">
      <span>Rest (s)</span>
      <input
        type="number"
        min="0"
        step="1"
        bind:value={settings.restSeconds}
        onblur={() => (settings.restSeconds = clampRestSeconds(settings.restSeconds))}
      />
    </label>

    <label class="check">
      <input type="checkbox" bind:checked={settings.randomize} />
      <span>Shuffle poses</span>
    </label>
  </div>

  <p class="fyi">
    {#if intervalOutOfRange}
      <span class="capped">Interval out of range — pick 0.5–90 min to start.</span>
    {:else}
      ≈ {formatDuration(total)} · {plan.length} pose{plan.length === 1 ? '' : 's'}
      {#if healthCapped}<span class="capped">(capped for health)</span>
      {:else if folderCapped}<span class="capped">(limited by folder)</span>{/if}
    {/if}
  </p>

  <button class="start" disabled={!ready} onclick={start}>Start session</button>

  <!-- Theme picker: icon-only swatches, one per palette (spec §14). Picking
       re-tints the whole app live and persists via the settings store. -->
  <div class="themes" role="radiogroup" aria-label="Theme">
    {#each themeOptions as opt (opt.id)}
      <button
        class="swatch glass"
        class:active={settings.theme === opt.id}
        role="radio"
        aria-checked={settings.theme === opt.id}
        aria-label={opt.name}
        title={opt.name}
        style:background={opt.bg}
        style:color={opt.ink}
        onclick={() => (settings.theme = opt.id)}
      >
        <!-- Glyph disambiguates each theme beyond colour (a11y): moon / flame / chalk stroke. -->
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {#if opt.id === 'moonlit'}
            <path d="M20 14.6A8 8 0 1 1 10.8 4a6.6 6.6 0 0 0 9.2 10.6z" fill="currentColor" />
          {:else if opt.id === 'candlelit'}
            <path
              d="M12 2.5c.7 2.6 3 3.7 3 6.4a3 3 0 0 1-6 0c0-1 .5-1.7 1-2.4.3 1 1 1.6 1.6 1.7-.5-1.9-.4-3.9.4-5.7z"
              fill="currentColor"
            />
            <path d="M9.2 14.5h5.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          {:else}
            <path d="M6.5 17.5 17.5 6.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          {/if}
        </svg>
      </button>
    {/each}
  </div>
</section>

<style>
  .screen {
    /* Shared column width for the two stacked cards (picker + params). Inherits
       into FolderInput via the custom-property cascade so both match exactly. */
    --setup-col: 21rem;
    min-height: 100dvh;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 1.25rem;
    padding: 2rem 1rem;
    text-align: center;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  /* One-line explainer under the title — what this is and why. */
  .tagline {
    margin: -0.4rem 0 0.25rem;
    max-width: 30rem;
    color: var(--fg-muted);
    font-size: 0.95rem;
    line-height: 1.5;
    text-wrap: balance;
  }

  .panel {
    display: grid;
    gap: 0.75rem;
    width: var(--setup-col);
    padding: 1.25rem 1.4rem;
    background: var(--surface);
    border: 1px solid color-mix(in srgb, var(--fg) 8%, transparent);
    border-radius: 0.75rem;
  }

  .modes {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .modes button.active {
    border-color: color-mix(in srgb, var(--accent) 55%, transparent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--fg);
  }

  .modes button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .note {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.8rem;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .row span {
    color: var(--fg-muted);
  }

  .row input,
  .row select {
    font: inherit;
    color: var(--fg);
    background: color-mix(in srgb, var(--bg) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--fg-muted) 55%, transparent);
    border-radius: 0.4rem;
    padding: 0.4rem 0.6rem;
    width: 7rem;
    text-align: right;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .row input:hover,
  .row select:hover {
    border-color: color-mix(in srgb, var(--fg-muted) 85%, transparent);
  }

  /* Themed focus — replace the browser's blue ring with the palette accent, on
     any focus (mouse or keyboard) so a clicked select never flashes native blue. */
  .row input:focus,
  .row select:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--accent) 65%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 26%, transparent);
  }

  /* Drop the native number spinners: cramped and unstyleable. Values are typed
     (Quick also has interval presets), keeping the field clean and right-aligned. */
  .row input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .row input[type='number']::-webkit-outer-spin-button,
  .row input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Custom select: strip native chrome and draw a themed chevron in the wrapper,
     with room reserved so the value never collides with it. */
  .select-wrap {
    position: relative;
    display: inline-flex;
  }

  .select-wrap select {
    appearance: none;
    -webkit-appearance: none;
    padding-right: 1.7rem;
    cursor: pointer;
  }

  .select-wrap::after {
    content: '';
    position: absolute;
    right: 0.65rem;
    top: 50%;
    width: 0.42rem;
    height: 0.42rem;
    border-right: 1.5px solid var(--fg-muted);
    border-bottom: 1.5px solid var(--fg-muted);
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--fg-muted);
    font-size: 0.9rem;
  }

  /* Tint the native checkbox with the palette accent (browser-default is blue). */
  .check input {
    accent-color: var(--accent);
  }

  .fyi {
    margin: 0;
    font-size: 1.05rem;
  }

  .capped {
    color: var(--fg-muted);
    font-size: 0.85rem;
  }

  /* Primary action — the one accent-filled control on the screen. */
  .start {
    background: var(--accent);
    border-color: transparent;
    color: var(--on-accent);
    font-weight: 500;
  }

  .start:hover:not(:disabled) {
    border-color: transparent;
    background: color-mix(in srgb, var(--accent) 88%, white);
  }

  .start:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* Theme picker — three icon-only swatches. Each previews its own palette
     (inline bg + glyph ink); the frosted `.glass` gives the pill body. */
  .themes {
    display: flex;
    gap: 0.6rem;
    justify-content: center;
    margin-top: 0.25rem;
  }

  .swatch {
    width: 2.4rem;
    height: 2.4rem;
    padding: 0;
    display: grid;
    place-items: center;
    border-radius: 0.6rem;
    opacity: 0.55;
    transition:
      opacity 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }

  .swatch:hover {
    opacity: 0.85;
    border-color: color-mix(in srgb, white 20%, transparent);
  }

  /* Active swatch === current theme, so the accent ring reads in-palette. */
  .swatch.active {
    opacity: 1;
    border-color: transparent;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 60%, transparent);
  }

  .swatch svg {
    width: 1.3rem;
    height: 1.3rem;
    fill: none;
  }
</style>
