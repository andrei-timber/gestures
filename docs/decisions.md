# Decisions

Append-only, dated. Y-statement shape: context → concern → decision → tradeoff.
Build-level decisions made while implementing; product decisions live in `gestures-spec.md`.

2026-07-03 — **Deploy target is Cloudflare Workers Static Assets, not Pages.** Context: the app is a
static SPA served under `andreitim.com/apps/gestures`. Concern: Pages custom domains bind a whole
domain/subdomain, so subpath routing is awkward, and Pages is in migrate-to-Workers mode for new
projects. Decision: target Workers Static Assets (route `.../apps/gestures/*`, SPA not-found fallback).
Tradeoff: updates spec §2/§9's "Pages" wording; full deploy config deferred to the Cloudflare
setup-guide track. Details in `docs/deploy-notes.md`.

2026-07-03 — **GitHub handle stays `andrei-timber`; git authorship becomes `andreitim`.** Context: owner
wants the `andreitim` identity everywhere. Concern: the GitHub username `andreitim` is already held by
another active user and can't be claimed. Decision: keep the `andrei-timber` GitHub handle, set git
`user.name` to `andreitim` (email unchanged); the domain `andreitim.com` is unaffected. Tradeoff: a
cosmetic handle/identity mismatch on GitHub, accepted over a risky-or-impossible username change.

2026-07-03 — **`src/state/` is deferred to M0, not scaffolded empty now.** Context: spec §9 lists a
`ui / state / lib` split. Concern: `state/` had nothing in it and existed only via a `.gitkeep`
placeholder. Decision: keep the convention documented in `CLAUDE.md` but create `state/` when M0's first
reactive store lands. Tradeoff: the three-folder structure is not visible on disk until M0, accepted to
avoid placeholder cruft.

2026-07-03 — **Vite `base` is always `/apps/gestures/`, including in dev.** Context: the subpath deploy
needs asset URLs prefixed with the base. Concern: a build-only base lets base-path bugs hide until
deploy. Decision: set `base` unconditionally so dev mirrors prod (dev serves at
`localhost:5173/apps/gestures/`). Tradeoff: a slightly less tidy local dev URL, accepted for prod-parity.
