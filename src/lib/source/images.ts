/**
 * Image-source filtering (`gestures-spec.md` §9, M0 local-folder tier). A folder
 * or multi-file pick yields arbitrary entries; only raster references we can
 * display belong in a session. This is the framework-free core — extension
 * matching and stable ordering over anything with a `name` — so it's node-
 * testable; the browser store maps the survivors to object URLs.
 */

/** Accepted image extensions (spec §9). `.jpeg` is admitted as a `.jpg` alias. */
export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

/** True when `name` ends in an accepted image extension (case-insensitive). */
export function isAcceptedImage(name: string): boolean {
  const lower = name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/**
 * Keep only accepted images, sorted by name with natural numeric ordering so
 * `pose2` precedes `pose10`. Returns a new array; the input is untouched.
 */
export function filterImages<T extends { name: string }>(items: readonly T[]): T[] {
  return items
    .filter((item) => isAcceptedImage(item.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}
