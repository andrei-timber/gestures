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

2026-07-03 — **Quick-mode: the 90-min hard cap wins over the 10-pose minimum.** Context: spec §5 sets
both a min of 10 poses and a hard ≤90-min active cap; a large custom interval (e.g. 10 min) makes these
conflict — 10 poses would be 100 min. Concern: `clampNQuick` must pick one when they collide. Decision:
the cap is the "impossible to exceed" invariant, so it wins — the count drops below 10 rather than
overshoot 90 min (10-min interval → 9 poses). Tradeoff: a Quick session can fall under the nominal
floor for very long intervals; alternative is to have the UI forbid such intervals (revisit at step 10).

2026-07-03 — **Step 16's core (prev/next runtime + arrow buttons) pulled forward into Session D.**
Context: while building the slideshow (Session D) the owner asked for faint side-arrow buttons to scrub a
run quickly; the step ledger had scheduled prev/next as step 16 (a Session E "one key at a time" helper).
Concern: the arrows need runtime jump logic (`next()`/`prev()`), which is step 16's substance — building
it now reorders the ledger. Decision: implement `next()`/`prev()` (reset the landed pose's clock, work
while running or paused, next-past-last ends, prev clamps at first — all tested) plus the arrow buttons
in Session D, leaving only the `←`/`→` key binding for step 16 (to hang off step 15's dispatcher).
Tradeoff: step 16 is split across two sessions, breaking the strict one-change-per-step granularity;
accepted because the scrub affordance also made browser-verifying steps 12–14 (rests, countdown, recap)
fast — I drove the natural end-of-run via the next arrow instead of waiting out real durations.

2026-07-03 — **Pose picking enforces a source-index gap, not just a shuffle.** Context: reference
libraries are often ordered — the same pose at several angles spans a run of consecutive files — so
random picks would draw near-duplicates. Concern: how to dedup without hurting small folders or ever
repeating an image. Decision: select N distinct indices pairwise ≥ a target gap (30) apart, spread
uniformly at random (`pickSpaced` in `src/lib/session/pick.ts`); on a pool too small for 30 the gap
shrinks to `⌊(pool-1)/(n-1)⌋` (even "modulo" spread); if the pool holds fewer than N images, effective
N = pool size (every image once, never repeated). Randomization then controls only display order.
Tradeoff: on huge ordered libraries a random min-gap pick doesn't guarantee full front-to-back coverage
(slack is random), accepted since dedup — not coverage — is the goal; the average spread is still wide.
