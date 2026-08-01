/**
 * PSD → per-pose drawing images (`gestures-spec.md` §7, M2 slice a3). The owner
 * draws a whole session into one Photoshop file, one layer per pose, so the
 * capture upload takes **the `.psd` itself** and explodes it here rather than
 * asking for a folder of hand-named JPEGs.
 *
 * Shaped by the two real session files (2026-08-01 probe): layers are Photoshop's
 * default `Layer <n>` in pose order, sitting on a `Background` sheet, with every
 * layer but the last flagged **hidden** (the owner's working style) — so the
 * hidden flag is deliberately *ignored*, and only the `Layer <n>` name pattern
 * selects. Strokes sit on transparency, hence the white matte before JPEG.
 *
 * Split per the repo's "test the logic" line: layer selection and numbering are
 * pure and node-tested; rasterising needs a real canvas, so it's injected and
 * browser-verified. `ag-psd` is `import()`ed on demand — it's ~800 KB, and a user
 * who never logs a session should never download it.
 */

/** One layer, reduced to what selection needs (structurally what `ag-psd` returns). */
export interface PsdLayerLike {
  readonly name?: string
  readonly hidden?: boolean
}

/**
 * One pose's drawing, still as live pixels (`ag-psd` hands back a canvas per
 * layer) and tied to its pose by `number`. Deliberately *not* encoded here: the
 * drawing is never saved on its own — it goes straight into the paired composite
 * (`capture/composite`), so encoding it to JPEG first would be a lossy round-trip
 * for nothing.
 */
export interface DrawingImage {
  readonly number: number
  readonly canvas: CanvasImageSource
}

/** A PSD we couldn't read, with a message safe to show the user. */
export class PsdReadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PsdReadError'
  }
}

/**
 * Pure: the pose number in a drawing-layer name, or `null` if it isn't one.
 * Matches Photoshop's default `Layer 3` plus the tidier `layer-3` / `Layer_3`,
 * and nothing else — `Background`, `guides`, `Layer 3 copy` are all left out, so
 * a stray layer can't silently claim a pose slot.
 */
export function drawingLayerNumber(name: string | undefined): number | null {
  const match = /^layer[\s_-]*(\d+)$/i.exec((name ?? '').trim())
  if (!match) return null
  const n = Number(match[1])
  return n > 0 ? n : null
}

/**
 * Pure: the numbered drawing layers, in pose order. Ignores the hidden flag (the
 * owner leaves all but the last layer hidden). If two layers claim the same
 * number the **topmost** wins — in Photoshop's stacking that's the later edit.
 */
export function selectDrawingLayers<T extends PsdLayerLike>(layers: readonly T[]): { number: number; layer: T }[] {
  const byNumber = new Map<number, T>()
  for (const layer of layers) {
    const number = drawingLayerNumber(layer.name)
    if (number !== null) byNumber.set(number, layer) // later entry = higher in the stack
  }
  return [...byNumber.entries()]
    .map(([number, layer]) => ({ number, layer }))
    .sort((a, b) => a.number - b.number)
}

/** Injectable deps for {@link extractPsdDrawings} — so the orchestrator is node-testable. */
export interface ExtractDeps {
  /** Parses the PSD bytes into layers; defaults to a lazily-imported `ag-psd`. */
  readonly readLayers?: (bytes: ArrayBuffer) => Promise<readonly (PsdLayerLike & { canvas?: unknown })[]>
}

async function readLayersWithAgPsd(bytes: ArrayBuffer): Promise<readonly (PsdLayerLike & { canvas?: unknown })[]> {
  // Lazy: keeps ~800 KB of PSD parser out of the main bundle (spec §9 "fast").
  const { readPsd } = await import('ag-psd')
  const psd = readPsd(bytes, { skipCompositeImageData: true, skipThumbnail: true })
  return psd.children ?? []
}

/**
 * Read a session `.psd` into one drawing per numbered layer, in pose order. An
 * empty layer (no pixels) drops out rather than failing the batch — the same
 * best-effort stance as the reference copy. Throws {@link PsdReadError} only when
 * the file isn't a readable PSD at all.
 */
export async function extractPsdDrawings(file: File, deps: ExtractDeps = {}): Promise<DrawingImage[]> {
  const readLayers = deps.readLayers ?? readLayersWithAgPsd

  let layers: readonly (PsdLayerLike & { canvas?: unknown })[]
  try {
    layers = await readLayers(await file.arrayBuffer())
  } catch {
    throw new PsdReadError('That file isn’t a readable Photoshop document.')
  }

  return selectDrawingLayers(layers)
    .filter(({ layer }) => Boolean(layer.canvas))
    .map(({ number, layer }) => ({ number, canvas: layer.canvas as CanvasImageSource }))
}
