/**
 * Mode → pose plan (`gestures-spec.md` §5). The single place that turns the
 * chosen settings into a per-pose duration array: Class taps the auto-tapering
 * distribution (health-capped), Quick the uniform interval. Both the setup
 * total-time FYI and the session start build their plan through here.
 */

import { classPlan } from './caps'
import { quickPlan } from './quick'
import type { Settings } from './settings'

/**
 * Per-pose durations (seconds) for the given settings; count clamped to caps.
 * `poolSize` (the folder's image count) is a hard ceiling on the pose count so
 * a run never asks for more images than exist. Class mode requires ≥10 images
 * (its `MIN_POSES` floor) and the setup UI blocks it below that, so only Quick
 * ever runs a pool-limited count under the minimum.
 */
export function buildPlan(
  settings: Pick<Settings, 'mode' | 'poseCount' | 'intervalSeconds'>,
  poolSize = Infinity,
): number[] {
  return settings.mode === 'class'
    ? classPlan(Math.min(settings.poseCount, poolSize))
    : quickPlan(settings.poseCount, settings.intervalSeconds, poolSize)
}
