/**
 * Top-level screen navigation (`gestures-spec.md` §4 flow: Setup → Session →
 * Summary → Setup). A single reactive `current` screen the app shell switches
 * on. Kept separate from the session runtime (`session.svelte.ts`) so the shell
 * can route independently of the drawing clock; later steps drive `show(...)`
 * from real triggers (Start, session end, return-to-setup).
 *
 * `freedraw` is an off-flow branch reachable from Summary: hold the last pose on
 * screen with no timer, to keep drawing it as long as you like (Esc → Setup).
 */

export type Screen = 'setup' | 'session' | 'summary' | 'freedraw'

function createScreenStore() {
  let current = $state<Screen>('setup')
  return {
    get current(): Screen {
      return current
    },
    show(screen: Screen): void {
      current = screen
    },
  }
}

/** The app-wide current screen. */
export const screen = createScreenStore()
