/**
 * Folder drag-and-drop → flat `File[]` (`docs/folder-picker-permission-2026-07-04.md`).
 * Dropping a folder reads its whole tree with no permission prompt — the drag
 * gesture is the grant — via the legacy Entry API (`webkitGetAsEntry`), the same
 * enumeration path as `<input webkitdirectory>` (chosen over the File System
 * Access handle, which silently drops odd-named files). The recursion + batch
 * loop is the subtle part, so it lives here framework-free over structural
 * entry shapes and is node-tested; `source.load` maps the survivors to URLs.
 */

/** A dropped file entry (`FileSystemFileEntry`-shaped, minimal). */
export interface DroppedFileEntry {
  readonly isFile: true
  readonly isDirectory: false
  file(success: (file: File) => void, error?: (err: unknown) => void): void
}

/** A dropped directory entry (`FileSystemDirectoryEntry`-shaped, minimal). */
export interface DroppedDirectoryEntry {
  readonly isFile: false
  readonly isDirectory: true
  createReader(): DroppedDirectoryReader
}

/** `FileSystemDirectoryReader`-shaped; `readEntries` yields in batches. */
export interface DroppedDirectoryReader {
  readEntries(success: (entries: DroppedEntry[]) => void, error?: (err: unknown) => void): void
}

export type DroppedEntry = DroppedFileEntry | DroppedDirectoryEntry

function readOneBatch(reader: DroppedDirectoryReader): Promise<DroppedEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject))
}

async function entryToFiles(entry: DroppedEntry): Promise<File[]> {
  if (entry.isDirectory) {
    const reader = entry.createReader()
    const files: File[] = []
    // `readEntries` returns a partial batch (~100 in Chrome) each call and an
    // empty array only when the directory is exhausted — loop until empty or
    // large folders are silently truncated. Sequential await also satisfies the
    // API's rule of one outstanding `readEntries` per reader at a time.
    for (;;) {
      const batch = await readOneBatch(reader)
      if (batch.length === 0) break
      for (const child of batch) files.push(...(await entryToFiles(child)))
    }
    return files
  }
  const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject))
  return [file]
}

/** Recursively flatten dropped entries to their files (depth-first, walk order). */
export async function collectEntryFiles(entries: readonly DroppedEntry[]): Promise<File[]> {
  const nested = await Promise.all(entries.map(entryToFiles))
  return nested.flat()
}

/**
 * Extract every file from a drop, recursing into dropped folders. Entries must be
 * pulled synchronously — `DataTransferItem`s are only valid during the drop event,
 * so map to entries before the first await. Falls back to the flat `files` list
 * when the Entry API is unavailable (older/non-Chromium engines).
 */
export async function filesFromDataTransfer(transfer: DataTransfer): Promise<File[]> {
  const entries = Array.from(transfer.items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry?.() ?? null)
    .filter((entry): entry is FileSystemEntry => entry != null)

  if (entries.length === 0) return Array.from(transfer.files)

  // Real `FileSystemEntry.isFile/isDirectory` are `boolean`; our union keys on
  // the narrowed literals. Same shape at runtime, so cross the boundary once.
  return collectEntryFiles(entries as unknown as DroppedEntry[])
}
