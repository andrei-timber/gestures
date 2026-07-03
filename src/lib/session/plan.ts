/**
 * Mode → pose plan (`gestures-spec.md` §5). The single place that turns the
 * chosen settings into a per-pose duration array: Class taps the auto-tapering
 * distribution (health-capped), Quick the uniform interval. Both the setup
 * total-time FYI and the session start build their plan through here.
 */

import { classPlan } from './caps'
import { quickPlan } from './quick'
import type { Settings } from './settings'

/** Per-pose durations (seconds) for the given settings; count clamped to caps. */
export function buildPlan(settings: Pick<Settings, 'mode' | 'poseCount' | 'intervalSeconds'>): number[] {
  return settings.mode === 'class'
    ? classPlan(settings.poseCount)
    : quickPlan(settings.poseCount, settings.intervalSeconds)
}
