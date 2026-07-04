/**
 * Reactive image source (`gestures-spec.md` §3/§9). Holds the currently loaded
 * reference images regardless of tier: a local folder/file pick ({@link
 * createSourceStore.load}, object URLs) or a public Drive folder ({@link
 * createSourceStore.loadRemote}, remote URLs, spec §3). Only local `blob:` URLs
 * are store-owned, so replace/clear revokes those and leaves remote URLs alone.
 */

import { filterImages, type SourceImage } from '@/lib/source/images'

export type { SourceImage }

function createSourceStore() {
  let images = $state<SourceImage[]>([])

  // Only blob: URLs are ours to free; Drive https: URLs have no handle to revoke.
  function revoke(): void {
    for (const img of images) {
      if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url)
    }
  }

  return {
    get images(): readonly SourceImage[] {
      return images
    },
    get count(): number {
      return images.length
    },
    /** Filter a raw local pick to accepted images and adopt them. Returns the count. */
    load(files: readonly File[]): number {
      revoke()
      images = filterImages(files).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }))
      return images.length
    },
    /** Adopt an already-filtered remote list (e.g. Drive). Returns the count. */
    loadRemote(remote: readonly SourceImage[]): number {
      revoke()
      images = [...remote]
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
