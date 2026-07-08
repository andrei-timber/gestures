import { describe, expect, it, vi } from 'vitest'
import {
  DriveWriteError,
  buildFolderSearchUrl,
  copyReferenceImages,
  createFolder,
  ensureSessionFolder,
  escapeQueryValue,
  extensionOf,
  findFolder,
  findOrCreateFolder,
  folderSearchQuery,
  refImageName,
  sessionFolderName,
  uploadFile,
  writeTextFile,
  type WriteFetch,
} from './drive-write'
import type { SourceImage } from './images'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: () => Promise.resolve(body) } as unknown as Response
}

/** A byte-read response for the copy path: carries ok/status and a blob. */
function blobResponse(ok = true, status = 200): Response {
  return { ok, status, blob: () => Promise.resolve(new Blob(['bytes'])) } as unknown as Response
}

describe('escapeQueryValue', () => {
  it('escapes single quotes and backslashes', () => {
    expect(escapeQueryValue("a'b")).toBe("a\\'b")
    expect(escapeQueryValue('a\\b')).toBe('a\\\\b')
  })
})

describe('folderSearchQuery / buildFolderSearchUrl', () => {
  it('builds a name+parent+folder+non-trashed query', () => {
    expect(folderSearchQuery('Gestures Sessions', 'root')).toBe(
      "mimeType='application/vnd.google-apps.folder' and name='Gestures Sessions' and 'root' in parents and trashed=false",
    )
  })

  it('escapes an apostrophe in the folder name so the query stays well-formed', () => {
    expect(folderSearchQuery("Noah's", 'root')).toContain("name='Noah\\'s'")
  })

  it('encodes the query into a files.list URL with the fields we read', () => {
    const url = buildFolderSearchUrl('Gestures Sessions', 'root')
    expect(url.startsWith('https://www.googleapis.com/drive/v3/files?')).toBe(true)
    expect(url).toContain('fields=files%28id%2Cname%29')
    // URLSearchParams encodes spaces as '+'; normalise before the readability check.
    expect(decodeURIComponent(url.replace(/\+/g, ' '))).toContain("name='Gestures Sessions'")
  })
})

describe('sessionFolderName', () => {
  it('formats a local date as YYYY-MM-DD, zero-padded', () => {
    expect(sessionFolderName(new Date(2026, 6, 8))).toBe('2026-07-08') // month is 0-based
    expect(sessionFolderName(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('findFolder', () => {
  it('returns the first matching folder id', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ files: [{ id: 'f1' }, { id: 'f2' }] }))
    expect(await findFolder('X', 'root', 'tok', fetch)).toBe('f1')
  })

  it('returns null when nothing matches', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ files: [] }))
    expect(await findFolder('X', 'root', 'tok', fetch)).toBeNull()
  })

  it('sends the bearer token', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ files: [] })) as unknown as WriteFetch
    await findFolder('X', 'root', 'tok', fetch)
    expect(vi.mocked(fetch).mock.calls[0][1].headers.Authorization).toBe('Bearer tok')
  })

  it('throws a friendly DriveWriteError on an API error', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'Rate limit' } }, false, 429))
    await expect(findFolder('X', 'root', 'tok', fetch)).rejects.toThrow(DriveWriteError)
    await expect(findFolder('X', 'root', 'tok', fetch)).rejects.toThrow('Rate limit')
  })
})

describe('createFolder', () => {
  it('POSTs folder metadata and returns the new id', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ id: 'new1' }))
    const id = await createFolder('2026-07-08', 'parentX', 'tok', fetch)
    expect(id).toBe('new1')
    const [, init] = fetch.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({
      name: '2026-07-08',
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['parentX'],
    })
  })

  it('throws when Drive returns no id', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({}))
    await expect(createFolder('X', 'root', 'tok', fetch)).rejects.toThrow(DriveWriteError)
  })
})

describe('findOrCreateFolder', () => {
  it('reuses an existing folder without creating', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ files: [{ id: 'exists' }] }))
    expect(await findOrCreateFolder('X', 'root', 'tok', fetch)).toBe('exists')
    expect(fetch).toHaveBeenCalledTimes(1) // search only, no create
  })

  it('creates when absent', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // search: none
      .mockResolvedValueOnce(jsonResponse({ id: 'made' })) // create
    expect(await findOrCreateFolder('X', 'root', 'tok', fetch)).toBe('made')
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe('ensureSessionFolder', () => {
  it('creates the root then the dated child, returning the dated id', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // find "Gestures Sessions"
      .mockResolvedValueOnce(jsonResponse({ id: 'rootId' })) // create it
      .mockResolvedValueOnce(jsonResponse({ files: [] })) // find dated folder under root
      .mockResolvedValueOnce(jsonResponse({ id: 'datedId' })) // create it
    const id = await ensureSessionFolder(new Date(2026, 6, 8), 'tok', fetch)
    expect(id).toBe('datedId')
    // The dated create is parented to the freshly-made root.
    expect(JSON.parse(fetch.mock.calls[3][1].body).parents).toEqual(['rootId'])
  })
})

describe('uploadFile / writeTextFile', () => {
  it('POSTs multipart to the upload endpoint and returns the id, with no manual Content-Type', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ id: 'file1' }))
    const id = await writeTextFile('notes.txt', 'datedId', 'hello', 'tok', fetch)
    expect(id).toBe('file1')
    const [url, init] = fetch.mock.calls[0]
    expect(url).toContain('/upload/drive/v3/files?uploadType=multipart')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect('Content-Type' in init.headers).toBe(false) // browser sets the multipart boundary
    expect(init.body).toBeInstanceOf(FormData)
  })

  it('surfaces an upload error as DriveWriteError', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'Quota' } }, false, 403))
    await expect(uploadFile('x', 'p', new Blob(['x']), 'tok', fetch)).rejects.toThrow('Quota')
  })
})

describe('extensionOf', () => {
  it('lowercases the real extension', () => {
    expect(extensionOf('pose2.JPG')).toBe('.jpg')
    expect(extensionOf('a.b.webp')).toBe('.webp')
  })

  it('defaults to .jpg for an unusable name (none / dotfile / trailing dot)', () => {
    expect(extensionOf('noext')).toBe('.jpg')
    expect(extensionOf('.gitignore')).toBe('.jpg')
    expect(extensionOf('trailing.')).toBe('.jpg')
  })
})

describe('refImageName', () => {
  it('zero-pads to the width of the total so a lexical listing stays in order', () => {
    expect(refImageName(1, 12, 'anything.png')).toBe('Ref_01.png')
    expect(refImageName(10, 12, 'x.jpg')).toBe('Ref_10.jpg')
  })

  it('does not pad when the total is single-digit', () => {
    expect(refImageName(3, 5, 'sketch.JPEG')).toBe('Ref_3.jpeg')
  })
})

describe('copyReferenceImages', () => {
  const img = (name: string, url: string): SourceImage => ({ name, url })

  it('copies every image in order as Ref_N.<ext>, reporting the full count', async () => {
    const fetchBytes = vi.fn().mockResolvedValue(blobResponse())
    const upload = vi.fn().mockResolvedValue('id')
    const images = [img('a.jpg', 'blob:a'), img('b.png', 'blob:b')]
    const result = await copyReferenceImages(images, 'dated', 'tok', { fetchBytes, upload })
    expect(result).toEqual({ uploaded: 2, total: 2 })
    // Named Ref_1/Ref_2 (single-digit total → no pad), parented to the dated folder, with the token.
    expect(upload.mock.calls.map((c) => c[0])).toEqual(['Ref_1.jpg', 'Ref_2.png'])
    expect(upload.mock.calls[0].slice(1)).toEqual(['dated', expect.any(Blob), 'tok'])
    expect(fetchBytes.mock.calls.map((c) => c[0])).toEqual(['blob:a', 'blob:b'])
  })

  it('skips a throttled image (non-ok byte read) but keeps the rest', async () => {
    const fetchBytes = vi
      .fn()
      .mockResolvedValueOnce(blobResponse(false, 429)) // first ref throttled
      .mockResolvedValueOnce(blobResponse())
    const upload = vi.fn().mockResolvedValue('id')
    const result = await copyReferenceImages([img('a.jpg', 'u1'), img('b.jpg', 'u2')], 'dated', 'tok', {
      fetchBytes,
      upload,
    })
    expect(result).toEqual({ uploaded: 1, total: 2 })
    // Only the second image uploaded — and it keeps its own index (Ref_2), not renumbered.
    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0][0]).toBe('Ref_2.jpg')
  })

  it('drops just the image whose fetch throws (CORS-opaque / blip)', async () => {
    const fetchBytes = vi
      .fn()
      .mockRejectedValueOnce(new Error('CORS'))
      .mockResolvedValueOnce(blobResponse())
    const upload = vi.fn().mockResolvedValue('id')
    const result = await copyReferenceImages([img('a.jpg', 'u1'), img('b.jpg', 'u2')], 'dated', 'tok', {
      fetchBytes,
      upload,
    })
    expect(result).toEqual({ uploaded: 1, total: 2 })
  })

  it('is a no-op for an empty run', async () => {
    const fetchBytes = vi.fn()
    const upload = vi.fn()
    expect(await copyReferenceImages([], 'dated', 'tok', { fetchBytes, upload })).toEqual({
      uploaded: 0,
      total: 0,
    })
    expect(fetchBytes).not.toHaveBeenCalled()
  })
})
