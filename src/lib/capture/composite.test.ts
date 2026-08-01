import { describe, expect, it } from 'vitest'
import { PAIR_CELL, PAIR_MARGIN, PAIR_SEAM_GAP, containRect, halfBox, layoutPair } from './composite'

const INSET = PAIR_CELL * PAIR_MARGIN
/** A half's usable box: margin on the outer edge and top/bottom, none at the seam. */
const BOX_W = PAIR_CELL - INSET
const BOX_H = PAIR_CELL - INSET * 2

describe('halfBox', () => {
  it('insets the left half from the left edge but runs flush to the centre seam', () => {
    expect(halfBox('left')).toEqual({ x: INSET, y: INSET, width: BOX_W, height: BOX_H })
  })

  it('starts the right half at the seam and insets it from the right edge', () => {
    const box = halfBox('right')
    expect(box.x).toBe(PAIR_CELL) // flush against the seam
    expect(box.x + box.width).toBe(PAIR_CELL * 2 - INSET)
  })

  it('leaves the same margin above and below in both halves', () => {
    for (const side of ['left', 'right'] as const) {
      const box = halfBox(side)
      expect(box.y).toBe(INSET)
      expect(box.y + box.height).toBe(PAIR_CELL - INSET)
    }
  })
})

describe('containRect', () => {
  it('fits a portrait image by its height and centres it vertically', () => {
    const rect = containRect(1000, 2000, halfBox('left'), 'end')
    expect(rect.height).toBe(BOX_H)
    expect(rect.width).toBe(BOX_H / 2)
    expect(rect.y).toBeCloseTo(INSET)
    expect(rect.y + rect.height).toBeCloseTo(PAIR_CELL - INSET)
  })

  it('pushes an `end`-aligned image to the box’s right edge', () => {
    const box = halfBox('left')
    const rect = containRect(1000, 2000, box, 'end')
    expect(rect.x + rect.width).toBeCloseTo(box.x + box.width) // flush at the seam
  })

  it('pins a `start`-aligned image to the box’s left edge', () => {
    expect(containRect(1000, 2000, halfBox('right'), 'start').x).toBe(PAIR_CELL)
  })

  it('leaves no gap at the seam before the seam gap is applied', () => {
    const left = containRect(1000, 2000, halfBox('left'), 'end')
    const right = containRect(1000, 2000, halfBox('right'), 'start')
    expect(right.x - (left.x + left.width)).toBeCloseTo(0)
  })

  it('fits a landscape image by its width and centres it vertically', () => {
    const rect = containRect(4000, 1000, halfBox('left'), 'end')
    expect(rect.width).toBe(BOX_W)
    expect(rect.height).toBe(BOX_W / 4)
    expect(rect.y + rect.height / 2).toBeCloseTo(PAIR_CELL / 2)
  })

  it('preserves the aspect ratio of an extreme panorama', () => {
    const rect = containRect(4000, 250, halfBox('right'), 'start')
    expect(rect.width / rect.height).toBeCloseTo(16)
    expect(rect.width).toBeLessThanOrEqual(BOX_W)
    expect(rect.height).toBeLessThanOrEqual(BOX_H)
  })

  it('scales a small image up to the box rather than pinning it at 1:1', () => {
    // A trimmed PSD layer can be tiny; a pair reads better at a uniform footprint.
    expect(containRect(100, 100, halfBox('left'), 'end').height).toBeCloseTo(BOX_H)
  })

  it('never spills outside its own half, whatever the source size', () => {
    for (const [w, h] of [
      [10_000, 20],
      [20, 10_000],
      [1, 1],
    ]) {
      const left = containRect(w, h, halfBox('left'), 'end')
      expect(left.x).toBeGreaterThanOrEqual(INSET - 0.001)
      expect(left.x + left.width).toBeLessThanOrEqual(PAIR_CELL + 0.001)
      const right = containRect(w, h, halfBox('right'), 'start')
      expect(right.x).toBeGreaterThanOrEqual(PAIR_CELL - 0.001)
      expect(right.x + right.width).toBeLessThanOrEqual(PAIR_CELL * 2 - INSET + 0.001)
      for (const rect of [left, right]) {
        expect(rect.y).toBeGreaterThanOrEqual(INSET - 0.001)
        expect(rect.y + rect.height).toBeLessThanOrEqual(PAIR_CELL - INSET + 0.001)
      }
    }
  })

  it('collapses a degenerate source instead of dividing by zero', () => {
    const box = halfBox('left')
    expect(containRect(0, 500, box)).toEqual({
      x: box.x,
      y: box.y + box.height / 2,
      width: 0,
      height: 0,
    })
  })
})

describe('layoutPair', () => {
  const portrait = { width: 1000, height: 2000 }

  it('opens a seam gap of 15% of the drawing’s rendered width', () => {
    const { reference, drawing } = layoutPair(portrait, portrait)
    const gap = drawing.x - (reference.x + reference.width)
    expect(gap).toBeCloseTo(drawing.width * PAIR_SEAM_GAP)
  })

  it('splits the gap evenly, so the pair stays centred on the seam', () => {
    const { reference, drawing } = layoutPair(portrait, portrait)
    const shift = drawing.width * PAIR_SEAM_GAP * 0.5
    expect(reference.x + reference.width).toBeCloseTo(PAIR_CELL - shift)
    expect(drawing.x).toBeCloseTo(PAIR_CELL + shift)
  })

  it('scales the gap with the drawing, not with the reference', () => {
    // A wide drawing renders smaller in height-fit terms; the gap follows *it*.
    const narrow = layoutPair(portrait, { width: 500, height: 2000 })
    const wide = layoutPair(portrait, { width: 2000, height: 2000 })
    expect(wide.drawing.x - (wide.reference.x + wide.reference.width)).toBeGreaterThan(
      narrow.drawing.x - (narrow.reference.x + narrow.reference.width),
    )
  })

  it('keeps both halves inside their margins when the images fill their boxes', () => {
    // A panorama already spans the full box width: the shift must clamp rather
    // than push the image out into (or past) the outer margin.
    const panorama = { width: 4000, height: 1000 }
    const { reference, drawing } = layoutPair(panorama, panorama)
    expect(reference.x).toBeGreaterThanOrEqual(PAIR_CELL * PAIR_MARGIN - 0.001)
    expect(drawing.x + drawing.width).toBeLessThanOrEqual(PAIR_CELL * 2 - PAIR_CELL * PAIR_MARGIN + 0.001)
  })

  it('centres both halves vertically, whatever the gap', () => {
    const { reference, drawing } = layoutPair(portrait, { width: 3000, height: 1000 })
    for (const rect of [reference, drawing]) {
      expect(rect.y + rect.height / 2).toBeCloseTo(PAIR_CELL / 2)
    }
  })

  it('honours a custom gap ratio', () => {
    const { reference, drawing } = layoutPair(portrait, portrait, PAIR_CELL, PAIR_MARGIN, 0)
    expect(drawing.x - (reference.x + reference.width)).toBeCloseTo(0)
  })
})
