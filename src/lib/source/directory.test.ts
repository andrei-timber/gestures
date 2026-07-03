import { describe, expect, it } from 'vitest'
import { type DirEntry, type FileEntry, collectFiles } from './directory'

const file = (name: string): FileEntry => ({
  kind: 'file',
  getFile: async () => new File(['x'], name),
})
const dir = (...entries: (FileEntry | DirEntry)[]): DirEntry => ({
  kind: 'directory',
  values: async function* () {
    yield* entries
  },
})

const names = async (d: DirEntry) => (await collectFiles(d)).map((f) => f.name)

describe('collectFiles', () => {
  it('collects files from a flat directory', async () => {
    expect(await names(dir(file('a.jpg'), file('b.png')))).toEqual(['a.jpg', 'b.png'])
  })

  it('descends into subdirectories, depth-first in iteration order', async () => {
    const tree = dir(
      file('top.jpg'),
      dir(file('sub1.jpg'), dir(file('deep.jpg'))),
      file('after.jpg'),
    )
    expect(await names(tree)).toEqual(['top.jpg', 'sub1.jpg', 'deep.jpg', 'after.jpg'])
  })

  it('yields nothing for an empty directory or empty subtrees', async () => {
    expect(await names(dir())).toEqual([])
    expect(await names(dir(dir(), dir(dir())))).toEqual([])
  })
})
