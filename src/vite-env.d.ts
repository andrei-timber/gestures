/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Google Drive API key for Tier-1 public-folder reads (`gestures-spec.md` §3).
   * App-owned and referrer-restricted; Vite inlines it into the bundle at build.
   * Supplied via a gitignored `.env.local` (see `.env.example`); empty in dev
   * disables the Drive input with a friendly note.
   */
  readonly VITE_GOOGLE_DRIVE_API_KEY?: string

  /**
   * Google OAuth 2.0 **Client ID** (Web-application type) for Tier-2 `drive.file`
   * capture (`gestures-spec.md` §3/§7, M2). Used by the GIS token model to mint
   * short-lived sign-in tokens; **not a secret** (origin-locked, ships in the
   * bundle like the API key). Supplied via `.env.local`; empty disables Save.
   */
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
