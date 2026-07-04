# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** ☁️ **Cloudflare deploy track landed — Gestures is live** at
  `https://andreitim.com/apps/gestures/` (Workers Static Assets, spec §14). What shipped: `wrangler.jsonc`
  (static-only — no `main` Worker; assets from `./dist`; route `andreitim.com/apps/gestures/*`;
  `not_found_handling: "none"` — no client routing so unknown paths honestly 404); Vite `outDir` nests the
  build under `dist/apps/gestures/` so the disk tree matches the served subpath 1:1 (one `SUBPATH` const
  drives both `base` and `outDir`); `pnpm deploy` / `pnpm cf:preview` scripts; `wrangler` devDep (+ pnpm
  `allowBuilds` for workerd/esbuild). `deploy-notes.md` rewritten from intent → step-by-step setup guide.
  Owner ran the first production deploy; DNS needed a **proxied apex placeholder** (`AAAA @ → 100::`) to
  pull traffic onto the edge — the missing piece behind the initial NXDOMAIN. Config + subpath choices
  logged in `docs/decisions.md` (2026-07-04).
- **Next step:** **M1 — Drive read** (Tier 1, public folder link; spec §13). Milestone start — lay out the
  M1 step ledger in STATUS at session-start, then agree Scope + Definition-of-done before editing.
- **Verify:** live — `curl https://andreitim.com/apps/gestures/` → **200** (app HTML); bare root `/` → 522
  is expected (no route/origin there). Gate green — **144 tests, typecheck, lint** (2026-07-04).
  `wrangler deploy --dry-run` validates the config; `pnpm cf:preview` (local workerd) serves the subpath.

## Milestones
Sequenced order (spec §13). Companion tracks 🎨/☁️ are interleaved deliverables, not milestones — content
in `gestures-spec.md` §14.

| | Deliverable | State |
|---|---|---|
| — | Dev setup pass (skeleton, repo, rituals) | ✓ |
| M0 | Delightful core — local-folder source, session engine, in-session helpers | ✓ |
| 🎨 | Creative-direction session — originate design system, then restyle M0 (§14) | ✓ (taste-queue open) |
| ☁️ | Cloudflare setup guide + first deploy (§14; Workers Static Assets — `docs/deploy-notes.md`) | ✓ (live) |
| M1 | Drive read (Tier 1, public folder link) | ☐ |
| M2 | Drive write / capture (Tier 2, `drive.file`) | ☐ |
| M3 | Review composites + dated timeline | ☐ |

Full roadmap, sequencing rationale, and each item's contents: `gestures-spec.md` §13 (roadmap) · §14
(companion tracks).

## Follow-ups
Discovered out-of-scope work, parked one line each: `- [ ] <what> — spawned in <step> (yyyy-mm-dd)`.

- [ ] Bare root `andreitim.com/` returns 522 — add a redirect rule (→ `/apps/gestures/`) or a landing page — spawned in deploy track (2026-07-04)
- [ ] `www.andreitim.com` alias — proxied `www` record + redirect rule to apex (params drafted in chat, not yet confirmed applied) — spawned in deploy track (2026-07-04)
- [ ] Promote the proxied-apex-record to an explicit numbered prerequisite step in `deploy-notes.md` (it bit the first deploy even with the zone already on Cloudflare) — spawned in deploy track (2026-07-04)

M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
