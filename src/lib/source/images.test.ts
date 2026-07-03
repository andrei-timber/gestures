import { describe, expect, it } from 'vitest'
import { ACCEPTED_EXTENSIONS, filterImages, isAcceptedImage } from './images'

describe('isAcceptedImage', () => {
  it('accepts the spec §9 extensions, case-insensitively', () => {
    for (const ext of ACCEPTED_EXTENSIONS) {
      expect(isAcceptedImage(`pose${ext}`)).toBe(true)
      expect(isAcceptedImage(`pose${ext.toUpperCase()}`)).toBe(true)
    }
  })

  it('rejects non-image and extension-less names', () => {
    expect(isAcceptedImage('notes.txt')).toBe(false)
    expect(isAcceptedImage('clip.gif')).toBe(false)
    expect(isAcceptedImage('.DS_Store')).toBe(false)
    expect(isAcceptedImage('README')).toBe(false)
  })

  it('does not match the extension mid-name', () => {
    expect(isAcceptedImage('jpg-thoughts.txt')).toBe(false)
  })
})

const named = (names: string[]) => names.map((name) => ({ name }))

describe('filterImages', () => {
  it('drops non-images and keeps the accepted ones', () => {
    const out = filterImages(named(['a.png', 'notes.txt', 'b.jpg', 'clip.gif', 'c.webp']))
    expect(out.map((f) => f.name)).toEqual(['a.png', 'b.jpg', 'c.webp'])
  })

  it('sorts with natural numeric ordering (pose2 before pose10)', () => {
    const out = filterImages(named(['pose10.png', 'pose2.png', 'pose1.png']))
    expect(out.map((f) => f.name)).toEqual(['pose1.png', 'pose2.png', 'pose10.png'])
  })

  it('returns a new array and leaves the input untouched', () => {
    const input = named(['b.png', 'a.png'])
    const out = filterImages(input)
    expect(out).not.toBe(input)
    expect(input.map((f) => f.name)).toEqual(['b.png', 'a.png'])
  })

  it('yields an empty list when nothing qualifies', () => {
    expect(filterImages(named(['a.txt', 'b.pdf']))).toEqual([])
  })
})
