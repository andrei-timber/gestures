/**
 * Session timing (`gestures-spec.md` §5). Total time is a *function* of the
 * settings, surfaced as a live FYI during setup — never a thing the user sets
 * directly. It is the active drawing time plus the optional rests between poses.
 */

/** Default rest slide between poses (spec §5 shared params); 0 disables rests. */
export const DEFAULT_REST_SECONDS = 10

export interface SessionTiming {
  /** Summed pose durations — the "drawing time" figure. */
  active: number
  /** Summed rest slides; there are `poseCount - 1` of them, between poses. */
  rests: number
  /** active + rests — the headline total-time FYI. */
  total: number
}

/**
 * Break a per-pose duration plan into its active / rest / total seconds.
 * Rests fall *between* poses, so a plan of N poses has N-1 rests and none
 * trails the final pose.
 */
export function sessionTiming(
  perPoseSeconds: number[],
  restSeconds: number = DEFAULT_REST_SECONDS,
): SessionTiming {
  const active = perPoseSeconds.reduce((a, b) => a + b, 0)
  const rests = Math.max(0, perPoseSeconds.length - 1) * restSeconds
  return { active, rests, total: active + rests }
}

/** Convenience: just the total-time FYI in seconds. */
export function totalSeconds(
  perPoseSeconds: number[],
  restSeconds: number = DEFAULT_REST_SECONDS,
): number {
  return sessionTiming(perPoseSeconds, restSeconds).total
}
