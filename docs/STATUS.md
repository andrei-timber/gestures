# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** 🎨 **creative-direction track landed.** Design system originated —
  `gestures-creative-direction.md` (intent + taste-queue) with the canonical token layer in
  `src/app.css`; interim `.glass` + colour literals replaced by semantic tokens (components read tokens
  only). Shipped **three dark themes as a user switch** (not a single locked pick): Moonlit · Candlelit
  (default) · Sanguine, chosen on Setup via an icon-only swatch picker, persisted, live-repainting. Plus
  two dogfood follow-ups the owner asked for: **HUD collapsed into one vertical icon menu** (Exit
  decoupled to top-left) and the **pace cue cast as a canvas-backdrop glow** (green→red edge vignette).
  Two more Setup-polish commits closed the loop: **form controls themed** (accent focus ring, custom
  select chevron, native spinners dropped, accent checkbox) and an **entry-copy/width pass** (warm
  one-line explainer, nudge folded into the picker button, params panel matched to the picker width).
- **Next step:** **☁️ Cloudflare deploy** (the other companion track — §14; Workers Static Assets,
  `docs/deploy-notes.md`) to get it live, then **M1 Drive read**. No milestone ledger to lay out until
  M1. Agree scope at session-start.
- **Verify:** gate green — **144 tests, typecheck, lint** as of 2026-07-04 (settings gained a `theme`
  field + parse coverage). Browser-verified: theme switch stamps `data-theme`, re-tints tokens, persists
  across reload with no flash; new HUD icons/tooltips + active-aid tint; pace glow ramps per band and is
  off on rest. Design taste-queue (typeface, ramp tuning, in-session switch, parked themes) lives in
  `gestures-creative-direction.md`.

## Milestones
Sequenced order (spec §13). Companion tracks 🎨/☁️ are interleaved deliverables, not milestones — content
in `gestures-spec.md` §14.

| | Deliverable | State |
|---|---|---|
| — | Dev setup pass (skeleton, repo, rituals) | ✓ |
| M0 | Delightful core — local-folder source, session engine, in-session helpers | ✓ |
| 🎨 | Creative-direction session — originate design system, then restyle M0 (§14) | ✓ (taste-queue open) |
| ☁️ | Cloudflare setup guide + first deploy (§14; Workers Static Assets — `docs/deploy-notes.md`) | ☐ |
| M1 | Drive read (Tier 1, public folder link) | ☐ |
| M2 | Drive write / capture (Tier 2, `drive.file`) | ☐ |
| M3 | Review composites + dated timeline | ☐ |

Full roadmap, sequencing rationale, and each item's contents: `gestures-spec.md` §13 (roadmap) · §14
(companion tracks).

## Follow-ups
Discovered out-of-scope work, parked one line each: `- [ ] <what> — spawned in <step> (yyyy-mm-dd)`.

- [ ] Nav arrows still sit on both edges (prev left / next right) — the HUD "buttons on one side" pass
  left them directional; decide whether to fold next-arrow leftward too or keep it — spawned in HUD
  redesign (2026-07-04)

M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
