# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** M0 (Delightful core) is **in progress**, broken into 22 small decoupled steps across
  Sessions A–G (ledger below). Each step is one shippable change; steps 1–7 are pure-logic (vitest),
  8+ are browser-verified UI. Sessions A–D (steps 1–14) are **done**, and Session E has started —
  step 15 (keyboard dispatcher + `space` pause/resume) landed. Prev/next runtime + faint side arrows
  also landed early (step 16's core — see below).
- **Next step:** Session E, step 16 — bind `←` / `→` to prev/next on the step-15 keymap (the runtime
  `next()`/`prev()` + side arrows already exist; only the key binding remains — one-line keymap
  additions). Verify: browser — start a session, press `←`/`→`, confirm the pose steps back/forward.
- **Verify:** per step below — logic under vitest, UI browser-verified.

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
- [ ] 16 — Prev / next: `←` / `→`. **Core done early:** runtime `next()`/`prev()` (tested) + faint side arrow buttons landed in Session D; only the `←`/`→` key binding remains (add on the step-15 dispatcher).
- [ ] 17 — Extend / add-time: `+` on current pose.

**Session F — helpers II**
- [ ] 18 — Mirror H / V: `m` / `v` (CSS transform).
- [ ] 19 — Grayscale: `g` (CSS filter).
- [ ] 20 — Grid / line-of-action overlay: `r`.

**Session G — cues & polish**
- [ ] 21 — Gentle end cue: soft beep last ~3s + subtle visual.
- [ ] 22 — Shortcuts help: documented, discoverable key legend.

Finished milestones' ledgers live in `docs/history.md` (Dev setup pass ✓).

## Milestones
| | Milestone | State |
|---|---|---|
| — | Dev setup pass (skeleton, repo, rituals) | ✓ |
| M0 | Delightful core — local-folder source, session engine, in-session helpers | ☐ |
| M1 | Drive read (Tier 1, public folder link) | ☐ |
| M2 | Drive write / capture (Tier 2, `drive.file`) | ☐ |
| M3 | Review composites + dated timeline | ☐ |

Full roadmap and each milestone's contents: `gestures-spec.md` §13.

## Follow-ups
Discovered out-of-scope work, parked one line each: `- [ ] <what> — spawned in <step> (yyyy-mm-dd)`.

- [ ] Align `@types/node` with Node 22 (the Vite template pulled v24) and bump the Vite 8.1.2→8.1.3 patch — spawned in step 2a (2026-07-03); low priority.
- [ ] Extract shared session limits (`MIN_POSES`, `MAX_ACTIVE_SECONDS`) out of `caps.ts` into `session/limits.ts` — do it when a third consumer appears (`quick.ts` already imports them) — spawned in step 3 (2026-07-03); low priority.
- [ ] Setup: clearing the Poses (or custom-minutes) number input writes NaN → empty plan / "0 min" FYI until refilled; self-heals on reload (parse rejects NaN). Add a min-clamp on blur/input — spawned in step 10 (2026-07-03); low priority.
- [x] Setup FYI: effective N caps at pool size when the folder has fewer images than requested — reflected in the FYI ("limited by folder") — done in step 11 (2026-07-03).
- [ ] End recap reports the *planned* run (pose count + total time); ending early via the End button overstates it. Track actual poses drawn / time elapsed if we want a truthful early-end recap — spawned in step 14 (2026-07-03); low priority.
- [x] Class mode floored the pose count to `MIN_POSES` (10) *after* Setup capped it to the folder size, so a Class run on a <10-image folder played 10 poses against 4 images (blank slides past the pool) — resolved: Class now requires ≥10 images and falls back to Quick with a note; `buildPlan`'s `poolCap` can pull the count below `MIN_POSES` so Quick runs a folder-limited session (spec §5 · `decisions.md`) — spawned in step 15, fixed 2026-07-03.
