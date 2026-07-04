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

import { MIN_POSES } from './limits'
import { DEFAULT_INTERVAL_SECONDS } from './quick'
import { DEFAULT_REST_SECONDS } from './timing'

/** The two session modes (spec §5). Class is the default idea. */
export type SessionMode = 'class' | 'quick'

/**
 * Visual themes originated in the creative-direction pass
 * (`gestures-creative-direction.md`, spec §14). Each is a named token set in
 * `src/app.css` (canonical hex); this list is the pick order and the persisted
 * values. Candlelit is the first-run default.
 */
export const THEMES = ['candlelit', 'moonlit', 'sanguine'] as const
export type Theme = (typeof THEMES)[number]

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
  /** Visual theme (creative-direction pass). Applied as `data-theme` on the root. */
  theme: Theme
}

/** Spec §5 defaults: Class mode, 10 poses, 60s interval, 10s rest, shuffle on, Candlelit theme. */
export const DEFAULT_SETTINGS: Settings = {
  mode: 'class',
  poseCount: MIN_POSES,
  intervalSeconds: DEFAULT_INTERVAL_SECONDS,
  restSeconds: DEFAULT_REST_SECONDS,
  randomize: true,
  theme: 'candlelit',
}

/**
 * Live-edit clamps for the setup number inputs. A `type="number"` input yields
 * NaN when cleared; without these a transient empty field writes NaN into
 * settings and blanks the plan / total-time FYI until refilled. (`parse` heals
 * it on the next reload, but not during the session.) The setup screen routes
 * each input's blur through the matching clamp, snapping a cleared field to its
 * minimum — the same floor as the input's `min` attribute.
 */

/** Lowest custom Quick interval offered, seconds (0.5 min — the input's floor). */
export const MIN_INTERVAL_SECONDS = 30

/** Clamp a live-edited pose count: NaN or below the floor snaps to {@link MIN_POSES}. */
export function clampPoseCount(n: number): number {
  return Number.isFinite(n) && n >= MIN_POSES ? Math.floor(n) : MIN_POSES
}

/** Clamp a live-edited rest: NaN or negative snaps to 0 (rests disabled). */
export function clampRestSeconds(n: number): number {
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

/** Clamp a live-edited custom interval: NaN or below the floor snaps to {@link MIN_INTERVAL_SECONDS}. */
export function clampIntervalSeconds(secs: number): number {
  return Number.isFinite(secs) && secs >= MIN_INTERVAL_SECONDS
    ? Math.round(secs)
    : MIN_INTERVAL_SECONDS
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
    theme: isTheme(rec.theme) ? rec.theme : DEFAULT_SETTINGS.theme,
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

function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme)
}

function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : null
}

function nonNegativeInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null
}
