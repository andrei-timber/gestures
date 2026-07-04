/**
 * Google Drive Tier-1 read (`gestures-spec.md` §3, M1). A public "anyone with the
 * link" folder is listed with an **app-owned API key only** — no OAuth, no consent
 * screen, no CASA audit. The user pastes the folder's share URL; we parse the
 * folder id, **walk it and its subfolders**, keep the raster references, and hand
 * back displayable `{name, url}` records the rest of the app treats exactly like
 * the local-folder tier.
 *
 * Recursion mirrors the local drop-folder source (`dropped-files.ts` walks the
 * tree too), so a link to a categorised library (e.g. `Refs/…/poses`) gathers
 * every image regardless of nesting — sharing an "anyone with the link" folder
 * cascades read access to the whole subtree (decided 2026-07-04, extends spec §3's
 * original "flat folder v1").
 *
 * Split by the repo's "test the logic" line: link parsing, request-URL building,
 * display-URL shaping, and the file→image mapping are pure and node-tested;
 * {@link fetchDriveImages} is the one impure orchestrator (fetch + tree walk),
 * tested with an injected fetch.
 */

import { filterImages, type SourceImage } from './images'

/** A parsed Drive folder reference. `resourceKey` guards link-shared items (some folders require it). */
export interface DriveFolderRef {
  readonly folderId: string
  readonly resourceKey?: string
}

/** Minimal `files.list` row (the `fields` we request). */
export interface DriveFile {
  readonly id: string
  readonly name: string
  readonly mimeType: string
}

/** Why a Drive load failed, for a friendly UI message. See {@link DriveError}. */
export type DriveErrorKind =
  | 'bad-link' // couldn't extract a folder id from the input
  | 'not-found' // 404 — wrong id, or the folder isn't shared publicly
  | 'access' // 403 — folder not public, API key referrer-blocked, or Drive API off
  | 'rate-limit' // 429 / quota — shared app key is momentarily saturated
  | 'network' // fetch threw (offline, DNS, CORS)
  | 'unknown' // anything else

/** A Drive load failure carrying a {@link DriveErrorKind} and a user-facing message. */
export class DriveError extends Error {
  readonly kind: DriveErrorKind
  constructor(kind: DriveErrorKind, message: string) {
    super(message)
    this.name = 'DriveError'
    this.kind = kind
  }
}

/** Drive file/folder ids are URL-safe base64-ish; folder ids run well past 20 chars. */
const ID = /[A-Za-z0-9_-]+/
/** A bare-id paste must clear this length floor, so an ordinary word isn't mistaken for an id. */
const BARE_ID = /^[A-Za-z0-9_-]{20,}$/

/**
 * Extract a folder id (+ optional resource key) from whatever the user pasted:
 * a `/drive/folders/ID` share link (with or without `?usp=…` / `?resourcekey=…`),
 * an `open?id=ID` link, or a bare id. Returns `null` when nothing id-shaped is
 * present — the UI turns that into a `bad-link` message.
 */
export function parseFolderRef(input: string): DriveFolderRef | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  const folderId =
    trimmed.match(new RegExp(`/folders/(${ID.source})`))?.[1] ??
    trimmed.match(new RegExp(`[?&]id=(${ID.source})`))?.[1] ??
    (BARE_ID.test(trimmed) ? trimmed : null)
  if (folderId == null) return null

  const resourceKey = trimmed.match(/[?&]resourcekey=([^&\s]+)/i)?.[1]
  return resourceKey ? { folderId, resourceKey: decodeURIComponent(resourceKey) } : { folderId }
}

/** Drive REST v3 `files.list` endpoint. */
const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files'

/**
 * Build one `files.list` request URL. Lists non-trashed children of the folder,
 * 1000 per page (spec §3), asking only for the fields we map. `supportsAllDrives`
 * + `includeItemsFromAllDrives` let a Shared-Drive folder list too; `name_natural`
 * gives stable, human-numbered pagination (we still re-sort on display).
 */
export function buildListUrl(ref: DriveFolderRef, apiKey: string, pageToken?: string): string {
  const params = new URLSearchParams({
    q: `'${ref.folderId}' in parents and trashed=false`,
    key: apiKey,
    fields: 'nextPageToken,files(id,name,mimeType)',
    pageSize: '1000',
    orderBy: 'name_natural',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  })
  if (pageToken) params.set('pageToken', pageToken)
  return `${FILES_ENDPOINT}?${params.toString()}`
}

/** Default display width (px). Drive's thumbnail CDN serves up to ~1600 crisply. */
export const DISPLAY_WIDTH = 1600

/**
 * Displayable URL for a Drive file id. The `drive.google.com/thumbnail` endpoint
 * serves public files with no API key and no expiry (unlike the `thumbnailLink`
 * in the list response, which is short-lived) — settled in the M1/S1 spike.
 */
export function driveImageUrl(id: string, width = DISPLAY_WIDTH): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`
}

/** Keep the raster references (by extension, spec §3), sort naturally, map to display records. */
export function toSourceImages(files: readonly DriveFile[], width = DISPLAY_WIDTH): SourceImage[] {
  return filterImages(files).map((file) => ({ name: file.name, url: driveImageUrl(file.id, width) }))
}

/** A `fetch`-shaped function, injectable so the pagination loop is node-testable. */
export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<Response>

interface FetchOptions {
  readonly fetch?: FetchLike
  readonly width?: number
}

/** Google's marker mimeType for a folder — how we tell a subfolder from a file. */
const FOLDER_MIME = 'application/vnd.google-apps.folder'
/** Defensive ceiling on folders walked, in case a shortcut graph outruns the visited set. */
const MAX_FOLDERS = 1000

/**
 * Load a public Drive folder's images end-to-end: parse the link, **walk the folder
 * and every subfolder**, and map the survivors to displayable records. Throws
 * {@link DriveError} with a friendly message on any failure. `resourceKey` (when
 * present) rides the documented `X-Goog-Drive-Resource-Keys` header on every call.
 *
 * The walk is a breadth-first sweep with a visited-id set, so a self-referential
 * shortcut graph can't loop; the flat image list is name-sorted globally on the
 * way out (same as the local tier), which the session's spacing/shuffle then uses.
 */
export async function fetchDriveImages(
  link: string,
  apiKey: string,
  options: FetchOptions = {},
): Promise<SourceImage[]> {
  const doFetch = options.fetch ?? (globalThis.fetch as FetchLike)
  const ref = parseFolderRef(link)
  if (!ref) throw new DriveError('bad-link', "That doesn't look like a Drive folder link.")

  const headers = ref.resourceKey
    ? { 'X-Goog-Drive-Resource-Keys': `${ref.folderId}/${ref.resourceKey}` }
    : undefined

  const files: DriveFile[] = []
  const queue: string[] = [ref.folderId]
  const visited = new Set<string>(queue)
  while (queue.length > 0) {
    const folderId = queue.shift() as string
    for (const child of await listChildren(doFetch, folderId, apiKey, headers)) {
      if (child.mimeType === FOLDER_MIME) {
        if (!visited.has(child.id) && visited.size < MAX_FOLDERS) {
          visited.add(child.id)
          queue.push(child.id)
        }
      } else {
        files.push(child)
      }
    }
  }

  return toSourceImages(files, options.width)
}

interface ListResponse {
  files?: DriveFile[]
  nextPageToken?: string
  error?: { errors?: { reason?: string }[] }
}

/** Page through one folder's direct children (files + subfolders). Throws {@link DriveError} on a bad response. */
async function listChildren(
  doFetch: FetchLike,
  folderId: string,
  apiKey: string,
  headers: Record<string, string> | undefined,
): Promise<DriveFile[]> {
  const out: DriveFile[] = []
  let pageToken: string | undefined
  do {
    const res = await runFetch(doFetch, buildListUrl({ folderId }, apiKey, pageToken), headers)
    const body = (await res.json().catch(() => null)) as ListResponse | null
    if (!res.ok) throw errorForStatus(res.status, body)
    for (const f of body?.files ?? []) out.push(f)
    pageToken = body?.nextPageToken
  } while (pageToken)
  return out
}

async function runFetch(
  doFetch: FetchLike,
  url: string,
  headers: Record<string, string> | undefined,
): Promise<Response> {
  try {
    return await doFetch(url, headers ? { headers } : undefined)
  } catch {
    throw new DriveError('network', 'Network error reaching Google Drive. Check your connection.')
  }
}

/** Map a non-OK `files.list` status (+ any error reason) to a {@link DriveError}. */
function errorForStatus(status: number, body: ListResponse | null): DriveError {
  const reason = body?.error?.errors?.[0]?.reason
  if (status === 429 || reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
    return new DriveError('rate-limit', 'Google Drive is busy right now — try again in a moment.')
  }
  if (status === 404) {
    return new DriveError(
      'not-found',
      "Couldn't find that folder. Check the link, and that it's shared as “anyone with the link.”",
    )
  }
  if (status === 401 || status === 403) {
    return new DriveError(
      'access',
      "Couldn't access that folder. Make sure it's shared as “anyone with the link.”",
    )
  }
  return new DriveError('unknown', `Google Drive returned an error (${status}). Please try again.`)
}
