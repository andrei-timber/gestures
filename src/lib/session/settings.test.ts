import { describe, expect, it } from 'vitest'
import { MIN_POSES } from './limits'
import { DEFAULT_INTERVAL_SECONDS } from './quick'
import { DEFAULT_REST_SECONDS } from './timing'
import {
  DEFAULT_SETTINGS,
  MAX_INTERVAL_SECONDS,
  MIN_INTERVAL_SECONDS,
  clampIntervalSeconds,
  clampPoseCount,
  clampRestSeconds,
  parse,
  serialize,
  type Settings,
} from './settings'

describe('DEFAULT_SETTINGS', () => {
  it('matches the spec §5 shared-param defaults', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      mode: 'class',
      poseCount: MIN_POSES,
      intervalSeconds: DEFAULT_INTERVAL_SECONDS,
      restSeconds: DEFAULT_REST_SECONDS,
      randomize: true,
      theme: 'candlelit',
      driveLink: '',
    })
  })
})

describe('serialize / parse round-trip', () => {
  it('is identity for the defaults', () => {
    expect(parse(serialize(DEFAULT_SETTINGS))).toEqual(DEFAULT_SETTINGS)
  })

  it('is identity for a fully custom config', () => {
    const custom: Settings = {
      mode: 'quick',
      poseCount: 24,
      intervalSeconds: 120,
      restSeconds: 0,
      randomize: false,
      theme: 'sanguine',
      driveLink: 'https://drive.google.com/drive/folders/abc',
    }
    expect(parse(serialize(custom))).toEqual(custom)
  })
})

describe('parse fallbacks', () => {
  it('falls back to all defaults for null, garbage, or a non-object', () => {
    expect(parse(null)).toEqual(DEFAULT_SETTINGS)
    expect(parse('not json {')).toEqual(DEFAULT_SETTINGS)
    expect(parse('42')).toEqual(DEFAULT_SETTINGS)
    expect(parse('"a string"')).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid fields and defaults the invalid ones independently', () => {
    const raw = JSON.stringify({
      mode: 'quick',
      poseCount: 'twelve', // invalid → default
      restSeconds: 5, // valid
      randomize: 'yes', // invalid → default
    })
    expect(parse(raw)).toEqual({
      ...DEFAULT_SETTINGS,
      mode: 'quick',
      restSeconds: 5,
    })
  })

  it('rejects an unknown mode and floors fractional counts', () => {
    expect(parse(JSON.stringify({ mode: 'freeform' })).mode).toBe('class')
    expect(parse(JSON.stringify({ poseCount: 15.9 })).poseCount).toBe(15)
  })

  it('keeps a known theme and defaults an unknown or non-string one', () => {
    expect(parse(JSON.stringify({ theme: 'moonlit' })).theme).toBe('moonlit')
    expect(parse(JSON.stringify({ theme: 'sanguine' })).theme).toBe('sanguine')
    expect(parse(JSON.stringify({ theme: 'neon' })).theme).toBe('candlelit')
    expect(parse(JSON.stringify({ theme: 42 })).theme).toBe('candlelit')
  })

  it('keeps a string driveLink and defaults a non-string one', () => {
    expect(parse(JSON.stringify({ driveLink: 'https://x/folders/a' })).driveLink).toBe('https://x/folders/a')
    expect(parse(JSON.stringify({ driveLink: 42 })).driveLink).toBe('')
  })

  it('rejects non-positive counts but accepts a zero rest (rests disabled)', () => {
    expect(parse(JSON.stringify({ poseCount: 0 })).poseCount).toBe(MIN_POSES)
    expect(parse(JSON.stringify({ poseCount: -3 })).poseCount).toBe(MIN_POSES)
    expect(parse(JSON.stringify({ restSeconds: 0 })).restSeconds).toBe(0)
    expect(parse(JSON.stringify({ restSeconds: -1 })).restSeconds).toBe(DEFAULT_REST_SECONDS)
  })

  it('ignores unknown keys', () => {
    expect(parse(JSON.stringify({ ...DEFAULT_SETTINGS, bogus: 1 }))).toEqual(DEFAULT_SETTINGS)
  })
})

describe('live-edit clamps (setup blur handlers)', () => {
  it('snaps a cleared pose count (NaN) or a below-floor value to MIN_POSES', () => {
    expect(clampPoseCount(NaN)).toBe(MIN_POSES)
    expect(clampPoseCount(3)).toBe(MIN_POSES)
    expect(clampPoseCount(MIN_POSES)).toBe(MIN_POSES)
    expect(clampPoseCount(24)).toBe(24)
    expect(clampPoseCount(24.9)).toBe(24) // floors fractional
  })

  it('snaps a cleared rest (NaN) or negative to 0, keeps a valid rest', () => {
    expect(clampRestSeconds(NaN)).toBe(0)
    expect(clampRestSeconds(-1)).toBe(0)
    expect(clampRestSeconds(0)).toBe(0)
    expect(clampRestSeconds(12.7)).toBe(12)
  })

  it('snaps a cleared/zero custom interval to the floor, keeps a valid one', () => {
    expect(clampIntervalSeconds(NaN)).toBe(MIN_INTERVAL_SECONDS)
    expect(clampIntervalSeconds(0)).toBe(MIN_INTERVAL_SECONDS) // empty input → 0s
    expect(clampIntervalSeconds(10)).toBe(MIN_INTERVAL_SECONDS)
    expect(clampIntervalSeconds(MIN_INTERVAL_SECONDS)).toBe(MIN_INTERVAL_SECONDS)
    expect(clampIntervalSeconds(180)).toBe(180)
  })

  it('snaps an over-90-min custom interval down to the ceiling', () => {
    expect(clampIntervalSeconds(MAX_INTERVAL_SECONDS)).toBe(MAX_INTERVAL_SECONDS)
    expect(clampIntervalSeconds(MAX_INTERVAL_SECONDS + 600)).toBe(MAX_INTERVAL_SECONDS) // 100 min → 90
    expect(clampIntervalSeconds(7200)).toBe(MAX_INTERVAL_SECONDS) // 120 min → 90
  })
})
