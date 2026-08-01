# History

Archived step ledgers of finished milestones. `docs/STATUS.md` holds only the active milestone;
completed ones are groomed here at milestone finish (`CLAUDE.md` → Work cadence).

## Dev setup pass — done
- [x] 1 — Scaffold Vite + Svelte 5 + TS base
- [x] 2a — Ondalu code subset + tooling (typecheck/lint/test/build all green; base path + `@/` alias verified)
- [x] 2b — Process docs + rituals (CLAUDE.md, docs/, `.claude/commands/`)
- [x] README replaced with a map-style front page
- [x] 4 — Husky pre-push gate (`test && lint && typecheck`; no pre-commit; failing check blocks push — proven)
- [x] 5 — Git authorship (`andreitim`) + init + first commit + public repo `andrei-timber/gestures` (default branch `main`)

## M0 — Delightful core — done (2026-07-03)
Local-folder source, session engine, in-session helpers (`gestures-spec.md` §5–6, §13). Ordering logic:
A is the tested foundation; B wraps it in reactive stores; C makes it runnable end-to-end; D is the
drawing loop; E–F layer helpers one key at a time; G is the finishing feel.

**Session A — engine logic** (pure, framework-free · vitest)
- [x] 1 — Class-mode distribution: `distribute(N)` → per-pose seconds via geometric halving (§5 `c1/c2/c3`). Verify: N=10→26m, N=16→46m, N=20→55m.
- [x] 2 — Health caps + N clamp: ≤90 min active, ≤3 ten-min poses, ceiling helper. Verify: N=30→3×10m/81m, over-ceiling clamps.
- [x] 3 — Quick-mode plan: N + uniform interval → per-pose seconds. Verify: uniform arrays, custom-minutes.
- [x] 4 — Total-time FYI: active-sum + rests → total. Verify: matches §5 totals incl. rests.
- [x] 5 — Pose order: shuffle, no within-session repeats, RNG injected. Verify: permutation, deterministic under seed.

**Session B — reactive state** (`src/state/*.svelte.ts`)
- [x] 6 — Settings store: reactive settings + remember-last (localStorage). Verify: vitest load/save; §5 defaults.
- [x] 7 — Session runtime store: state machine idle→running→paused→ended, index/remaining/tick. Verify: vitest with fake clock.

**Session C — shell, source, setup** (UI · browser-verify)
- [x] 8 — App shell: static shell + screen switch (Setup ↔ Session ↔ Summary).
- [x] 9 — Local-folder source: folder/file input, filter `.jpg/.png/.webp`, emit image list. Verify: real folder, count/filtering.
- [x] 10 — Setup screen: mode toggle, param inputs, live total-time FYI, Start (wires 6 + 1–4).

**Session D — slideshow runtime** (UI · browser-verify)
- [x] 11 — Slideshow view: full-bleed image, "pose N of M", auto-advance (wires 7 + 5 + `pick.ts`). Also caps effective N at pool size (closes the FYI-overstatement follow-up).
- [x] 12 — Rest slide: dim "Rest" pause between poses, reference faint behind (runtime interleaves rests; no rest after the final pose).
- [x] 13 — Calm countdown: `formatClock` m:ss, tabular/faint at bottom-centre, dims during rests.
- [x] 14 — End summary: calm recap (pose count + total time), New session → setup. (Later made truthful for early-end: reads actual `elapsed` + `posesDrawn` — see follow-ups.)

**Session E — helpers I** (each decoupled · one key · browser-verify)
- [x] 15 — Keyboard dispatcher + pause/resume: `space`, keeps reference on screen (base handler). `<svelte:window>` keymap; space toggles running↔paused with a faint "Paused" veil over the held reference.
- [x] 16 — Prev / next: `←` / `→`. Runtime `next()`/`prev()` (tested) + faint side arrow buttons landed in Session D; step 16 added the `←`/`→` key binding on the step-15 keymap.
- [x] 17 — Extend / add-time: `+` (and unshifted `=`) on current pose. Runtime `addTime()` bumps the live clock (+30s, `ADD_TIME_SECONDS`), works running or paused, inert during rests / idle / ended.

**Session F — helpers II** — all three are per-pose sanity checks that reset on every pose change
(never session-wide, spec §6); they compose and share one `aids` object in the runtime.
- [x] 18 — Mirror H / V: `m` / `v` (CSS transform; H and V compose). Runtime `toggleMirrorH/V` + tests.
- [x] 19 — Grayscale: `g` (CSS `grayscale(1)` filter). The headline value-check craft feature.
- [x] 20 — Grid / line-of-action overlay: `r` — 9×9 lattice hairlines. Spans the viewport, not the letterboxed image bounds (tightening to the image rect was considered and **dropped** 2026-07-03 — good enough). Line-of-action variant deferred.

**Session G — cues & polish**
- [x] 21 — Gentle end cue: the countdown warms to a calm amber + soft glow over the last ~3s of an active pose (gated `running && !resting && 0<rem≤3`; never on rests/pause/final handoff). Visual-only — the soft beep was dropped by choice (owner, 2026-07-03). Interim amber literal; 🎨 pass formalises the token.
- [x] 22 — Shortcuts help: satisfied by the always-on inline legend beside the pose counter (view aids) and End (timing/nav keys), landed in the Session-E polish — deemed sufficient; no separate help panel.

Some Session-G chrome polish was pulled forward during Session E (glass chrome, pause icon, Esc-to-end,
inline legend); the glass treatment is interim pending the 🎨 creative-direction pass. See `decisions.md`.

## M1 — Drive read (Tier 1) — done (2026-07-04)
Public folder link → API-key `files.list` (recursive) → slideshow (`gestures-spec.md` §3/§13). Enables
the iPad path (local folder-picking is desktop-only). One app-owned, referrer-restricted key authenticates
the app to Google; visitors only share a folder "anyone with the link." Decisions & S1-spike findings in
`docs/decisions.md` (2026-07-04); spec §3 revised (recursion supersedes the original "flat v1").
- [x] 1 — API-key walkthrough (owner) + **S1 spike**: confirmed an anyone-with-link folder lists via API
      key only (private→404, shared→200); display URL settled (`drive.google.com/thumbnail?id=…&sz=w1600`,
      keyless, 1600×2400); Shared-Drive / `resourceKey` handling wired defensively.
- [x] 2 — Drive source module (`src/lib/source/drive.ts`, node-tested): parse link → `folderId`
      (+`resourceKey`); **recursive BFS walk** (cycle-safe visited set + `MAX_FOLDERS` guard); filter
      jpg/png/webp; map to `{name, url}` via the keyless thumbnail URL.
- [x] 3 — Store: `SourceImage` moved to framework-free `images.ts`; `source.loadRemote` adopts a remote
      list, revokes only `blob:` URLs.
- [x] 4 — UI: `RemoteInput.svelte` paste input (working Drive row + Box/Dropbox **SOON** placeholders),
      side-by-side with the local picker under one centered prompt; loading / error states, remembered
      link; shared bold "Folder picked up successfully…" count in Setup.
- [x] 5 — Config: `VITE_GOOGLE_DRIVE_API_KEY` via gitignored `.env.local` (+ `.env.example`), inlined at
      build; documented in `docs/deploy-notes.md`.
- [x] 6 — Verified on iPad against the live deploy (Version `8710473c`): pasted the Refs link → "2686
      images loaded" → full session ran. Owner-confirmed 2026-07-04.

Real-library shape drove the recursion call: the owner's "Refs" holds only category subfolders
(2686 images across 5 folders), and the local drop-folder source already recurses. Gate at close:
164 tests, typecheck, lint; commit `10e0f32`.

### M0 resolved follow-ups (2026-07-03)
Discovered-and-closed during M0 and its follow-up sweep. Design/decision detail lives in `decisions.md`
and the linked design notes; kept here as a one-line ledger.
- [x] Align `@types/node` with Node 22 + bump Vite 8.1.2→8.1.3 (Vite template pulled v24) — spawned step 2a.
- [x] Extract shared session limits (`MIN_POSES`, `MAX_ACTIVE_SECONDS`) into `session/limits.ts` (`MAX_TEN_MIN_POSES` stays in `caps.ts`, Class-only) — spawned step 3.
- [x] Setup number inputs degraded the FYI when cleared — pure blur-clamps in `settings.ts`. Poses/Rest already self-heal (Svelte 5 empty→null→0→floored); **custom-minutes** was the real offender.
- [x] Setup FYI: effective N caps at pool size when the folder holds fewer images ("limited by folder") — closed in step 11.
- [x] End recap reported the *planned* run — runtime now accumulates actual `elapsed` (in `tick`) + a `posesDrawn` selector; summary reads both (equal the plan on a full run).
- [x] Window-prefetch pose decodes for instant swaps — `src/lib/source/preload.ts` (pure `prefetchWindow` + browser-only `warm`/`decode`; `$effect` on `session.index`; Setup pre-warms the opening frame). Design: `docs/prefetch-window.md`.
- [x] Folder-pick "upload thousands of files" dialog — tried `showDirectoryPicker()`, **reverted** to `<input webkitdirectory>` + reassurance line (the API silently drops odd-named files). Design + finding: `docs/folder-picker-permission-2026-07-04.md`.
- [x] Grid overlay (`r`): rule-of-thirds → 9×9 lattice in bright light blue, legible over white refs.
- [x] Session HUD legend split so neither cluster crosses the reference (view aids left, timing/nav right, wraps as the window narrows).
- [x] End / `Esc` left the 1s interval ticking — pure `end()` transition + store command that stops the timer; `endSession()` routes through it.
- [x] Session-G chrome polish pulled forward during Session E (interim `.glass` pill for clock/arrows, glass pause icon, Esc-to-end, inline legend); 🎨 pass formalises the tokens.
- [x] Class mode floored the count to `MIN_POSES` *after* Setup's pool cap (blank slides on a <10-image folder) — Class now needs ≥10 images and falls back to Quick; `buildPlan`'s `poolCap` can pull Quick below `MIN_POSES`.

## M2 — Capture (Tier 2 Drive write) — done (2026-08-01)
Drive write behind the GIS `drive.file` token model (`gestures-spec.md` §3/§7/§13). Box + Dropbox read was
the original slice (b) — **parked 2026-07-08** (both need a server-side app token → a Worker; owner cut
them, §3 + `decisions.md`), so M2 shipped as Drive write only. **Closed 2026-08-01 with a4/a5 skipped by
the owner** — the capture path works end to end and the app is in its intended state; see `decisions.md`.

**Spike:**
- [x] S2 — **download-bytes → `files.create`** proven under `drive.file`: byte-exact round-trip (md5
      match), root-folder create works, and can parent into the user's *own* existing folder. Spike
      content cleaned up. (2026-07-08)
- [—] S3 / S4 (Box / Dropbox) — **not run; parked** with slice (b).

**Slice (a) — Drive write. End-screen "Log session" UX (spec §7).**
- [x] a1 — Auth + folder + notes (2026-07-08). GIS sign-in (`drive-auth.ts`: token cache/expiry pure +
      node-tested; GIS glue guarded), write helpers (`drive-write.ts`: find-or-create folder, multipart
      upload, node-tested w/ injected fetch), reactive `capture.svelte.ts`, and the **Log session** panel
      on Summary (disclaimer + Free-form Notes textarea) → creates `Gestures Sessions/<date>/` + writes
      `notes.txt`. Config `VITE_GOOGLE_OAUTH_CLIENT_ID`. Gate: 205 tests. Commits `ba531ca`, `2f3e456`.
- [x] a2 — Ordered session references `Ref_1…N` copied into the dated folder (2026-07-08). CORS probe:
      `drive.google.com/thumbnail` bytes are **CORS-blocked**, only `lh3.googleusercontent.com/d/<id>` is
      readable → **folded in a5's lh3 display switch** (`driveImageUrl` → lh3, one URL serves display +
      byte-copy). `copyReferenceImages` (bounded pool of 5, best-effort per-image skip, position-tied
      `Ref_NN.<ext>`), `session.images` exposed, `capture.log(notes, images)`, `createSessionFolder`
      (per-session `<date>[-N]` folder, cached id), per-recap `capture.newSession()` reset. Local refs copy
      full-quality; Drive refs are the w1600 lh3 render. Gate: 218 tests. Commit `99f40bc`.
- [x] a3 — **PSD upload → paired composites** (2026-08-01). Scope revised mid-session (owner): the
      drawings arrive as the session `.psd` (one `Layer <n>` per pose, hidden flag ignored, `Background`
      excluded) and **only the pair is saved**, never the bare drawing — so M3's composite *render* landed
      here. `capture/psd.ts` (lazy `ag-psd`, layer selection pure + node-tested), `capture/composite.ts`
      (pure geometry node-tested, canvas draw browser-verified), `capture/report.ts`, `copySessionFiles`
      (ref copy + pair build off **one** byte read). Browser-verified against the real 57 MB PSD — 11/11
      layers in 1.4 s, pair 2800×1400 at 156 KB, margins 210 px, seam gap 169 px vs 165 expected. Gate:
      259 tests. Commits `0a5e182`, `535c3ff`; deployed as Version `688d42ab`.
- [—] a4 — Reconcile the Setup copy ("Files stay in your browser — nothing is uploaded" is true for
      reference loading but not for opt-in capture). **Skipped** at M2 close; re-parked as a follow-up in
      STATUS — it only matters if capture is ever opened beyond the owner.
- [—] a5 — **Display robustness.** Its lh3 display-URL half shipped in a2 (the CORS probe forced it); the
      remaining **503/429 retry-with-backoff** on image load was **skipped** — the 2026-07-08 throttle
      cleared on its own and it was only insurance against a next one. Re-parked as a STATUS follow-up.

*(Google-Picker "Change folder…" destination stays a P1 fast-follow — spec §7.)*

## M3 — Review surface + dated timeline — done/closed (2026-08-01)
Closed **without an in-app build** (owner's call). Its composite *render* had already shipped early in M2
a3, so what remained was only the browse surface — and the owner reviews sessions directly in Google Drive
(the dated `Gestures Sessions/<date>/` folders already are the timeline) plus offline scripts. Building an
in-app viewer would have duplicated a workflow that already works. Rationale in `decisions.md`
(2026-08-01).
