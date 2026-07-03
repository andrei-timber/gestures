/**
 * Shared session limits (`gestures-spec.md` §5 shared params). These bound both
 * modes, so they live here — free of the Class-specific distribution logic in
 * `caps.ts` — for `quick.ts`, `settings.ts`, `caps.ts`, and the setup UI to
 * consume without a cross-mode import.
 */

/** Both modes require at least this many poses (Class floors here; Quick clamps up to it). */
export const MIN_POSES = 10

/** Hard cap on summed pose durations, shared by both modes; rests are excluded. */
export const MAX_ACTIVE_SECONDS = 90 * 60
