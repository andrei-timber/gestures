/**
 * Session settings (`gestures-spec.md` §5 shared params) — the framework-free
 * core: the {@link Settings} shape, its defaults, and JSON (de)serialization for
 * persistence (settings are always remembered). The reactive store
 * (`src/state/settings.svelte.ts`) wraps this; keeping the logic pure keeps it
 * node-testable and storage-agnostic.
 *
 * `parse` is defensive: persisted JSON is untrusted (older app versions, hand
 * edits, corruption), so every field falls back to its default independently
 * rather than rejecting the whole blob.
 */

import { MIN_POSES } from './caps'
import { DEFAULT_INTERVAL_SECONDS } from './quick'
import { DEFAULT_REST_SECONDS } from './timing'

/** The two session modes (spec §5). Class is the default idea. */
export type SessionMode = 'class' | 'quick'

/** User-facing session configuration. Total-time is derived (see `timing.ts`), not stored. */
export interface Settings {
  /** Class (auto-tapering durations) or Quick (uniform interval). */
  mode: SessionMode
  /** Number of poses = session length. Clamped to caps at plan time, not here. */
  poseCount: number
  /** Quick-mode uniform interval, seconds. Ignored in Class mode. */
  intervalSeconds: number
  /** Rest slide between poses, seconds; 0 disables rests. */
  restSeconds: number
  /** Shuffle poses, no within-session repeats. */
  randomize: boolean
}

/** Spec §5 defaults: Class mode, 10 poses, 60s interval, 10s rest, shuffle on. */
export const DEFAULT_SETTINGS: Settings = {
  mode: 'class',
  poseCount: MIN_POSES,
  intervalSeconds: DEFAULT_INTERVAL_SECONDS,
  restSeconds: DEFAULT_REST_SECONDS,
  randomize: true,
}

/** Serialize settings for persistence. */
export function serialize(settings: Settings): string {
  return JSON.stringify(settings)
}

/**
 * Parse persisted settings, filling any missing/invalid field from
 * {@link DEFAULT_SETTINGS}. Malformed JSON or a non-object yields the defaults.
 */
export function parse(raw: string | null): Settings {
  const rec = asRecord(tryJson(raw))
  return {
    mode: isMode(rec.mode) ? rec.mode : DEFAULT_SETTINGS.mode,
    poseCount: positiveInt(rec.poseCount) ?? DEFAULT_SETTINGS.poseCount,
    intervalSeconds: positiveInt(rec.intervalSeconds) ?? DEFAULT_SETTINGS.intervalSeconds,
    restSeconds: nonNegativeInt(rec.restSeconds) ?? DEFAULT_SETTINGS.restSeconds,
    randomize: typeof rec.randomize === 'boolean' ? rec.randomize : DEFAULT_SETTINGS.randomize,
  }
}

function tryJson(raw: string | null): unknown {
  if (raw == null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function isMode(value: unknown): value is SessionMode {
  return value === 'class' || value === 'quick'
}

function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : null
}

function nonNegativeInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null
}
