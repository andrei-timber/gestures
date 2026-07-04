/**
 * Reactive settings store (`gestures-spec.md` §5). Wraps the framework-free
 * settings core (`@/lib/session/settings`) in a `$state` rune and mirrors it to
 * localStorage (settings are always remembered). Consumers mutate fields directly
 * (`settings.mode = 'quick'`) and persistence follows automatically.
 *
 * localStorage is guarded so this module is import-safe in non-browser contexts
 * (tests, prerender); the pure logic and its coverage live next door in `lib`.
 */

import { DEFAULT_SETTINGS, parse, serialize, type Settings } from '@/lib/session/settings'

/** localStorage key for the persisted config. Namespaced to the app. */
const STORAGE_KEY = 'gestures:settings'

const hasStorage = typeof localStorage !== 'undefined'
const hasDocument = typeof document !== 'undefined'

function load(): Settings {
  return hasStorage ? parse(localStorage.getItem(STORAGE_KEY)) : { ...DEFAULT_SETTINGS }
}

/** The live, reactive settings. Mutate fields directly; changes persist. */
export const settings = $state<Settings>(load())

function persist(): void {
  if (!hasStorage) return
  localStorage.setItem(STORAGE_KEY, serialize(settings))
}

/**
 * Reflect the chosen theme onto the root as `data-theme`, which selects the
 * matching token set in `app.css`. Applied imperatively at module load (before
 * mount) so the persisted theme paints on first frame with no default-theme
 * flash, then kept in sync reactively so the Setup picker live-previews.
 */
function applyTheme(): void {
  if (hasDocument) document.documentElement.dataset.theme = settings.theme
}
applyTheme()

// Mirror every field change to storage, and the theme to the DOM. A root effect
// scope (no owning component) keeps these alive for the app's lifetime.
$effect.root(() => {
  $effect(persist)
  $effect(applyTheme)
})

/** Restore every field to the spec §5 defaults (persistence follows). */
export function resetSettings(): void {
  Object.assign(settings, DEFAULT_SETTINGS)
}
