/**
 * Google Drive Tier-2 sign-in (`gestures-spec.md` §3/§7, M2 step a1). **Capture is
 * the only thing that logs in** — the core timer/slideshow stays fully anonymous.
 * When the user clicks Save we mint a short-lived `drive.file` access token via the
 * Google Identity Services (GIS) token model: no backend, no client secret, no
 * refresh token in the browser (spec §3). The token grants create/modify of files
 * **this app creates** and nothing else in the user's Drive — exactly what the
 * re-upload capture path needs.
 *
 * Split per the repo's "test the logic" line: the token freshness / expiry math
 * ({@link isTokenFresh}, {@link tokenFromResponse}) is pure and node-tested; the
 * GIS script-load + `requestAccessToken` glue is browser-only (guarded) and
 * owner-verified — Google's native consent popup can't be driven headlessly.
 */

/** The one OAuth scope we request: per-file, no folder cascade, CASA-exempt (spec §3). */
export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GIS_SRC = 'https://accounts.google.com/gsi/client'
/** Treat a token as expired this early so it can't lapse mid-upload. */
const EXPIRY_SKEW_MS = 60_000

/** A minted token plus the epoch-ms instant it should be considered expired (skew-adjusted). */
export interface CachedToken {
  readonly accessToken: string
  readonly expiresAt: number
}

/** The shape GIS hands back to the token callback (the fields we read). */
export interface TokenResponse {
  readonly access_token?: string
  readonly expires_in?: number
  readonly error?: string
}

/** Pure: is this cached token still safe to use at `now` (ms)? */
export function isTokenFresh(token: CachedToken | null, now: number): boolean {
  return token !== null && now < token.expiresAt
}

/**
 * Pure: fold a GIS token response into a cache entry, or throw {@link DriveAuthError}
 * when the user cancelled / consent failed. `expiresAt = now + ttl − skew`.
 */
export function tokenFromResponse(resp: TokenResponse, now: number): CachedToken {
  if (resp.error || !resp.access_token || typeof resp.expires_in !== 'number') {
    throw new DriveAuthError('Drive sign-in was cancelled or failed.')
  }
  return { accessToken: resp.access_token, expiresAt: now + resp.expires_in * 1000 - EXPIRY_SKEW_MS }
}

/** A sign-in failure with a message safe to show the user. */
export class DriveAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DriveAuthError'
  }
}

// --- GIS ambient surface (no @types package; we declare the sliver we call) ---
interface GisTokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void
}
interface GisOAuth2 {
  initTokenClient(config: {
    client_id: string
    scope: string
    callback: (resp: TokenResponse) => void
    error_callback?: (err: { type?: string }) => void
  }): GisTokenClient
}
declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GisOAuth2 } }
  }
}

/** Lazily inject the GIS client script exactly once; resolves when `window.google` is ready. */
let gisPromise: Promise<GisOAuth2> | null = null
function loadGis(): Promise<GisOAuth2> {
  if (gisPromise) return gisPromise
  gisPromise = new Promise<GisOAuth2>((resolve, reject) => {
    const existing = window.google?.accounts?.oauth2
    if (existing) return resolve(existing)
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = (): void => {
      const oauth2 = window.google?.accounts?.oauth2
      if (oauth2) resolve(oauth2)
      else reject(new DriveAuthError('Google sign-in failed to initialise.'))
    }
    script.onerror = (): void => {
      gisPromise = null // let a later attempt retry the load
      reject(new DriveAuthError('Couldn’t reach Google sign-in.'))
    }
    document.head.appendChild(script)
  })
  return gisPromise
}

/** Sign-in handle: hands back a valid `drive.file` token, minting one on demand. */
export interface DriveAuth {
  /**
   * Resolve a fresh `drive.file` access token — reusing the cached one while it
   * lasts, otherwise prompting via GIS. **Must be called from a user gesture** the
   * first time (Google requirement). Rejects with {@link DriveAuthError}.
   */
  getToken(): Promise<string>
  /** Drop the cached token (e.g. after a 401) so the next call re-mints. */
  reset(): void
}

/**
 * Build a {@link DriveAuth} for one OAuth client id. `now` is injectable so the
 * cache logic stays deterministic in tests. Concurrent {@link DriveAuth.getToken}
 * calls share one in-flight request (GIS allows a single pending prompt).
 */
export function createDriveAuth(clientId: string, now: () => number = Date.now): DriveAuth {
  let cached: CachedToken | null = null
  let client: GisTokenClient | null = null
  let inFlight: Promise<string> | null = null
  // The GIS callback fires out-of-band from requestAccessToken(), so we park the
  // current promise's settlers here for it to resolve.
  let settle: { resolve: (t: string) => void; reject: (e: unknown) => void } | null = null

  async function ensureClient(): Promise<GisTokenClient> {
    if (client) return client
    if (!clientId) throw new DriveAuthError('Drive sign-in isn’t configured in this build.')
    const oauth2 = await loadGis()
    client = oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (resp) => {
        const s = settle
        settle = null
        if (!s) return
        try {
          cached = tokenFromResponse(resp, now())
          s.resolve(cached.accessToken)
        } catch (err) {
          s.reject(err)
        }
      },
      // Fires when the popup can't even open (blocked / dismissed) — no callback then.
      error_callback: (err) => {
        const s = settle
        settle = null
        s?.reject(new DriveAuthError(err.type === 'popup_closed' ? 'Sign-in was closed.' : 'Drive sign-in failed.'))
      },
    })
    return client
  }

  async function mint(): Promise<string> {
    const c = await ensureClient()
    return new Promise<string>((resolve, reject) => {
      settle = { resolve, reject }
      // prompt:'' → silent when the user has already consented this browser; GIS
      // still shows the account-picker/consent on the first grant. One flow for both.
      c.requestAccessToken({ prompt: '' })
    })
  }

  return {
    async getToken(): Promise<string> {
      if (isTokenFresh(cached, now())) return cached!.accessToken
      // Coalesce overlapping callers onto the single pending GIS prompt.
      inFlight ??= mint().finally(() => {
        inFlight = null
      })
      return inFlight
    },
    reset(): void {
      cached = null
    },
  }
}
