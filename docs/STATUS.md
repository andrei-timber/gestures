# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** **M1 — Drive read (Tier 1) — done & live (2026-07-04), owner-verified on iPad.** Recursive
  public-folder read: paste a share link → API-key `files.list` walks the folder + subfolders → session
  renders the Drive references. Shipped in commit `10e0f32`, deployed Version `8710473c`. Ledger archived
  to `docs/history.md`; decisions + spec §3 revision logged. **M1 milestone closed.**
- **Since M1 (post-milestone polish, 2026-07-06):** owner-feedback batch shipped & redeployed — in-session
  **Refresh image** (`f`) + **Continue the pose** (no-timer free-draw from the recap), setup **FYI
  full-sequence** line, number-field **select-on-focus**, and **wider source cards + filled-Drive-link**
  cue. Spec §6 + decisions logged. Then a second-check round (redeploy Version `a1ab6b46`): tool buttons no
  longer stick **"pressed" after a tap** on touch (`@media (hover: hover)` gate), and **Continue the pose**
  now carries the **view-aids menu** (mirror/grayscale/grid; still no timing menu or pose count). Seven
  commits total, each self-contained. Not an M2 step.
- **Next step:** **M2 — Capture (Tier 2 Drive write) + Box/Dropbox read (spec §3/§7/§13).** Two slices:
  (a) GIS sign-in (`drive.file`) + session capture/upload; (b) **Box + Dropbox** public-folder read behind
  the existing `RemoteInput` SOON rows. ⚠ Box/Dropbox need an **app token** (no anonymous API-key list like
  Drive) — may want a tiny Worker (§3 auth wrinkle, §9). Milestone start — at the next session-start, lay
  out the M2 ledger, then agree Scope + DoD. Kicks off with **spikes S2 (Drive write) / S3 (Box) / S4
  (Dropbox)**. No code yet — plan-gate.
- **Verify:** live — `curl https://andreitim.com/apps/gestures/` → **200** (Version `a1ab6b46`,
  2026-07-06). Gate green — **182 tests, typecheck, lint**. M1 iPad run confirmed by owner (2026-07-04);
  the polish batch is desktop browser-verified — owner to spot-check the touch fixes on iPad (sticky-tap +
  free-draw aids).

## Milestones
Sequenced order (spec §13). Companion tracks 🎨/☁️ are interleaved deliverables, not milestones — content
in `gestures-spec.md` §14.

| | Deliverable | State |
|---|---|---|
| — | Dev setup pass (skeleton, repo, rituals) | ✓ |
| M0 | Delightful core — local-folder source, session engine, in-session helpers | ✓ |
| 🎨 | Creative-direction session — originate design system, then restyle M0 (§14) | ✓ (taste-queue open) |
| ☁️ | Cloudflare setup guide + first deploy (§14; Workers Static Assets — `docs/deploy-notes.md`) | ✓ (live) |
| M1 | Drive read (Tier 1, public folder link) | ✓ (live) |
| M2 | Capture (Tier 2 Drive write, `drive.file`) + Box/Dropbox read | ☐ |
| M3 | Review composites + dated timeline | ☐ |

Full roadmap, sequencing rationale, and each item's contents: `gestures-spec.md` §13 (roadmap) · §14
(companion tracks).

## Follow-ups
Discovered out-of-scope work, parked one line each: `- [ ] <what> — spawned in <step> (yyyy-mm-dd)`.

- [ ] Bare root `andreitim.com/` returns 522 — add a redirect rule (→ `/apps/gestures/`) or a landing page — spawned in deploy track (2026-07-04)
- [ ] Promote the proxied-apex-record to an explicit numbered prerequisite step in `deploy-notes.md` (it bit the first deploy even with the zone already on Cloudflare) — spawned in deploy track (2026-07-04)
- [ ] Drive-key **quota is shared across all users** — fine for a hobby tool; if `files.list` ever strains it, add caching or a tiny Worker proxy (spec §3) — spawned M1-1 (2026-07-04)
- [ ] Timing menu is now **three buttons tall** (pause/extend/refresh) — eyeball its spacing vs the mid-screen nav arrow on short viewports (phone/iPad-landscape); may need the split-rail math retuned — spawned polish batch (2026-07-06)

Resolved: `www.andreitim.com` alias — proxied `www` record + redirect rule → apex, verified 301 to
`/apps/gestures/` (2026-07-04).

M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
