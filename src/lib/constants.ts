/** App-wide constants. Session defaults (pose counts, intervals, rests) land here in M0. */

export const APP_NAME = 'Gestures'

/**
 * Public base path the app is served from. Mirrors Vite's `base` and the
 * Cloudflare route (`andreitim.com/apps/gestures/`). Prefer `import.meta.env.BASE_URL`
 * for runtime-constructed asset URLs; this constant is for non-Vite contexts.
 */
export const BASE_PATH = '/apps/gestures/'
