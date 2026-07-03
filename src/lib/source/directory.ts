/**
 * Recursive file collection for the File System Access picker
 * (`docs/folder-picker-permission.md`). `showDirectoryPicker()` returns a
 * directory *handle* whose `values()` lists one level; we descend into
 * subdirectories so nested reference folders load like the `webkitdirectory`
 * tree walk they replace (the owner's library is organized in subfolders).
 *
 * Typed structurally — only the `kind` / `getFile` / `values` surface we use —
 * so it's node-testable with a fake handle and free of the still-uneven
 * lib.dom typings for these APIs. The real handle matches at the call site.
 */

/** A file handle: yields its `File` on demand. */
export interface FileEntry {
  kind: 'file'
  getFile(): Promise<File>
}

/** A directory handle: async-iterates its immediate children. */
export interface DirEntry {
  kind: 'directory'
  values(): AsyncIterable<FileEntry | DirEntry>
}

/**
 * Every file under `dir`, descending into subdirectories (depth-first, in
 * iteration order). Non-image filtering stays with `source.load` /
 * `filterImages`; this only flattens the tree to a `File[]`.
 */
export async function collectFiles(dir: DirEntry): Promise<File[]> {
  const files: File[] = []
  for await (const entry of dir.values()) {
    if (entry.kind === 'file') files.push(await entry.getFile())
    else files.push(...(await collectFiles(entry)))
  }
  return files
}
