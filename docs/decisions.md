# Decisions

Append-only, dated. Y-statement shape: context → concern → decision → tradeoff.
Build-level decisions made while implementing; product decisions live in `gestures-spec.md`.

2026-07-06 — **Owner-feedback polish batch: in-session Refresh image + Continue-the-pose, plus three
setup nits.** Context: the owner ran a session and returned five refinements, each shipped as its own
commit. Four are mechanical; two carry real design calls. (1) **Refresh image** (new §6 helper, timing
menu + hotkey `f`): swap a too-recently-seen reference without leaving the pose. Owner chose all three
forks — *pull the next already-prefetched pose into the current slot* (instant paint) and backfill the
tail from a random unused spare, rather than decoding a cold random image; *reset the pose clock to
full* (a fresh reference is a fresh drawing); *disable the control when no unused image remains* rather
than reorder-with-repeat or recycle — so Refresh only ever shows something unseen, and no image the
artist has drawn recurs (the displaced image leaves the run entirely). The pure picking + array-shift
(`session/refresh.ts`) and the clock reset (`resetPoseTime` in `runtime.ts`) are unit-tested; the store
owns the residual pool + a reactive `SvelteSet` seen-set (needed so `canRefresh` re-derives as spares
drain — a plain `Set` tripped the `prefer-svelte-reactivity` lint and wouldn't react) and the `warm`
side-effect. `Math.random` seeds at the store edge, matching run-start selection. Browser-verified: 8
distinct spares consumed with zero repeats, button disables exactly at exhaustion. (2) **Continue the
pose** — a new off-flow `freedraw` screen reached from the Summary recap: the last reference held
full-screen, no timer, no HUD, Esc/exit → Setup. Reads `session.currentImage`, which the store already
keeps on the pose it ended on, so no runtime change was needed. Rationale: the "keep drawing
indefinitely" want the owner voiced for pause (2026-07-05) also applies at run's end. Folded into spec
§6. (3) **Setup FYI shows the full sequence** — replaced the bare "N poses" with the run's grouped shape
(`5× 1 min → 3× 2 min → …`) via a pure, tested `formatSequence` (collapses consecutive equal
durations); fits one line on desktop/iPad. (4) **Number fields select-on-focus** — tap-and-type
replaces the value outright (iPad friction the owner hit). (5) **Source cards 10% wider + filled-link
cue** — a scoped `--setup-col` override on `.sources` widens only the two source cards (the params panel
keeps the base width, inherited from `.screen`), and a Drive field with a value takes an accent-tinted
border/fill while an empty one dims, so a pasted link reads without clicking into the long URL.
Tradeoff/watch: the timing menu is now three buttons tall — parked a STATUS follow-up to eyeball its
spacing vs the mid-screen nav arrow on short (phone/iPad-landscape) viewports. Gate green — 182 tests,
typecheck, lint.

2026-07-05 — **Pause stops the clock without touching the pose; the pill reads "PAUSED" + time.**
Context: dogfooding, the owner wanted pause to double as an open-ended "keep drawing" mode — no dim, no
overlay competing with the reference. Concern: the interim Session-G treatment (2026-07-03) veiled the
pose at 44% bg and floated a large glass pause badge, which fights that use. Decision: drop the
`.veil.paused` wash + `.pause-badge` entirely — the reference renders untouched while stopped — and move
the paused state into the countdown pill, which now reads `PAUSED 0:26` (label + frozen time, built as
one derived string so the separator survives Svelte's template-whitespace trim; the pill takes neutral
glass via a `.clock.paused` letter-spacing bump). The pace glows were already correct: `band` is gated on
`phase === 'running'`, so both the edge-vignette `.cue-glow` and the pill's pace tint go null the instant
you pause — browser-confirmed, no change needed. Tradeoff: no at-a-glance "is it paused?" signal from
across the room anymore (the badge was bold); accepted — the pill label is unambiguous and the whole point
is an undisturbed pose. Supersedes the pause-veil half of the 2026-07-03 Session-G chrome decision; the
Esc-ends / glass-clock / nav-arrow parts of that decision still stand. Verified end-to-end in-browser
(pause → pose fully visible, pill `PAUSED 0:26`, zero glow; resume → live `0:23` with green tint back).

2026-07-04 — **Cloudflare deploy config landed; subpath by build layout, SPA fallback dropped.**
Context: the ☁️ companion track (`deploy-notes.md`) — get Gestures shippable to
`andreitim.com/apps/gestures/` on Workers Static Assets. Two build-level calls came out of it. (1)
**Subpath mapping via layout, not code.** Static Assets serves a file by matching the request path
against the asset folder, so the `/apps/gestures/` prefix has to exist on disk; a single
`SUBPATH = 'apps/gestures'` const in `vite.config.ts` drives both `base` and `build.outDir`
(`dist/apps/gestures`), and wrangler serves `./dist`, giving a 1:1 request→file match. Rejected the
alternative — a prefix-stripping Worker — because it adds server code the deploy-notes "static now"
decision rules out, for no gain. (2) **`not_found_handling: "none"`, reversing the earlier
`single-page-application` intent.** Local `wrangler dev` proved SPA fallback is inert at a subpath: it
serves the assets-*root* `index.html`, which doesn't exist (ours is nested), so unknown paths 404
either way. And the app has no client-side routing (no History API / `location` use), so refreshes
always hit `/apps/gestures/` → real index; there are no deep links to fall back for. Concern: config
that claims a behavior it doesn't deliver. Decision: turn fallback off (honest 404s), and add a
dist-root `index.html` copy only if in-app routing ever lands. Tradeoff: the day routing appears
(plausibly M3 timeline/review views) we must remember to restore the fallback + root-index copy —
noted in both `wrangler.jsonc` and `deploy-notes.md`. The first production deploy itself
(`wrangler login` → `pnpm deploy`) is the owner hand-off; not run this session.

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
Full design: `docs/folder-picker-permission-2026-07-04.md`. Worth a line in spec §9 at the next spec pass.

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

2026-07-03 — **Folder picker reverted to webkitdirectory — showDirectoryPicker silently drops
odd-named files.** Context: the same-day decision to prefer `showDirectoryPicker()` for its accurate
"view files" prompt. Finding on the owner's real library: a folder of 1085 jpgs with mojibake filenames
(valid UTF-8, but full of nbsp U+00A0 / soft-hyphen U+00AD / combining marks) loaded **0 images** — Chrome
filters such names out *before* handing the directory handle to JS, so the async iterator yields nothing
with no error and no way to recover in code (webkitdirectory read all 1085 fine; other clean-named folders
worked via either path). Decision: revert to `<input webkitdirectory>` as the sole picker, keep the
"nothing is uploaded" reassurance line, and delete the `showDirectoryPicker`/`collectFiles` path
(`directory.ts` + its tests). Rationale: silent, undetectable partial/total file loss is unacceptable for
a reference library; the API's only win was a cosmetic prompt, and the reassurance line already softens the
webkitdirectory warning for this single-user tool. Tradeoff: the scary "upload all files" prompt returns;
accepted — completeness and honesty beat a nicer dialog. Supersedes the earlier same-day picker decision.

2026-07-04 — **M1 Drive read (Tier 1): recursive subfolder walk, keyless thumbnail display, key inlined
via gitignored `.env`.** Context: M1 — public-folder Drive read so the iPad path works (local folder-picking
is desktop-only). The S1 spike against the owner's real "Refs" folder settled three things. (1) **Recursive
listing, not flat.** Spec §3 originally scoped v1 to "one flat folder," but "Refs" holds only *category
subfolders* (Martial arts, Comics, Turnaround M/F → 2686 images across 5 folders), and the **local**
drop-folder source already recurses — a flat Drive lister would be inconsistent and list 0 images at the
top. Decision: BFS-walk the folder + subfolders (`'PARENT' in parents`, folders enqueued, files
accumulated), cycle-safe via a visited-id set + a defensive `MAX_FOLDERS` cap; sharing "anyone with the
link" cascades read access to the whole subtree, so one link lights up the library. Owner confirmed.
Tradeoff: a handful more `files.list` calls and a scope nudge past "flat v1"; accepted (spec §3 revised).
(2) **Display via `drive.google.com/thumbnail?id=…&sz=w1600`** — keyless, public, no expiry (the list
response's `thumbnailLink` is short-lived), verified rendering at 1600×2400. (3) **One app-owned API key**,
referrer-restricted (`andreitim.com/*` + `localhost:5173/*`) and Drive-API-restricted, supplied via a
gitignored `.env.local` and **inlined into the public bundle** by Vite — not a secret in the OAuth sense;
the referrer lock is the protection. No user ever creates a key; visitors only share a public folder.
Architecture: `SourceImage` moved to framework-free `images.ts` (was in the `.svelte` store — a backwards
lib→state dep); the store gained `loadRemote` (adopts a remote list, revokes only `blob:` URLs); a
persisted `driveLink` remembers the last folder; `RemoteInput.svelte` is the paste UI (a working Drive
row plus **Box/Dropbox placeholder rows** for future providers, spec §3 ImageSource abstraction), laid
side-by-side with the local picker in Setup with aligned headers + equal-height areas; the shared bold
"Folder picked up successfully…" count lives once in Setup. Pure parsing/URL/mapping + the injected-fetch walk are
node-tested (`drive.test.ts`); full flow browser-verified locally (2686 loaded, session renders Drive
refs, prefetch + cross-category mixing clean, no console errors). Gate green — 164 tests, typecheck, lint.

2026-07-04 — **Creative direction: ship three themes as a user switch, not a single locked pick.**
Context: the 🎨 creative-direction track (spec §14) — originate the design system, then restyle M0. Round-1
compared five directions (real chrome per palette, in an Artifact); owner liked ①Moonlit ②Candlelit
④Sanguine and asked to make them user-pickable rather than lock one. Decision: originate a semantic token
system as the mechanism — every colour is a token in `src/app.css` (the one canonical home for the
numbers; components read tokens only), three palettes ship as `[data-theme]` sets, and the settings store
mirrors a persisted `theme` field onto the root (applied at module load → no first-paint flash, plus
reactively → live-preview). Owner's calls: **Candlelit default**, **Setup-only** picker, **icon-only**
swatch pills (moon/flame/chalk glyphs + accessible names). Intent + taste-queue live in
`gestures-creative-direction.md` (map, not copy — points at `app.css` for hex). ③Neutral-jewel and
⑤Twilight-ember explored and parked (not killed). Tradeoff: three palettes to maintain vs one, accepted —
the token layer made it near-free and it doubles as the tool-family kit. Rationale for tokens-as-switch:
the restyle work (define tokens once) and the switch (define three sets) are the same work.

2026-07-04 — **In-session chrome: one vertical icon menu + decoupled Exit; pace cue extended to the
canvas backdrop.** Context: owner dogfooded the morning session and asked for two refinements, taken as
separate commits after the theming. (1) Collapse the two-corner HUD button stacks into a single vertical
glass icon-only menu at the bottom-left (nothing on the right but the directional nav arrow); label +
hotkey move into each button's tooltip; Exit pulled out to a standalone glass disc top-left so
run-ending reads as its own gesture, apart from the per-pose tools. (2) Cast the green→red pace cue as a
pointer-events-none inset edge glow over the canvas backdrop / around the pose (centre clear, ramps with
the same `band` + `--pace-*` tokens as the pill, off on rest/end) so the whole frame — not just the
clock — signals time. Nav arrows deliberately left two-sided for now (parked as a STATUS follow-up).

2026-07-04 — **Setup polish (same session): themed form controls + entry copy/width.** Two small
follow-on passes after dogfooding the restyled Setup. (1) The `<select>` and number fields leaked native
browser chrome that clashed with the palette (blue focus ring, cramped spinner arrows, untinted dropdown
arrow); replaced with an accent focus ring on any focus, a CSS select chevron in `--fg-muted`, hidden
native number spinners (values are typed; Quick keeps presets), and an `accent-color` checkbox — the
controls now read as one themed set. (2) Added a one-sentence warm explainer under the title (what/why),
folded the "…to begin" nudge into the picker button and removed the redundant standalone hint, and matched
the params panel to the folder-picker width via a shared `--setup-col` set on the Setup screen and
inherited by FolderInput (custom-property cascade crosses the component boundary — no magic-number
duplication).
