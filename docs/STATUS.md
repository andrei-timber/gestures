# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** Dev setup pass — skeleton, tooling, and rituals are in place; the pre-push gate and the
  Git/GitHub repo remain.
- **Next step:** Step 4 — wire the Husky pre-push gate (`test && lint && typecheck`, remove default
  pre-commit). Then Step 5 — set git `user.name` to `andreitim`, init the repo, first commit, create the
  public GitHub repo `gestures`, and hand over the Ondalu authorship instructions.
- **Verify:** after Step 4, `pnpm test && pnpm lint && pnpm typecheck` green and a failing check blocks
  `git push`; after Step 5, repo live at `github.com/andrei-timber/gestures` and `git log` shows author
  `andreitim`.

### Dev setup — steps
- [x] 1 — Scaffold Vite + Svelte 5 + TS base
- [x] 2a — Ondalu code subset + tooling (typecheck/lint/test/build all green; base path + `@/` alias verified)
- [x] 2b — Process docs + rituals (CLAUDE.md, docs/, `.claude/commands/`)
- [x] README replaced with a map-style front page
- [ ] 4 — Husky pre-push gate
- [ ] 5 — Git authorship + init + first commit + public GitHub repo (+ Ondalu instructions)

## Milestones
| | Milestone | State |
|---|---|---|
| — | Dev setup pass (skeleton, repo, rituals) | ◐ |
| M0 | Delightful core — local-folder source, session engine, in-session helpers | ☐ |
| M1 | Drive read (Tier 1, public folder link) | ☐ |
| M2 | Drive write / capture (Tier 2, `drive.file`) | ☐ |
| M3 | Review composites + dated timeline | ☐ |

Full roadmap and each milestone's contents: `gestures-spec.md` §13.

## Follow-ups
Discovered out-of-scope work, parked one line each: `- [ ] <what> — spawned in <step> (yyyy-mm-dd)`.

- [ ] Align `@types/node` with Node 22 (the Vite template pulled v24) and bump the Vite 8.1.2→8.1.3 patch — spawned in step 2a (2026-07-03); low priority.
