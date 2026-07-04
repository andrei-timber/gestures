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
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
