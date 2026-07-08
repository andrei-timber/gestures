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
 * Resolve the dated session folder `Gestures Sessions/<YYYY-MM-DD>/` in the user's
 * own Drive, creating either level as needed. Returns the dated folder's id.
 */
export async function ensureSessionFolder(
  date: Date,
  token: string,
  fetchImpl?: WriteFetch,
): Promise<string> {
  const rootId = await findOrCreateFolder(SESSIONS_ROOT_NAME, 'root', token, fetchImpl)
  return findOrCreateFolder(sessionFolderName(date), rootId, token, fetchImpl)
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
