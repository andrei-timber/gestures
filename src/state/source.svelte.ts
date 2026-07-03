/**
 * Reactive image source (`gestures-spec.md` §9, M0 local-folder tier). Holds the
 * currently loaded reference images and maps a raw folder/file pick to a
 * displayable list via the pure filter (`@/lib/source/images`). Object URLs are
 * revoked when the set is replaced or cleared to avoid leaking blob handles.
 */

import { filterImages } from '@/lib/source/images'

export interface SourceImage {
  readonly name: string
  /** Object URL for display; owned by this store and revoked on replace/clear. */
  readonly url: string
}

function createSourceStore() {
  let images = $state<SourceImage[]>([])

  function revoke(): void {
    for (const img of images) URL.revokeObjectURL(img.url)
  }

  return {
    get images(): readonly SourceImage[] {
      return images
    },
    get count(): number {
      return images.length
    },
    /** Filter a raw pick to accepted images and adopt them. Returns the count. */
    load(files: readonly File[]): number {
      revoke()
      images = filterImages(files).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }))
      return images.length
    },
    clear(): void {
      revoke()
      images = []
    },
  }
}

/** The app-wide loaded reference set. */
export const source = createSourceStore()
