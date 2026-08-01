/**
 * Paired reference↔drawing composites (`gestures-spec.md` §7). One image per
 * pose: the reference on the left, that pose's drawing on the right, each
 * `contain`-fitted into its half — nothing cropped, nothing stretched, and a 15%
 * white margin on the outer edges to take hand-drawn red-lines. The **centre
 * seam carries no margin** (owner's call 2026-08-01): the two halves sit close so
 * the eye compares them, rather than being pushed apart by a double margin. The
 * pair is what gets saved; the bare drawing never is.
 *
 * The geometry is pure and node-tested; the canvas draw itself is browser-only
 * and injected, so the orchestration above it stays testable.
 */

/** Share of a cell left as white margin on the outer edges (owner-specified 2026-08-01). */
export const PAIR_MARGIN = 0.15
/**
 * Gap at the centre seam, as a share of the **drawing's** rendered width
 * (owner-specified 2026-08-01). Tied to the drawing rather than to the cell so
 * the breathing room scales with how big the two images actually render.
 */
export const PAIR_SEAM_GAP = 0.15
/** Edge of one square cell, in px. The finished pair is `2 × PAIR_CELL` wide. */
export const PAIR_CELL = 1400
/** JPEG quality for the finished pair — pencil line-work on white, so 0.9 is ample. */
export const PAIR_JPEG_QUALITY = 0.9

/** A placed rectangle, in canvas pixels. */
export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * Pure: the box one half's image is fitted into, in whole-canvas coordinates.
 * Margin on the outer edge and on top/bottom, none against the centre seam — so
 * a pair reads as one comparison rather than two separated panels.
 */
export function halfBox(side: 'left' | 'right', cell = PAIR_CELL, margin = PAIR_MARGIN): Rect {
  const inset = cell * margin
  return {
    x: side === 'left' ? inset : cell,
    y: inset,
    width: cell - inset,
    height: cell - inset * 2,
  }
}

/** Where a fitted image sits along the box's x-axis. */
export type AlignX = 'start' | 'end'

/**
 * Pure: where an image of `srcWidth × srcHeight` lands inside `box`, scaled to
 * fit, centred vertically and pushed to `alignX` horizontally. Never crops, never
 * changes the aspect ratio. The two halves align *towards the seam* — the
 * reference to its right edge, the drawing to its left — because centring each in
 * its own half leaves the pair floating apart when both images are portrait
 * (which they nearly always are). A degenerate source collapses to an empty rect.
 */
export function containRect(srcWidth: number, srcHeight: number, box: Rect, alignX: AlignX = 'start'): Rect {
  const centreY = box.y + box.height / 2
  if (srcWidth <= 0 || srcHeight <= 0) return { x: box.x, y: centreY, width: 0, height: 0 }
  const scale = Math.min(box.width / srcWidth, box.height / srcHeight)
  const width = srcWidth * scale
  const height = srcHeight * scale
  return {
    x: alignX === 'start' ? box.x : box.x + box.width - width,
    y: centreY - height / 2,
    width,
    height,
  }
}

/**
 * Pure: where both halves land on the finished canvas. Each is fitted into its
 * half and pulled towards the centre, then the two are pushed back apart by
 * {@link PAIR_SEAM_GAP} of the drawing's rendered width — split evenly, and
 * clamped so neither can eat into its outer margin. The result is a pair that
 * reads as one comparison with a deliberate breath down the middle, whatever the
 * two aspect ratios are.
 */
export function layoutPair(
  reference: { width: number; height: number },
  drawing: { width: number; height: number },
  cell = PAIR_CELL,
  margin = PAIR_MARGIN,
  gapRatio = PAIR_SEAM_GAP,
): { reference: Rect; drawing: Rect } {
  const leftBox = halfBox('left', cell, margin)
  const rightBox = halfBox('right', cell, margin)
  const left = containRect(reference.width, reference.height, leftBox, 'end')
  const right = containRect(drawing.width, drawing.height, rightBox, 'start')
  const shift = (right.width * gapRatio) / 2
  return {
    reference: { ...left, x: Math.max(leftBox.x, left.x - shift) },
    drawing: { ...right, x: Math.min(rightBox.x + rightBox.width - right.width, right.x + shift) },
  }
}

/** The intrinsic size of anything drawable — `ImageBitmap`, `HTMLCanvasElement`, `HTMLImageElement`. */
function sizeOf(image: CanvasImageSource): { width: number; height: number } {
  const source = image as { width?: number | SVGAnimatedLength; height?: number | SVGAnimatedLength }
  return {
    width: typeof source.width === 'number' ? source.width : 0,
    height: typeof source.height === 'number' ? source.height : 0,
  }
}

/** A pair we couldn't render, with a message safe to show the user. */
export class CompositeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CompositeError'
  }
}

/**
 * Draw one reference↔drawing pair onto a white canvas and encode it as JPEG.
 * Browser-only. Both sources must be untainted (the reference is decoded from
 * fetched *bytes*, never an `<img src>` pointing at a third-party origin), or
 * `toBlob` would throw on a tainted canvas.
 */
export async function renderPair(reference: CanvasImageSource, drawing: CanvasImageSource): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = PAIR_CELL * 2
  canvas.height = PAIR_CELL
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new CompositeError('Your browser couldn’t render the session composites.')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const layout = layoutPair(sizeOf(reference), sizeOf(drawing))
  for (const [image, rect] of [
    [reference, layout.reference],
    [drawing, layout.drawing],
  ] as const) {
    if (rect.width > 0) ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height)
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PAIR_JPEG_QUALITY))
  if (!blob) throw new CompositeError('Your browser couldn’t encode the session composites.')
  return blob
}

/** Decode fetched image bytes into a drawable, EXIF-oriented bitmap (browser-only). */
export function decodeImage(blob: Blob): Promise<ImageBitmap> {
  // `from-image` auto-rotates phone photos, which arrive EXIF-rotated (spec §7).
  return createImageBitmap(blob, { imageOrientation: 'from-image' })
}
