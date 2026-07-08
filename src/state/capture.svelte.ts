/**
 * Capture-to-Drive state (`gestures-spec.md` §3/§7, M2 slice a). Sign-in happens
 * **only here**, when the user logs a finished session (spec §3) — the core timer
 * never authenticates. It signs in, writes the free-form notes, and copies the
 * run's ordered references (`Ref_1…N`) into a dated `Gestures Sessions/<date>/`
 * folder in the user's own Drive; uploading the user's own drawings lands next (a3).
 *
 * The Client ID is inlined by Vite (not a secret — origin-locked, spec §3); absent
 * in a dev checkout without `.env.local` → the Save affordance hides rather than
 * fails (`configured` is false).
 */

import { DriveAuthError, createDriveAuth } from '@/lib/source/drive-auth'
import { DriveWriteError, copyReferenceImages, createSessionFolder, writeTextFile } from '@/lib/source/drive-write'
import type { SourceImage } from '@/lib/source/images'

const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? ''

export type CaptureStatus = 'idle' | 'working' | 'done' | 'error'

function createCaptureStore() {
  // One auth handle for the app's lifetime, so a token minted for the first log
  // is reused (still fresh) if the user logs again without leaving the screen.
  const auth = clientId ? createDriveAuth(clientId) : null

  let status = $state<CaptureStatus>('idle')
  let message = $state('')
  let folderUrl = $state('')
  // The dated folder created for *this* session, cached so a re-log (e.g. after a
  // throttled partial copy) reuses it instead of minting a fresh `<date>-N`.
  // Cleared by reset(), which the recap calls on mount → each session gets its own.
  let sessionFolderId: string | null = null

  return {
    /** False in a build without a Client ID → the Save UI stays hidden. */
    get configured(): boolean {
      return auth !== null
    },
    get status(): CaptureStatus {
      return status
    },
    get message(): string {
      return message
    },
    /** A link to the dated folder after a successful log, else ''. */
    get folderUrl(): string {
      return folderUrl
    },

    /**
     * Sign in (first time only, via Google's popup) and write the session notes
     * plus the ordered reference images (`Ref_1…N`) into `Gestures Sessions/<today>/`.
     * Idempotent folders — re-logging the same day reuses them. The image copy is
     * best-effort: a throttled ref is skipped and reported, not fatal. Swallows
     * nothing else: failures surface a friendly `message`.
     */
    async log(notes: string, images: readonly SourceImage[] = []): Promise<void> {
      if (!auth || status === 'working') return
      status = 'working'
      message = ''
      try {
        const token = await auth.getToken()
        sessionFolderId ??= await createSessionFolder(new Date(), token)
        await writeTextFile('notes.txt', sessionFolderId, notes, token)
        const copy = await copyReferenceImages(images, sessionFolderId, token)
        folderUrl = `https://drive.google.com/drive/folders/${sessionFolderId}`
        status = 'done'
        message =
          copy.total === 0
            ? 'Session logged to your Drive.'
            : copy.uploaded === copy.total
              ? `Session logged — ${copy.uploaded} reference${copy.uploaded === 1 ? '' : 's'} copied.`
              : `Session logged — copied ${copy.uploaded} of ${copy.total} references (the rest were throttled; try again shortly).`
      } catch (err) {
        status = 'error'
        message =
          err instanceof DriveAuthError || err instanceof DriveWriteError
            ? err.message
            : 'Something went wrong saving to Drive.'
      }
    },

    /**
     * Clear the visible result (status/message/link) — used when the panel is
     * dismissed or reopened. Keeps the cached session folder, so re-logging the
     * same session still lands in the same `<date>` folder rather than a `-N`.
     */
    reset(): void {
      status = 'idle'
      message = ''
      folderUrl = ''
    },

    /**
     * A brand-new session's recap is mounting: drop everything, including the
     * cached folder, so this session logs into its own fresh `<date>[-N]` folder
     * and no prior "logged" result lingers. Called once per recap mount.
     */
    newSession(): void {
      this.reset()
      sessionFolderId = null
    },
  }
}

export const capture = createCaptureStore()
