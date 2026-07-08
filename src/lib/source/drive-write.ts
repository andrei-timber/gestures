/**
 * Google Drive Tier-2 write helpers (`gestures-spec.md` §3/§7, M2 slice a). The
 * capture destination is the user's **own** Drive, decoupled from the reference
 * source (which may be a public folder someone else shared, unwritable under
 * `drive.file`): find-or-create `Gestures Sessions/` in My-Drive root, then a
 * dated subfolder beneath it. All authorized by the {@link DriveAuth} token — the
 * scope covers files this app creates, which is every folder/file here.
 *
 * Split per the repo's "test the logic" line: query/URL building and the date
 * folder name are pure and node-tested; the fetch orchestrators are tested with an
 * injected `fetch` (mirroring `drive.ts`).
 */

import type { SourceImage } from './images'

/** Google's marker mimeType for a folder (same constant as the read side). */
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
/** The canonical name of the app-created capture root, in the user's My Drive. */
export const SESSIONS_ROOT_NAME = 'Gestures Sessions'

/** A write-shaped `fetch` (method + headers + body), injectable so orchestrators are node-testable. */
export type WriteFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: BodyInit },
) => Promise<Response>

/** A capture write failure with a message safe to show the user. */
export class DriveWriteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DriveWriteError'
  }
}

/** Escape a value for a Drive `q` string literal (single-quote and backslash). */
export function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** Pure: the `files.list` `q` that finds a live (non-trashed) child folder by exact name. */
export function folderSearchQuery(name: string, parentId: string): string {
  return [
    `mimeType='${FOLDER_MIME}'`,
    `name='${escapeQueryValue(name)}'`,
    `'${escapeQueryValue(parentId)}' in parents`,
    'trashed=false',
  ].join(' and ')
}

/** Pure: the full `files.list` URL for {@link folderSearchQuery}. */
export function buildFolderSearchUrl(name: string, parentId: string): string {
  const params = new URLSearchParams({
    q: folderSearchQuery(name, parentId),
    fields: 'files(id,name)',
    spaces: 'drive',
  })
  return `${FILES_URL}?${params.toString()}`
}

/** Pure: a `YYYY-MM-DD` folder name from a date, in the viewer's local time. */
export function sessionFolderName(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const authHeaders = (token: string): Record<string, string> => ({ Authorization: `Bearer ${token}` })

async function readError(res: Response, fallback: string): Promise<never> {
  // Drive returns { error: { message } }; fall back to the status when it doesn't.
  let detail = ''
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    detail = body.error?.message ?? ''
  } catch {
    /* non-JSON body — use the fallback */
  }
  throw new DriveWriteError(detail || `${fallback} (HTTP ${res.status}).`)
}

/**
 * Find a child folder by exact name under `parentId`, or `null` if none. Under
 * `drive.file` this only ever sees folders **this app created**, which is exactly
 * what we want for idempotent find-or-create.
 */
export async function findFolder(
  name: string,
  parentId: string,
  token: string,
  fetchImpl: WriteFetch = globalThis.fetch as unknown as WriteFetch,
): Promise<string | null> {
  const res = await fetchImpl(buildFolderSearchUrl(name, parentId), {
    method: 'GET',
    headers: authHeaders(token),
  })
  if (!res.ok) await readError(res, 'Couldn’t search your Drive')
  const body = (await res.json()) as { files?: { id: string }[] }
  return body.files?.[0]?.id ?? null
}

/** Create a folder named `name` under `parentId` (use `'root'` for My Drive root). Returns its id. */
export async function createFolder(
  name: string,
  parentId: string,
  token: string,
  fetchImpl: WriteFetch = globalThis.fetch as unknown as WriteFetch,
): Promise<string> {
  const res = await fetchImpl(`${FILES_URL}?fields=id`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  })
  if (!res.ok) await readError(res, 'Couldn’t create the session folder')
  const body = (await res.json()) as { id?: string }
  if (!body.id) throw new DriveWriteError('Drive didn’t return a folder id.')
  return body.id
}

/** Find the named child folder under `parentId`, creating it if absent. Idempotent — no duplicates. */
export async function findOrCreateFolder(
  name: string,
  parentId: string,
  token: string,
  fetchImpl?: WriteFetch,
): Promise<string> {
  const existing = await findFolder(name, parentId, token, fetchImpl)
  return existing ?? createFolder(name, parentId, token, fetchImpl)
}

/**
 * Pure: the next un-taken dated folder name given the day's existing folder names.
 * The day's first session is the bare date; later ones get `<date>-2`, `<date>-3`,
 * … (filling any gap left by a deleted folder). Unrelated names are ignored.
 */
export function nextDatedFolderName(date: Date, existing: readonly string[]): string {
  const base = sessionFolderName(date)
  const taken = new Set(existing)
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/** Pure: the `files.list` URL for every live child *folder* of `parentId` (names only). */
export function buildChildFoldersUrl(parentId: string): string {
  const params = new URLSearchParams({
    q: [`mimeType='${FOLDER_MIME}'`, `'${escapeQueryValue(parentId)}' in parents`, 'trashed=false'].join(' and '),
    fields: 'files(name)',
    spaces: 'drive',
    pageSize: '1000',
  })
  return `${FILES_URL}?${params.toString()}`
}

/**
 * The names of every live child folder under `parentId` (one page — 1000 folders
 * is years of daily sessions). Used to pick the next free dated-folder name.
 */
export async function listChildFolderNames(
  parentId: string,
  token: string,
  fetchImpl: WriteFetch = globalThis.fetch as unknown as WriteFetch,
): Promise<string[]> {
  const res = await fetchImpl(buildChildFoldersUrl(parentId), { method: 'GET', headers: authHeaders(token) })
  if (!res.ok) await readError(res, 'Couldn’t search your Drive')
  const body = (await res.json()) as { files?: { name: string }[] }
  return (body.files ?? []).map((f) => f.name)
}

/**
 * Create a **fresh** dated session folder in the user's own Drive and return its
 * id. Each logged session gets its own folder — `Gestures Sessions/<date>` for the
 * day's first, then `<date>-2`, `<date>-3`, … — so running the app twice in a day
 * never merges two sessions. The caller caches the returned id so re-logging the
 * *same* session (e.g. a throttle retry) reuses this folder instead of minting `-2`.
 */
export async function createSessionFolder(
  date: Date,
  token: string,
  fetchImpl?: WriteFetch,
): Promise<string> {
  const rootId = await findOrCreateFolder(SESSIONS_ROOT_NAME, 'root', token, fetchImpl)
  const existing = await listChildFolderNames(rootId, token, fetchImpl)
  return createFolder(nextDatedFolderName(date, existing), rootId, token, fetchImpl)
}

/**
 * Upload `blob` as a new file `name` under `parentId`; returns the new file id.
 * Multipart form-data (the shape proven in the S2 spike) — the browser sets the
 * boundary, so we must **not** send a Content-Type header here.
 */
export async function uploadFile(
  name: string,
  parentId: string,
  blob: Blob,
  token: string,
  fetchImpl: WriteFetch = globalThis.fetch as unknown as WriteFetch,
): Promise<string> {
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ name, parents: [parentId] })], { type: 'application/json' }))
  form.append('file', blob)
  const res = await fetchImpl(`${UPLOAD_URL}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  })
  if (!res.ok) await readError(res, 'Couldn’t upload to Drive')
  const body = (await res.json()) as { id?: string }
  if (!body.id) throw new DriveWriteError('Drive didn’t return a file id.')
  return body.id
}

/** Convenience over {@link uploadFile}: write a UTF-8 text file (e.g. the session notes). */
export function writeTextFile(
  name: string,
  parentId: string,
  text: string,
  token: string,
  fetchImpl?: WriteFetch,
): Promise<string> {
  return uploadFile(name, parentId, new Blob([text], { type: 'text/plain' }), token, fetchImpl)
}

/** Pure: the lowercased extension (with dot) of a filename, defaulting to `.jpg`. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  // No dot, a leading dot (dotfile), or a trailing dot → no usable extension.
  return dot > 0 && dot < name.length - 1 ? name.slice(dot).toLowerCase() : '.jpg'
}

/**
 * Pure: the Drive filename for the `index`-th (1-based) session reference —
 * `Ref_<n>.<ext>`, zero-padded to the width of `total` so a plain lexical folder
 * listing stays in pose order (`Ref_01` before `Ref_10`). a3 names the matching
 * drawings on the same scheme so a reference and its drawing sort together.
 */
export function refImageName(index: number, total: number, originalName: string): string {
  const width = String(total).length
  return `Ref_${String(index).padStart(width, '0')}${extensionOf(originalName)}`
}

/** The outcome of a {@link copyReferenceImages} run — how many of the run's refs landed. */
export interface CopyResult {
  readonly uploaded: number
  readonly total: number
}

/** How many references copy at once by default — bounded to stay under Drive's per-IP rate limit. */
export const COPY_CONCURRENCY = 5

/** Injectable deps for {@link copyReferenceImages} — so the orchestrator is node-testable. */
export interface CopyDeps {
  /** Reads an image's displayable URL back as bytes (CORS-readable: `blob:` or lh3). */
  readonly fetchBytes?: (url: string) => Promise<Response>
  /** Uploads one blob; defaults to {@link uploadFile}. */
  readonly upload?: (name: string, parentId: string, blob: Blob, token: string) => Promise<string>
  /** Max simultaneous copies (default {@link COPY_CONCURRENCY}); pass 1 for a strict order. */
  readonly concurrency?: number
}

/**
 * Copy the run's ordered references into `parentId` as `Ref_1…N`, fetching each
 * image's bytes from its own displayable URL (`blob:` for local picks, the
 * CORS-readable lh3 CDN for Drive — see {@link driveImageUrl}) and re-uploading
 * via multipart. Runs a **bounded pool** of `concurrency` copies at once (much
 * faster than one-at-a-time, still gentle on Drive's rate limit). **Best-effort**:
 * one image failing (a transient throttle, a CORS-opaque URL) is skipped rather
 * than aborting the rest, and each ref keeps its own index regardless of the order
 * the pool finishes in. Returns how many of `total` landed, so the caller can
 * report a partial copy honestly.
 */
export async function copyReferenceImages(
  images: readonly SourceImage[],
  parentId: string,
  token: string,
  deps: CopyDeps = {},
): Promise<CopyResult> {
  const fetchBytes = deps.fetchBytes ?? ((url: string) => globalThis.fetch(url))
  const upload = deps.upload ?? ((name, pId, blob, tok) => uploadFile(name, pId, blob, tok))
  const total = images.length
  let uploaded = 0
  let cursor = 0

  // Each worker pulls the next index until the run is exhausted; a shared cursor
  // keeps the naming tied to position (Ref_<i+1>), never to completion order.
  async function worker(): Promise<void> {
    while (cursor < total) {
      const i = cursor++
      const image = images[i]
      try {
        const res = await fetchBytes(image.url)
        if (!res.ok) continue // transient throttle (429/503) — skip, keep the rest
        const blob = await res.blob()
        await upload(refImageName(i + 1, total, image.name), parentId, blob, token)
        uploaded++
      } catch {
        // A CORS-opaque URL or a mid-copy network blip drops just this one image.
      }
    }
  }

  const width = Math.max(1, Math.min(deps.concurrency ?? COPY_CONCURRENCY, total))
  await Promise.all(Array.from({ length: width }, worker))
  return { uploaded, total }
}
