<script lang="ts">
  import { APP_NAME } from '@/lib/constants'
  import { formatDuration } from '@/lib/format'
  import { buildPlan } from '@/lib/session/plan'
  import { QUICK_INTERVALS_SECONDS, customIntervalSeconds } from '@/lib/session/quick'
  import { totalSeconds } from '@/lib/session/timing'
  import { screen } from '@/state/screen.svelte'
  import { session } from '@/state/session.svelte'
  import { settings } from '@/state/settings.svelte'
  import { source } from '@/state/source.svelte'
  import FolderInput from '../FolderInput.svelte'

  // Live plan + total-time FYI recompute from settings as the user tweaks.
  const plan = $derived(buildPlan(settings))
  const total = $derived(totalSeconds(plan, settings.restSeconds))
  // The health caps may clamp the requested count; surface it when they bite.
  const capped = $derived(plan.length > 0 && plan.length !== settings.poseCount)

  const presets = QUICK_INTERVALS_SECONDS as readonly number[]
  const isCustomInterval = $derived(!presets.includes(settings.intervalSeconds))
  const intervalSelectValue = $derived(
    isCustomInterval ? 'custom' : String(settings.intervalSeconds),
  )

  function selectInterval(value: string): void {
    settings.intervalSeconds = value === 'custom' ? customIntervalSeconds(3) : Number(value)
  }

  const ready = $derived(source.count > 0 && plan.length > 0)

  function start(): void {
    if (!ready) return
    session.load(plan) // pose order + start are wired in step 11
    screen.show('session')
  }
</script>

<section class="screen">
  <h1>{APP_NAME}</h1>

  <FolderInput />

  <div class="panel">
    <div class="modes" role="group" aria-label="Session mode">
      <button class:active={settings.mode === 'class'} onclick={() => (settings.mode = 'class')}>
        Class
      </button>
      <button class:active={settings.mode === 'quick'} onclick={() => (settings.mode = 'quick')}>
        Quick
      </button>
    </div>

    <label class="row">
      <span>Poses</span>
      <input type="number" min="10" step="1" bind:value={settings.poseCount} />
    </label>

    {#if settings.mode === 'quick'}
      <label class="row">
        <span>Interval</span>
        <select value={intervalSelectValue} onchange={(e) => selectInterval(e.currentTarget.value)}>
          <option value="30">30s</option>
          <option value="60">60s</option>
          <option value="120">2 min</option>
          <option value="300">5 min</option>
          <option value="custom">Custom…</option>
        </select>
      </label>
      {#if isCustomInterval}
        <label class="row">
          <span>Custom (min)</span>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={settings.intervalSeconds / 60}
            oninput={(e) =>
              (settings.intervalSeconds = customIntervalSeconds(Number(e.currentTarget.value)))}
          />
        </label>
      {/if}
    {/if}

    <label class="row">
      <span>Rest (s)</span>
      <input type="number" min="0" step="1" bind:value={settings.restSeconds} />
    </label>

    <label class="check">
      <input type="checkbox" bind:checked={settings.randomize} />
      <span>Shuffle poses</span>
    </label>
    <label class="check">
      <input type="checkbox" bind:checked={settings.rememberLast} />
      <span>Remember these settings</span>
    </label>
  </div>

  <p class="fyi">
    ≈ {formatDuration(total)} · {plan.length} pose{plan.length === 1 ? '' : 's'}
    {#if capped}<span class="capped">(capped for health)</span>{/if}
  </p>

  <button class="start" disabled={!ready} onclick={start}>Start session</button>
  {#if source.count === 0}
    <p class="hint">Choose a reference folder to begin.</p>
  {/if}
</section>

<style>
  .screen {
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

  .panel {
    display: grid;
    gap: 0.75rem;
    min-width: 16rem;
  }

  .modes {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .modes button.active {
    border-color: var(--fg);
    background: color-mix(in srgb, var(--fg) 8%, transparent);
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
    background: transparent;
    border: 1px solid var(--fg-muted);
    border-radius: 0.4rem;
    padding: 0.35rem 0.5rem;
    width: 7rem;
    text-align: right;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--fg-muted);
    font-size: 0.9rem;
  }

  .fyi {
    margin: 0;
    font-size: 1.05rem;
  }

  .capped {
    color: var(--fg-muted);
    font-size: 0.85rem;
  }

  .start:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .hint {
    margin: 0;
    color: var(--fg-muted);
    font-size: 0.85rem;
  }
</style>
