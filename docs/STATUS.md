# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** M0 (Delightful core) is **complete and groomed** — its step ledger + resolved follow-ups are
  archived to `docs/history.md` and cleared from here. The follow-up sweep landed this session (dep
  alignment, `session/limits.ts`, Setup NaN blur-clamp, End/`Esc` timer-halt, truthful early-end recap,
  window-prefetch decodes, and the folder picker). The picker follow-up ended in a **reversal**:
  `showDirectoryPicker` silently drops odd-named files, so it's back on `<input webkitdirectory>` +
  reassurance line (found against the owner's real library — see `decisions.md`).
- **Next step:** Start a companion track — **🎨 creative-direction session** (originate the design system,
  then restyle M0; formalises the interim `.glass` + amber literals) or **☁️ Cloudflare deploy** (§14;
  Workers Static Assets — `docs/deploy-notes.md`). No new milestone ledger to lay out until M1. Agree
  scope at session-start; each has its own steps.
- **Verify:** baseline gate green — **133 tests, typecheck, lint** as of 2026-07-03 (the 3 removed tests
  were the reverted picker's `directory` helper). Follow-ups queue is now empty.

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

_Empty._ M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
