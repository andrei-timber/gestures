import { describe, expect, it } from 'vitest'
import {
  collectEntryFiles,
  filesFromDataTransfer,
  type DroppedEntry,
} from './dropped-files'

const fileEntry = (name: string): DroppedEntry => ({
  isFile: true,
  isDirectory: false,
  file: (ok) => ok(new File([], name)),
})

/** A directory whose reader hands back `children` in `batchSize` chunks. */
const dirEntry = (children: DroppedEntry[], batchSize = children.length): DroppedEntry => ({
  isFile: false,
  isDirectory: true,
  createReader() {
    let i = 0
    return {
      readEntries(ok) {
        const batch = children.slice(i, i + batchSize)
        i += batch.length
        ok(batch)
      },
    }
  },
})

const names = (files: File[]) => files.map((f) => f.name)

describe('collectEntryFiles', () => {
  it('flattens a directory of files', async () => {
    const out = await collectEntryFiles([dirEntry([fileEntry('a.jpg'), fileEntry('b.jpg')])])
    expect(names(out)).toEqual(['a.jpg', 'b.jpg'])
  })

  it('recurses into nested subdirectories, depth-first', async () => {
    const tree = dirEntry([
      fileEntry('top.jpg'),
      dirEntry([fileEntry('nested1.jpg'), fileEntry('nested2.jpg')]),
    ])
    const out = await collectEntryFiles([tree])
    expect(names(out)).toEqual(['top.jpg', 'nested1.jpg', 'nested2.jpg'])
  })

  it('drains readEntries across batches — never truncates at the first chunk', async () => {
    // 5 children, 2 per batch: a single-read impl would stop at 2 and lose 3.
    const five = ['1', '2', '3', '4', '5'].map((n) => fileEntry(`p${n}.jpg`))
    const out = await collectEntryFiles([dirEntry(five, 2)])
    expect(names(out)).toEqual(['p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.jpg'])
  })
})

/** Minimal `DataTransfer` fake — items expose `kind` + `webkitGetAsEntry`. */
const fakeTransfer = (
  items: { kind: string; entry: DroppedEntry | null }[],
  files: File[] = [],
): DataTransfer =>
  ({
    items: items.map((it) => ({ kind: it.kind, webkitGetAsEntry: () => it.entry })),
    files,
  }) as unknown as DataTransfer

describe('filesFromDataTransfer', () => {
  it('walks dropped folder entries and ignores non-file items', async () => {
    const transfer = fakeTransfer([
      { kind: 'string', entry: null },
      { kind: 'file', entry: dirEntry([fileEntry('a.jpg'), fileEntry('b.jpg')]) },
    ])
    expect(names(await filesFromDataTransfer(transfer))).toEqual(['a.jpg', 'b.jpg'])
  })

  it('falls back to the flat files list when the Entry API yields nothing', async () => {
    const transfer = fakeTransfer([{ kind: 'file', entry: null }], [new File([], 'plain.jpg')])
    expect(names(await filesFromDataTransfer(transfer))).toEqual(['plain.jpg'])
  })
})
