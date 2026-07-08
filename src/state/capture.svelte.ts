/**
 * Capture-to-Drive state (`gestures-spec.md` §3/§7, M2 slice a). Sign-in happens
 * **only here**, when the user logs a finished session (spec §3) — the core timer
 * never authenticates. This first slice signs in and writes the free-form notes
 * into a dated `Gestures Sessions/<date>/` folder in the user's own Drive; copying
 * the ordered reference images and uploading the user's drawings land next (a2/a3).
 *
 * The Client ID is inlined by Vite (not a secret — origin-locked, spec §3); absent
 * in a dev checkout without `.env.local` → the Save affordance hides rather than
 * fails (`configured` is false).
 */

import { DriveAuthError, createDriveAuth } from '@/lib/source/drive-auth'
import { DriveWriteError, ensureSessionFolder, writeTextFile } from '@/lib/source/drive-write'

const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? ''

export type CaptureStatus = 'idle' | 'working' | 'done' | 'error'

function createCaptureStore() {
  // One auth handle for the app's lifetime, so a token minted for the first log
  // is reused (still fresh) if the user logs again without leaving the screen.
  const auth = clientId ? createDriveAuth(clientId) : null

  let status = $state<CaptureStatus>('idle')
  let message = $state('')
  let folderUrl = $state('')

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
     * into `Gestures Sessions/<today>/`. Idempotent folders — re-logging the same
     * day reuses them. Swallows nothing: failures surface a friendly `message`.
     */
    async log(notes: string): Promise<void> {
      if (!auth || status === 'working') return
      status = 'working'
      message = ''
      try {
        const token = await auth.getToken()
        const folderId = await ensureSessionFolder(new Date(), token)
        await writeTextFile('notes.txt', folderId, notes, token)
        folderUrl = `https://drive.google.com/drive/folders/${folderId}`
        status = 'done'
        message = 'Session logged to your Drive.'
      } catch (err) {
        status = 'error'
        message =
          err instanceof DriveAuthError || err instanceof DriveWriteError
            ? err.message
            : 'Something went wrong saving to Drive.'
      }
    },

    /** Back to the pristine state (e.g. when the panel is dismissed or reopened). */
    reset(): void {
      status = 'idle'
      message = ''
      folderUrl = ''
    },
  }
}

export const capture = createCaptureStore()
