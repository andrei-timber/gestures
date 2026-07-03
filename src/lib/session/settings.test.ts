import { describe, expect, it } from 'vitest'
import { MIN_POSES } from './caps'
import { DEFAULT_INTERVAL_SECONDS } from './quick'
import { DEFAULT_REST_SECONDS } from './timing'
import { DEFAULT_SETTINGS, parse, serialize, type Settings } from './settings'

describe('DEFAULT_SETTINGS', () => {
  it('matches the spec §5 shared-param defaults', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      mode: 'class',
      poseCount: MIN_POSES,
      intervalSeconds: DEFAULT_INTERVAL_SECONDS,
      restSeconds: DEFAULT_REST_SECONDS,
      randomize: true,
      rememberLast: true,
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
      rememberLast: false,
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
