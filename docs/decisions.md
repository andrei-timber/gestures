# Decisions

Append-only, dated. Y-statement shape: context → concern → decision → tradeoff.
Build-level decisions made while implementing; product decisions live in `gestures-spec.md`.

2026-07-03 — **Cloudflare setup + deploy moves from before-M0 to after the creative-direction pass.**
Context: spec §13's original sequencing put the Cloudflare setup guide between dev setup and M0 to "deploy
the skeleton early." Concern: that step was skipped — M0 is being built and browser-verified locally with
no hosting stood up, so the "deployable skeleton live early" rationale no longer holds, and the companion
tracks (🎨 creative direction, ☁️ Cloudflare) were invisible in STATUS. Decision: reorder to dev setup ✓ →
M0 → creative direction → Cloudflare guide + first deploy → M1+, and surface the two companion tracks as
sequenced rows in the STATUS Milestones table (pointing to spec §14, not restating). Tradeoff: nothing is
deployed until after M0 + the restyle, so the first public URL comes later; accepted because there's no
value in hosting an unstyled core, and building/styling locally first is friction-free. Canonical
sequencing lives in spec §13; STATUS reflects it.

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

2026-07-03 — **Class mode requires ≥10 images; small folders fall back to Quick.** Context: browser-
verifying step 15 surfaced that a Class run on a folder of fewer than 10 images played 10 poses against
4 images — poses past the pool rendered blank, and the FYI read the contradictory "10 poses (limited by
folder)". Root cause: Setup capped the count to the pool, but Class's `MIN_POSES=10` floor (`caps.ts`)
re-raised it, and Quick's identical floor (`quick.ts`) meant a naive "switch to Quick" wouldn't help.
Concern: how to keep small folders usable without repeats (§5 forbids them) or blank slides. Decision:
(a) Class is disabled below 10 images and the setup auto-switches to Quick with a note; (b) the folder's
image count flows into `buildPlan` as a hard `poolCap` that can pull the count *below* `MIN_POSES` — the
floor now guards only the user-*requested* count, not a folder-limited one. So a 4-image folder runs
exactly 4 Quick poses. Tradeoff: `MIN_POSES` is no longer an absolute lower bound on a session's length
(a 1-image folder yields a 1-pose run); accepted — the folder is a harder constraint than the input
minimum, and the alternative (blocking <10-image folders entirely) is worse for the local-folder flow.
