# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** M0 (Delightful core) is **in progress**, broken into 22 small decoupled steps across
  Sessions A–G (ledger below). Each step is one shippable change; steps 1–7 are pure-logic (vitest),
  8+ are browser-verified UI.
- **Next step:** Session A, step 1 — Class-mode distribution `distribute(N)`. Verify: spec examples
  N=10→26m, N=16→46m, N=20→55m (`pnpm test`).
- **Verify:** per step below — logic under vitest, UI browser-verified.

### M0 — step ledger (`gestures-spec.md` §5–6, §13)
Ordering logic: A is the tested foundation; B wraps it in reactive stores; C makes it runnable
end-to-end; D is the drawing loop; E–F layer helpers one key at a time; G is the finishing feel.

**Session A — engine logic** (pure, framework-free · vitest)
- [ ] 1 — Class-mode distribution: `distribute(N)` → per-pose seconds via geometric halving (§5 `c1/c2/c3`). Verify: N=10→26m, N=16→46m, N=20→55m.
- [ ] 2 — Health caps + N clamp: ≤90 min active, ≤3 ten-min poses, ceiling helper. Verify: N=30→3×10m/81m, over-ceiling clamps.
- [ ] 3 — Quick-mode plan: N + uniform interval → per-pose seconds. Verify: uniform arrays, custom-minutes.
- [ ] 4 — Total-time FYI: active-sum + rests → total. Verify: matches §5 totals incl. rests.
- [ ] 5 — Pose order: shuffle, no within-session repeats, RNG injected. Verify: permutation, deterministic under seed.

**Session B — reactive state** (`src/state/*.svelte.ts`)
- [ ] 6 — Settings store: reactive settings + remember-last (localStorage). Verify: vitest load/save; §5 defaults.
- [ ] 7 — Session runtime store: state machine idle→running→paused→ended, index/remaining/tick. Verify: vitest with fake clock.

**Session C — shell, source, setup** (UI · browser-verify)
- [ ] 8 — App shell: static shell + screen switch (Setup ↔ Session ↔ Summary).
- [ ] 9 — Local-folder source: folder/file input, filter `.jpg/.png/.webp`, emit image list. Verify: real folder, count/filtering.
- [ ] 10 — Setup screen: mode toggle, param inputs, live total-time FYI, Start (wires 6 + 1–4).

**Session D — slideshow runtime** (UI · browser-verify)
- [ ] 11 — Slideshow view: full-bleed image, "pose N of M", auto-advance (wires 7 + 5).
- [ ] 12 — Rest slide: optional dim/blank pause between poses.
- [ ] 13 — Calm countdown: unobtrusive per-pose time display.
- [ ] 14 — End summary: calm recap (poses, total time), return to setup.

**Session E — helpers I** (each decoupled · one key · browser-verify)
- [ ] 15 — Keyboard dispatcher + pause/resume: `space`, keeps reference on screen (base handler).
- [ ] 16 — Prev / next: `←` / `→`.
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
