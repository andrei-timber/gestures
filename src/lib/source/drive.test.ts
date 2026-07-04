import { describe, expect, it, vi } from 'vitest'
import {
  DriveError,
  buildListUrl,
  driveImageUrl,
  fetchDriveImages,
  parseFolderRef,
  toSourceImages,
  type DriveFile,
  type FetchLike,
} from './drive'

const FOLDER_ID = '12BH-GbwIUaXIWxUFH_16cljQuLt9U9Sm'

describe('parseFolderRef', () => {
  it('extracts the id from a share link with query params', () => {
    expect(parseFolderRef(`https://drive.google.com/drive/folders/${FOLDER_ID}?usp=drive_link`)).toEqual({
      folderId: FOLDER_ID,
    })
  })

  it('handles the /u/0/ account-scoped variant', () => {
    expect(parseFolderRef(`https://drive.google.com/drive/u/0/folders/${FOLDER_ID}`)).toEqual({
      folderId: FOLDER_ID,
    })
  })

  it('handles the open?id= form', () => {
    expect(parseFolderRef(`https://drive.google.com/open?id=${FOLDER_ID}`)).toEqual({
      folderId: FOLDER_ID,
    })
  })

  it('accepts a bare id and trims whitespace', () => {
    expect(parseFolderRef(`  ${FOLDER_ID}  `)).toEqual({ folderId: FOLDER_ID })
  })

  it('captures and decodes a resourcekey', () => {
    expect(
      parseFolderRef(`https://drive.google.com/drive/folders/${FOLDER_ID}?resourcekey=0-abc%2Fdef`),
    ).toEqual({ folderId: FOLDER_ID, resourceKey: '0-abc/def' })
  })

  it('returns null for non-folder input', () => {
    expect(parseFolderRef('')).toBeNull()
    expect(parseFolderRef('not a link')).toBeNull()
    expect(parseFolderRef('https://example.com/')).toBeNull()
  })
})

describe('buildListUrl', () => {
  it('queries the folder children with the key, fields, and Shared-Drive flags', () => {
    const url = new URL(buildListUrl({ folderId: FOLDER_ID }, 'KEY'))
    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/drive/v3/files')
    expect(url.searchParams.get('q')).toBe(`'${FOLDER_ID}' in parents and trashed=false`)
    expect(url.searchParams.get('key')).toBe('KEY')
    expect(url.searchParams.get('pageSize')).toBe('1000')
    expect(url.searchParams.get('includeItemsFromAllDrives')).toBe('true')
    expect(url.searchParams.get('pageToken')).toBeNull()
  })

  it('adds the page token when paginating', () => {
    const url = new URL(buildListUrl({ folderId: FOLDER_ID }, 'KEY', 'TOK'))
    expect(url.searchParams.get('pageToken')).toBe('TOK')
  })
})

describe('driveImageUrl / toSourceImages', () => {
  it('builds a keyless thumbnail URL at the requested width', () => {
    expect(driveImageUrl('abc', 800)).toBe('https://drive.google.com/thumbnail?id=abc&sz=w800')
  })

  it('keeps only raster references, natural-sorted, mapped to display URLs', () => {
    const files: DriveFile[] = [
      { id: 'i10', name: 'pose10.jpg', mimeType: 'image/jpeg' },
      { id: 'i2', name: 'pose2.jpg', mimeType: 'image/jpeg' },
      { id: 'doc', name: 'notes.txt', mimeType: 'text/plain' },
      { id: 'p', name: 'sketch.PNG', mimeType: 'image/png' },
    ]
    expect(toSourceImages(files)).toEqual([
      { name: 'pose2.jpg', url: driveImageUrl('i2') },
      { name: 'pose10.jpg', url: driveImageUrl('i10') },
      { name: 'sketch.PNG', url: driveImageUrl('p') },
    ])
  })
})

/** A `Response`-ish stub carrying a status and JSON body. */
function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: () => Promise.resolve(body) } as unknown as Response
}

describe('fetchDriveImages', () => {
  it('rejects an unparseable link before any fetch', async () => {
    const fetch = vi.fn()
    await expect(fetchDriveImages('nope', 'KEY', { fetch })).rejects.toMatchObject({ kind: 'bad-link' })
    expect(fetch).not.toHaveBeenCalled()
  })

  const FOLDER_MIME = 'application/vnd.google-apps.folder'
  const folder = (id: string, name: string): DriveFile => ({ id, name, mimeType: FOLDER_MIME })
  const img = (id: string, name: string): DriveFile => ({ id, name, mimeType: 'image/jpeg' })

  it('recurses into subfolders and gathers every image, name-sorted', async () => {
    // The q param is URL-encoded (`'`→`%27`), so match on the bare folder id.
    const fetch = vi.fn((url: string) => {
      if (url.includes(FOLDER_ID)) {
        return Promise.resolve(jsonResponse({ files: [folder('subxyz', 'Sub'), img('r', 'root.jpg')] }))
      }
      if (url.includes('subxyz')) {
        return Promise.resolve(jsonResponse({ files: [img('a', 'a.jpg'), img('b', 'b.jpg')] }))
      }
      return Promise.resolve(jsonResponse({ files: [] }))
    })
    const images = await fetchDriveImages(FOLDER_ID, 'KEY', { fetch })
    expect(images.map((i) => i.name)).toEqual(['a.jpg', 'b.jpg', 'root.jpg'])
  })

  it('does not loop on a self-referential folder graph', async () => {
    const fetch = vi.fn((url: string) => {
      if (url.includes(FOLDER_ID)) {
        return Promise.resolve(jsonResponse({ files: [folder('subxyz', 'Sub')] }))
      }
      // 'subxyz' points back at the already-visited root — must not re-list it.
      return Promise.resolve(jsonResponse({ files: [folder(FOLDER_ID, 'Refs'), img('a', 'a.jpg')] }))
    })
    const images = await fetchDriveImages(FOLDER_ID, 'KEY', { fetch })
    expect(images.map((i) => i.name)).toEqual(['a.jpg'])
    expect(fetch).toHaveBeenCalledTimes(2) // root + sub, root never re-fetched
  })

  it('skips an unreadable subfolder but keeps the readable tree', async () => {
    const fetch = vi.fn((url: string) => {
      if (url.includes(FOLDER_ID)) {
        return Promise.resolve(jsonResponse({ files: [folder('locked', 'Locked'), img('r', 'root.jpg')] }))
      }
      if (url.includes('locked')) return Promise.resolve(jsonResponse({}, false, 403)) // per-item share override
      return Promise.resolve(jsonResponse({ files: [] }))
    })
    const images = await fetchDriveImages(FOLDER_ID, 'KEY', { fetch })
    expect(images.map((i) => i.name)).toEqual(['root.jpg'])
  })

  it('still aborts when a subfolder fails transiently (network)', async () => {
    const fetch = vi.fn((url: string) => {
      if (url.includes(FOLDER_ID)) {
        return Promise.resolve(jsonResponse({ files: [folder('sub', 'Sub'), img('r', 'root.jpg')] }))
      }
      return Promise.reject(new Error('offline'))
    })
    await expect(fetchDriveImages(FOLDER_ID, 'KEY', { fetch })).rejects.toMatchObject({ kind: 'network' })
  })

  it('follows nextPageToken and concatenates every page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'a', name: 'a.jpg', mimeType: 'image/jpeg' }], nextPageToken: 'p2' }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ files: [{ id: 'b', name: 'b.jpg', mimeType: 'image/jpeg' }] }),
      )
    const images = await fetchDriveImages(FOLDER_ID, 'KEY', { fetch })
    expect(images.map((i) => i.name)).toEqual(['a.jpg', 'b.jpg'])
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[1][0]).toContain('pageToken=p2')
  })

  it('sends the resource-key header when present', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(jsonResponse({ files: [] }))
    await fetchDriveImages(`https://drive.google.com/drive/folders/${FOLDER_ID}?resourcekey=0-xyz`, 'KEY', {
      fetch,
    })
    expect(fetch.mock.calls[0][1]?.headers).toEqual({
      'X-Goog-Drive-Resource-Keys': `${FOLDER_ID}/0-xyz`,
    })
  })

  it('carries a subfolder’s own resource key into its listing', async () => {
    const fetch = vi.fn<FetchLike>((url) => {
      if (url.includes(FOLDER_ID)) {
        // The root's listing reveals a subfolder that needs its own key.
        return Promise.resolve(
          jsonResponse({ files: [{ id: 'sub', name: 'Sub', mimeType: FOLDER_MIME, resourceKey: '1-sub' }] }),
        )
      }
      return Promise.resolve(jsonResponse({ files: [img('a', 'a.jpg')] }))
    })
    await fetchDriveImages(`https://drive.google.com/drive/folders/${FOLDER_ID}?resourcekey=0-root`, 'KEY', {
      fetch,
    })
    // Root call: just the root key. Subfolder call: both mappings, so Drive can resolve 'sub'.
    expect(fetch.mock.calls[0][1]?.headers).toEqual({ 'X-Goog-Drive-Resource-Keys': `${FOLDER_ID}/0-root` })
    expect(fetch.mock.calls[1][1]?.headers).toEqual({
      'X-Goog-Drive-Resource-Keys': `${FOLDER_ID}/0-root,sub/1-sub`,
    })
  })

  it('maps 404 to a not-found DriveError mentioning sharing', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(jsonResponse({}, false, 404))
    await expect(fetchDriveImages(FOLDER_ID, 'KEY', { fetch })).rejects.toMatchObject({
      kind: 'not-found',
    })
  })

  it('maps 403 to an access DriveError', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(jsonResponse({}, false, 403))
    await expect(fetchDriveImages(FOLDER_ID, 'KEY', { fetch })).rejects.toMatchObject({ kind: 'access' })
  })

  it('maps a rate-limit reason even under a 403', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { errors: [{ reason: 'rateLimitExceeded' }] } }, false, 403))
    await expect(fetchDriveImages(FOLDER_ID, 'KEY', { fetch })).rejects.toMatchObject({
      kind: 'rate-limit',
    })
  })

  it('wraps a thrown fetch as a network DriveError', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('offline'))
    const err = await fetchDriveImages(FOLDER_ID, 'KEY', { fetch }).catch((e) => e)
    expect(err).toBeInstanceOf(DriveError)
    expect(err.kind).toBe('network')
  })
})
