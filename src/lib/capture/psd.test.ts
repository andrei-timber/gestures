import { describe, expect, it, vi } from 'vitest'
import { PsdReadError, drawingLayerNumber, extractPsdDrawings, selectDrawingLayers } from './psd'

/** A stand-in for the bytes; the parser is always injected in these tests. */
function psdFile(): File {
  return { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) } as unknown as File
}

describe('drawingLayerNumber', () => {
  it('reads Photoshop’s default naming and the tidier variants', () => {
    expect(drawingLayerNumber('Layer 1')).toBe(1)
    expect(drawingLayerNumber('layer 16')).toBe(16)
    expect(drawingLayerNumber('layer-3')).toBe(3)
    expect(drawingLayerNumber('Layer_07')).toBe(7)
    expect(drawingLayerNumber('Layer12')).toBe(12)
    expect(drawingLayerNumber('  Layer 2  ')).toBe(2)
  })

  it('rejects anything that isn’t purely a numbered layer', () => {
    expect(drawingLayerNumber('Background')).toBeNull()
    expect(drawingLayerNumber('Layer 3 copy')).toBeNull()
    expect(drawingLayerNumber('guides')).toBeNull()
    expect(drawingLayerNumber('Layer')).toBeNull()
    expect(drawingLayerNumber('Layer 0')).toBeNull()
    expect(drawingLayerNumber(undefined)).toBeNull()
  })
})

describe('selectDrawingLayers', () => {
  it('keeps only numbered layers, in pose order, whatever the stack order', () => {
    const picked = selectDrawingLayers([
      { name: 'Background' },
      { name: 'Layer 2' },
      { name: 'Layer 10' },
      { name: 'Layer 1' },
      { name: 'notes' },
    ])
    expect(picked.map((p) => p.number)).toEqual([1, 2, 10])
  })

  it('ignores the hidden flag — the owner leaves all but the last layer hidden', () => {
    const picked = selectDrawingLayers([
      { name: 'Layer 1', hidden: true },
      { name: 'Layer 2', hidden: true },
      { name: 'Layer 3', hidden: false },
    ])
    expect(picked).toHaveLength(3)
  })

  it('lets the topmost layer win when two claim the same pose number', () => {
    const picked = selectDrawingLayers([
      { name: 'Layer 1', hidden: true },
      { name: 'layer-1', hidden: false },
    ])
    expect(picked).toEqual([{ number: 1, layer: { name: 'layer-1', hidden: false } }])
  })

  it('returns nothing for a PSD with no numbered layers', () => {
    expect(selectDrawingLayers([{ name: 'Background' }])).toEqual([])
  })
})

describe('extractPsdDrawings', () => {
  it('returns each numbered layer’s pixels in pose order, never the Background sheet', async () => {
    const readLayers = vi.fn().mockResolvedValue([
      { name: 'Background', canvas: 'bg' },
      { name: 'Layer 2', canvas: 'c2', hidden: true },
      { name: 'Layer 1', canvas: 'c1', hidden: true },
    ])
    expect(await extractPsdDrawings(psdFile(), { readLayers })).toEqual([
      { number: 1, canvas: 'c1' },
      { number: 2, canvas: 'c2' },
    ])
  })

  it('skips a layer with no pixels', async () => {
    const readLayers = vi.fn().mockResolvedValue([{ name: 'Layer 1' }, { name: 'Layer 2', canvas: 'c2' }])
    expect((await extractPsdDrawings(psdFile(), { readLayers })).map((d) => d.number)).toEqual([2])
  })

  it('raises a user-safe error when the file isn’t a readable PSD', async () => {
    const readLayers = vi.fn().mockRejectedValue(new Error('bad signature'))
    await expect(extractPsdDrawings(psdFile(), { readLayers })).rejects.toBeInstanceOf(PsdReadError)
  })

  it('returns nothing for a PSD without numbered layers', async () => {
    const readLayers = vi.fn().mockResolvedValue([{ name: 'Background', canvas: 'bg' }])
    expect(await extractPsdDrawings(psdFile(), { readLayers })).toEqual([])
  })
})
