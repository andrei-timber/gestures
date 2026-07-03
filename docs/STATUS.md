# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** M0 (Delightful core) is **complete** — all 22 steps across Sessions A–G done. Session G
  closed it: step 21 (gentle end cue — countdown warms amber over the last ~3s, verified) and step 22
  (shortcuts help, satisfied by the always-on inline HUD legend). Also this session: removed the
  "Remember these settings" checkbox — remember-last is now always on (setup lean; spec §5 · `rememberLast`
  field dropped end-to-end).
- **Next step:** Work down the unresolved **Follow-ups** queue below (all low / nice-to-have) before any
  new track — triage them into do-now vs. keep-parked at session-start, then knock out the cheap ones.
  Candidate quick wins: Setup NaN-input clamp, grid-overlay image-bounds fit, End/`Esc` halting the 1s
  interval. Milestone grooming (archive M0 ledger → `docs/history.md`) and the 🎨 creative-direction
  session are **deliberately deferred** — don't start them until the follow-up sweep is done.
- **Verify:** per follow-up — logic under vitest, UI browser-verified. M0 baseline gate green
  (114 tests, typecheck, lint) as of 2026-07-03.

### M0 — step ledger (`gestures-spec.md` §5–6, §13)
Ordering logic: A is the tested foundation; B wraps it in reactive stores; C makes it runnable
end-to-end; D is the drawing loop; E–F layer helpers one key at a time; G is the finishing feel.

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
- [x] 14 — End summary: calm recap (pose count + total time via `session.totalSeconds`), New session → setup.

**Session E — helpers I** (each decoupled · one key · browser-verify)
- [x] 15 — Keyboard dispatcher + pause/resume: `space`, keeps reference on screen (base handler). `<svelte:window>` keymap; space toggles running↔paused with a faint "Paused" veil over the held reference.
- [x] 16 — Prev / next: `←` / `→`. Runtime `next()`/`prev()` (tested) + faint side arrow buttons landed in Session D; step 16 added the `←`/`→` key binding on the step-15 keymap.
- [x] 17 — Extend / add-time: `+` (and unshifted `=`) on current pose. Runtime `addTime()` bumps the live clock (+30s, `ADD_TIME_SECONDS`), works running or paused, inert during rests / idle / ended.

**Session F — helpers II** — all three are per-pose sanity checks that reset on every pose change
(never session-wide, spec §6); they compose and share one `aids` object in the runtime.
- [x] 18 — Mirror H / V: `m` / `v` (CSS transform; H and V compose). Runtime `toggleMirrorH/V` + tests.
- [x] 19 — Grayscale: `g` (CSS `grayscale(1)` filter). The headline value-check craft feature.
- [x] 20 — Grid / line-of-action overlay: `r` — rule-of-thirds hairlines. Spans the viewport, not the
  letterboxed image bounds (follow-up to tighten). Line-of-action variant deferred.

**Session G — cues & polish**
- [x] 21 — Gentle end cue: the countdown warms to a calm amber + soft glow over the last ~3s of an
  active pose (gated `running && !resting && 0<rem≤3`; never on rests/pause/final handoff). Visual-only —
  the soft beep was dropped by choice (owner, 2026-07-03). Interim amber literal; 🎨 pass formalises the token.
- [x] 22 — Shortcuts help: documented, discoverable key legend. Satisfied by the always-on inline
  legend beside the pose counter (view aids) and End (timing/nav keys), landed in the Session-E polish
  (2026-07-03) — deemed sufficient; no separate help panel needed.

Some Session-G chrome polish was pulled forward during Session E (glass chrome, pause icon, Esc-to-end,
inline legend) — see the Follow-ups entry + `decisions.md` (2026-07-03); the glass treatment is interim
pending the 🎨 creative-direction pass.

Finished milestones' ledgers live in `docs/history.md` (Dev setup pass ✓).

## Milestones
Sequenced order (spec §13). Companion tracks 🎨/☁️ are interleaved deliverables, not milestones — content
in `gestures-spec.md` §14.

| | Deliverable | State |
|---|---|---|
| — | Dev setup pass (skeleton, repo, rituals) | ✓ |
| M0 | Delightful core — local-folder source, session engine, in-session helpers | ✓ |
| 🎨 | Creative-direction session — originate design system, then restyle M0 (§14) | ☐ |
| ☁️ | Cloudflare setup guide + first deploy (§14; Workers Static Assets — `docs/deploy-notes.md`) | ☐ |
| M1 | Drive read (Tier 1, public folder link) | ☐ |
| M2 | Drive write / capture (Tier 2, `drive.file`) | ☐ |
| M3 | Review composites + dated timeline | ☐ |

Full roadmap, sequencing rationale, and each item's contents: `gestures-spec.md` §13 (roadmap) · §14
(companion tracks).

## Follow-ups
Discovered out-of-scope work, parked one line each: `- [ ] <what> — spawned in <step> (yyyy-mm-dd)`.

- [ ] Align `@types/node` with Node 22 (the Vite template pulled v24) and bump the Vite 8.1.2→8.1.3 patch — spawned in step 2a (2026-07-03); low priority.
- [ ] Extract shared session limits (`MIN_POSES`, `MAX_ACTIVE_SECONDS`) out of `caps.ts` into `session/limits.ts` — do it when a third consumer appears (`quick.ts` already imports them) — spawned in step 3 (2026-07-03); low priority.
- [ ] Setup: clearing the Poses (or custom-minutes) number input writes NaN → empty plan / "0 min" FYI until refilled; self-heals on reload (parse rejects NaN). Add a min-clamp on blur/input — spawned in step 10 (2026-07-03); low priority.
- [x] Setup FYI: effective N caps at pool size when the folder has fewer images than requested — reflected in the FYI ("limited by folder") — done in step 11 (2026-07-03).
- [ ] End recap reports the *planned* run (pose count + total time); ending early via the End button overstates it. Track actual poses drawn / time elapsed if we want a truthful early-end recap — spawned in step 14 (2026-07-03); low priority.
- [ ] Window-prefetch pose decodes for instant swaps — decode `index+1…index+N` (N≈2–3) ahead via `img.decode()`, side-effect layer only. Full design: `docs/prefetch-window.md` — spawned while exploring the source-load path (2026-07-03); nice-to-have.
- [ ] Folder pick shows a scary "upload thousands of files" browser dialog (`webkitdirectory` semantics — nothing is actually uploaded). Move to `showDirectoryPicker()` with a `webkitdirectory` fallback, plus a one-line "nothing is uploaded" reassurance. Full design: `docs/folder-picker-permission.md` — spawned while exploring the source-picker UX (2026-07-03); nice-to-have.
- [ ] Grid overlay (`r`) spans the full viewport, not the letterboxed image bounds — over a `contain`
  image with wide margins the thirds lines don't land on the drawing. Tighten to the rendered image rect
  (measure the contained bounds) if it proves distracting — spawned in step 20 (2026-07-03); low priority.
- [x] Grid overlay (`r`): rule-of-thirds → 9×9 lattice (3× finer) in bright light blue so it stays
  legible over white studio references — found in M0 testing, resolved 2026-07-03.
- [x] Session HUD legend split so it never crosses the reference: per-pose view aids (`m/v/g/r`) sit left
  by the pose counter, timing/navigation keys (space, arrows, `+`) sit right by End and wrap to multiple
  lines as the window narrows — found in M0 testing, resolved 2026-07-03.
- [ ] End / `Esc` navigate to the summary but don't stop the session's 1s interval — it keeps ticking in the background until the next `session.load()` clears it (harmless: summary reads planned totals, and Start always reloads). Have End/`Esc` also halt the clock if we ever read live elapsed time on the summary — spawned in step 16b/Esc-to-end polish (2026-07-03); low priority. Related: the early-end recap follow-up above.
- [x] Session-G chrome polish pulled forward during Session E (2026-07-03): glass-pill treatment for the clock + nav arrows (legible over bright refs), pause is now a large glass icon with the dim halved, `Esc` ends the run (End cues "(esc)"), and a one-line shortcut legend sits beside End. Glass is an **interim** `.glass` class in `Session.svelte` — the 🎨 creative-direction pass (spec §14) formalises the tokens and may restyle it; the legend partially satisfies step 22 (full shortcuts help still due). See `decisions.md`.
- [x] Class mode floored the pose count to `MIN_POSES` (10) *after* Setup capped it to the folder size, so a Class run on a <10-image folder played 10 poses against 4 images (blank slides past the pool) — resolved: Class now requires ≥10 images and falls back to Quick with a note; `buildPlan`'s `poolCap` can pull the count below `MIN_POSES` so Quick runs a folder-limited session (spec §5 · `decisions.md`) — spawned in step 15, fixed 2026-07-03.
