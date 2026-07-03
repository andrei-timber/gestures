# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** Dev-setup pass is **complete** — skeleton, tooling, rituals, pre-push gate, and the public
  GitHub repo are all in. Next up is M0, the first product milestone.
- **Next step:** Start M0 (Delightful core) — local-folder source, session engine, in-session helpers.
  Agree the M0 slice + definition-of-done at session-start before editing. Contents: `gestures-spec.md` §13.
- **Verify:** TBD per M0 slice — logic under vitest, UI browser-verified.

### Dev setup — steps
- [x] 1 — Scaffold Vite + Svelte 5 + TS base
- [x] 2a — Ondalu code subset + tooling (typecheck/lint/test/build all green; base path + `@/` alias verified)
- [x] 2b — Process docs + rituals (CLAUDE.md, docs/, `.claude/commands/`)
- [x] README replaced with a map-style front page
- [x] 4 — Husky pre-push gate (`test && lint && typecheck`; no pre-commit; failing check blocks push — proven)
- [x] 5 — Git authorship (`andreitim`) + init + first commit + public repo `andrei-timber/gestures` (default branch `main`)

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
