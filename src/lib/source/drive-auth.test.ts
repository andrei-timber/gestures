import { describe, expect, it } from 'vitest'
import { DriveAuthError, isTokenFresh, tokenFromResponse, type CachedToken } from './drive-auth'

describe('isTokenFresh', () => {
  const token: CachedToken = { accessToken: 'ya29.abc', expiresAt: 1000 }

  it('is fresh strictly before the expiry instant', () => {
    expect(isTokenFresh(token, 999)).toBe(true)
  })

  it('is stale at and after the expiry instant', () => {
    expect(isTokenFresh(token, 1000)).toBe(false)
    expect(isTokenFresh(token, 1001)).toBe(false)
  })

  it('treats a null cache as stale', () => {
    expect(isTokenFresh(null, 0)).toBe(false)
  })
})

describe('tokenFromResponse', () => {
  it('computes expiresAt as now + ttl − 60s skew', () => {
    // ttl 3600s from now=10_000 → 10_000 + 3_600_000 − 60_000 = 3_550_000
    expect(tokenFromResponse({ access_token: 'ya29.x', expires_in: 3600 }, 10_000)).toEqual({
      accessToken: 'ya29.x',
      expiresAt: 3_550_000,
    })
  })

  it('throws on an error response', () => {
    expect(() => tokenFromResponse({ error: 'access_denied' }, 0)).toThrow(DriveAuthError)
  })

  it('throws when the access token is missing', () => {
    expect(() => tokenFromResponse({ expires_in: 3600 }, 0)).toThrow(DriveAuthError)
  })

  it('throws when expires_in is missing', () => {
    expect(() => tokenFromResponse({ access_token: 'ya29.x' }, 0)).toThrow(DriveAuthError)
  })
})
