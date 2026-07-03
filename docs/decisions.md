# Decisions

Append-only, dated. Y-statement shape: context → concern → decision → tradeoff.
Build-level decisions made while implementing; product decisions live in `gestures-spec.md`.

2026-07-03 — **Session-G chrome polish pulled forward during Session E; glass treatment is interim.**
Context: while browser-verifying the Session-E helpers, the owner asked for four polishes now rather than
at their scheduled Session-G slot — the countdown/arrows were invisible over bright references, pause hid
the pose behind a heavy "Paused" veil, and Esc did nothing. Concern: doing chrome styling before the
creative-direction pass (spec §14, which originates the design system) risks throwaway work. Decision:
ship a minimal interim treatment now — an Apple-style frosted-glass pill on the clock + nav arrows + a
large pause icon (dim halved so the pose stays studyable), `Esc` = end (End button cues "(esc)"), and a
one-line shortcut legend beside End. The glass recipe lives as a single `.glass` class scoped to
`Session.svelte`, explicitly flagged interim. Tradeoff: the creative-direction pass will formalise the
tokens and may restyle or replace the glass, and the legend only *partially* satisfies step 22 (a full
discoverable shortcuts help is still due) — accepted because legibility-over-bright is a real usability
blocker today and the interim surface is cheap to supersede. Tracked in STATUS Follow-ups.

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

2026-07-03 — **In-session view aids (mirror/grayscale/grid) are per-pose, and live in the runtime
state machine.** Context: Session F adds `m`/`v` mirror, `g` grayscale, `r` grid. Two questions: do
they persist across poses, and where does their state live. Decision: (a) they **reset on every pose
change** (auto-advance, prev/next) — they're sanity checks against the pose in front of you, not
session-wide settings (owner's call; folded into spec §6). (b) State lives as a per-pose `aids` object
*inside* the runtime reducer (`RuntimeState.aids`), reset wherever `index` changes (`next`/`prev`/`tick`
advance). Rationale: the reset is intrinsically coupled to the pose transitions the runtime already owns,
so colocating keeps it guaranteed-correct and fully vitest-testable; the reactive store and Session view
stay thin pass-throughs (CSS transform/filter + an SVG grid). Tradeoff: the deterministic engine now
carries presentation-flavoured flags rather than staying purely about lifecycle/timing; accepted because
"transient state scoped to the current pose" is genuinely the runtime's concern, and the alternative
(component state + an effect watching `index`) would push the reset wiring out of test coverage.
The grid is a viewport-spanning rule-of-thirds (not fitted to the `contain` image bounds — parked
follow-up); the line-of-action variant named in spec §6 is deferred.

2026-07-03 — **Gentle end cue is visual-only (no beep).** Context: step 21 spec'd "a soft beep for the
last ~3s + subtle visual." Decision: drop the audio entirely; the cue is the countdown warming to a calm
amber + soft glow over the last 3s of an active pose (owner's call at scoping). Rationale: keeps the
atmosphere quiet and sidesteps WebAudio autoplay-gesture gating for no felt loss; the visual reads clearly
at the moment it matters. Gated `running && !resting && 0<rem≤3` so it never fires on rests, pause, or the
final handoff. Tradeoff: no cue when the artist's eyes are off the clock; accepted — a beep can return
later if the silent version proves too easy to miss. Amber is an interim literal pending the 🎨 token pass.

2026-07-03 — **Remember-last is always on; the toggle is gone.** Context: the setup carried a "Remember
these settings" checkbox (`rememberLast` flag). Decision: remove the checkbox and always persist; drop the
`rememberLast` field end-to-end (type, defaults, parse/serialize, reactive persist, tests). Rationale:
leaning the landing page (owner's call); a returning user almost always wants their last config, and the
opt-out earned its own line of chrome for a rare case. Spec §5 marks remember-last implicit. Tradeoff: no
in-app "leave no trace" escape hatch — clearing localStorage is now the only reset; accepted for a
single-user local tool.

2026-07-03 — **Truthful recap: actual elapsed + poses-drawn live in the runtime; End/Esc is a real
transition.** Context: the summary restated the *planned* run, so ending early via End/Esc overstated it;
End/Esc also only navigated, leaving the store's 1s interval ticking. Decision: (a) add an `end()`
transition to the pure runtime (running/paused/rest → ended, idempotent, freezes the clock, keeps `index`)
and have the store command run it + `stopTimer()`; (b) accumulate an `elapsed` counter inside `tick`
(excludes paused time, includes rests, follows add-time) and expose a `posesDrawn` selector (`index+1`);
the summary reads these. Rationale: elapsed is deterministic given the tick stream, so it belongs in the
tested machine beside the clock rather than a component timer; on a full run it equals the planned figures,
so only an early end diverges. Tradeoff: the deterministic engine gains an accumulator field (like `aids`,
mild presentation-flavour); accepted — wall-time-in-run is genuinely the runtime's concern and stays fully
vitest-covered. formatDuration's whole-minute rounding means a very short early end reads "0 min"; fine.

2026-07-03 — **Folder pick prefers the File System Access API, webkitdirectory is the fallback.** Context:
`<input webkitdirectory>` forces Chrome's misleading "upload all files to this site" prompt though nothing
is uploaded (spec §9). Decision: feature-detect `showDirectoryPicker` and prefer it (Chromium, the deploy
target) for its accurate "view files" prompt; keep the `webkitdirectory` `<input>` as the fallback
(Firefox/Safari) triggered programmatically. Walk the returned handle with a recursive, structurally-typed
`collectFiles` (node-testable, no DOM) so nested reference subfolders load like the old tree walk. Add a
one-line "nothing is uploaded" reassurance that also defuses the scary prompt on the fallback path.
Rationale: the owner's own browser gets the clean prompt now; recursion preserves the subfolder-organized
library. Tradeoff: two code paths + a hand-narrowed `showDirectoryPicker` type (not yet in TS DOM lib);
accepted. The native dialog can't be automated, so the API path is browser-verified via a faked handle.
Full design: `docs/folder-picker-permission.md`. Worth a line in spec §9 at the next spec pass.

2026-07-03 — **NaN-clamp lives at the input blur, and the poses field never actually NaN'd.** Context:
follow-up flagged clearing a setup number input writing NaN → "0 min" FYI. Finding on reproduction: Svelte
5's empty number binding yields `null` → 0, which the plan floors (`clampN`/`clampNQuick` → `MIN_POSES`),
so Poses/Rest self-heal already; the visible offender was **custom-minutes** (`Number('')` → 0 → interval
0s). Decision: add pure, tested `clamp{PoseCount,RestSeconds,IntervalSeconds}` helpers in `settings.ts` and
route each input's `onblur` through the matching one, snapping a cleared field to its `min`. Rationale:
blur-clamp keeps typing unobstructed and commits a valid value; custom-minutes is the real fix, poses/rest
are defensive. Clamping the custom interval to its 30s floor snaps it onto the 30s preset (the field
collapses), which is honest. Also this session (no separate decisions): dep alignment (@types/node→22,
Vite→8.1.3), `session/limits.ts` extraction (shared `MIN_POSES`/`MAX_ACTIVE_SECONDS`, past the third
consumer), and window-prefetch decodes (`docs/prefetch-window.md`; pure `prefetchWindow` + browser-only
`warm`). The grid-overlay image-bounds follow-up was deliberately **left untouched** (owner's call).
