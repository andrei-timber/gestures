/**
 * Reactive settings store (`gestures-spec.md` §5). Wraps the framework-free
 * settings core (`@/lib/session/settings`) in a `$state` rune and mirrors it to
 * localStorage for remember-last. Consumers mutate fields directly
 * (`settings.mode = 'quick'`) and persistence follows automatically.
 *
 * localStorage is guarded so this module is import-safe in non-browser contexts
 * (tests, prerender); the pure logic and its coverage live next door in `lib`.
 */

import { DEFAULT_SETTINGS, parse, serialize, type Settings } from '@/lib/session/settings'

/** localStorage key for the persisted config. Namespaced to the app. */
const STORAGE_KEY = 'gestures:settings'

const hasStorage = typeof localStorage !== 'undefined'

function load(): Settings {
  return hasStorage ? parse(localStorage.getItem(STORAGE_KEY)) : { ...DEFAULT_SETTINGS }
}

/** The live, reactive settings. Mutate fields directly; changes persist. */
export const settings = $state<Settings>(load())

function persist(): void {
  if (!hasStorage) return
  // Remember-last off means leave no trace between visits.
  if (settings.rememberLast) localStorage.setItem(STORAGE_KEY, serialize(settings))
  else localStorage.removeItem(STORAGE_KEY)
}

// Mirror every field change to storage. A root effect scope (no owning
// component) keeps this alive for the app's lifetime.
$effect.root(() => {
  $effect(persist)
})

/** Restore every field to the spec §5 defaults (persistence follows). */
export function resetSettings(): void {
  Object.assign(settings, DEFAULT_SETTINGS)
}
