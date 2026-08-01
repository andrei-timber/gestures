# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Mode: 🛠 maintenance (since 2026-08-01).** The roadmap is complete — M0, 🎨, ☁️, M1, M2 and M3 are all
  closed and live. There is no active milestone and no step ledger. Work from here is **ad-hoc**: the owner
  brings a feature idea, a piece of feedback, or a bug, and we do a scoped session on it. See
  *Maintenance mode* below for how a session runs.
- **Next step:** none pending. Nothing is queued or blocked; the next session starts from whatever the
  owner brings. The Follow-ups queue below is a shelf of known-but-unprioritised items — a menu to pick
  from, not a backlog to burn down.
- **Verify:** `pnpm test && pnpm lint && pnpm typecheck` — gate green at close: **259 tests, typecheck
  (200 files), lint** (2026-08-01). Live at `andreitim.com/apps/gestures`, Version `688d42ab`.

## Maintenance mode
How sessions run now that the roadmap is done (`CLAUDE.md` → Work cadence still governs the rituals):
- **Session-start** — read this file, then go straight to agreeing **Scope + Definition-of-done** for the
  one thing the owner brought. No milestone orientation, no ledger to lay out.
- **During** — same habits: test the logic, browser-verify UI, keep one canonical home per fact.
- **Session-wrap** — reset the "Now" block to describe what shipped and return it to "no step pending",
  append any decision worth keeping to `docs/decisions.md`, park discovered out-of-scope work in
  Follow-ups, suggest a commit. **Never auto-commit.**
- **A ledger comes back only if** a change is big enough to need multiple sessions — then write a small
  step ledger in "Now" for its duration and archive it to `docs/history.md` when it closes.
- Product decisions still go to `gestures-spec.md`; build-level ones to `docs/decisions.md`.

## Milestones — all closed
Sequenced order (spec §13). Companion tracks 🎨/☁️ are interleaved deliverables, not milestones — content
in `gestures-spec.md` §14. Step ledgers for every finished item are archived in `docs/history.md`.

| | Deliverable | State |
|---|---|---|
| — | Dev setup pass (skeleton, repo, rituals) | ✓ |
| M0 | Delightful core — local-folder source, session engine, in-session helpers | ✓ |
| 🎨 | Creative-direction session — originate design system, then restyle M0 (§14) | ✓ (taste-queue open) |
| ☁️ | Cloudflare setup guide + first deploy (§14; Workers Static Assets — `docs/deploy-notes.md`) | ✓ (live) |
| M1 | Drive read (Tier 1, public folder link) | ✓ (live) |
| M2 | Capture (Tier 2 Drive write, `drive.file`) — Box/Dropbox parked (§3); a4/a5 skipped at close | ✓ (live) |
| M3 | Review surface + dated timeline | ✓ (closed without an in-app build — review happens in Drive) |

Full roadmap and each item's contents: `gestures-spec.md` §13 (roadmap) · §14 (companion tracks).

## Follow-ups
Known-but-unprioritised work, one line each: `- [ ] <what> — spawned in <step> (yyyy-mm-dd)`. In
maintenance mode this is a **menu**, not a backlog — nothing here is scheduled.

- [ ] Setup still says "Files stay in your browser — nothing is uploaded", which is true for reference
      loading but **not** for opt-in capture (it uploads notes, refs and composites to the user's own
      Drive) — only matters if capture is ever opened beyond the owner — spawned a4, skipped (2026-08-01)
- [ ] No 503/429 retry-with-backoff on the slideshow `<img>` load path, so a transient Google throttle
      shows a blank frame instead of self-healing — spawned a5, skipped (2026-08-01)
- [ ] Bare root `andreitim.com/` returns 522 — add a redirect rule (→ `/apps/gestures/`) or a landing page — spawned in deploy track (2026-07-04)
- [ ] Promote the proxied-apex-record to an explicit numbered prerequisite step in `deploy-notes.md` (it bit the first deploy even with the zone already on Cloudflare) — spawned in deploy track (2026-07-04)
- [ ] Drive-key **quota is shared across all users** — fine for a hobby tool; if `files.list` ever strains it, add caching or a tiny Worker proxy (spec §3) — spawned M1-1 (2026-07-04)
- [ ] `VITE_GOOGLE_OAUTH_CLIENT_ID` must be set in the Cloudflare build env (like the Drive API key) before capture works on the live deploy — update `docs/deploy-notes.md` — spawned a1 (2026-07-08)
- [ ] Timing menu is now **three buttons tall** (pause/extend/refresh) — eyeball its spacing vs the mid-screen nav arrow on short viewports (phone/iPad-landscape); may need the split-rail math retuned — spawned polish batch (2026-07-06)
- [ ] The seven older local session PSDs (`04-07`…`30-07`) **can't be backfilled into pairs** — those runs
      predate capture, so no `Ref_*` exists in Drive for them (only `2026-07-26` and `2026-08-01` folders
      exist). Would need the original references re-identified by hand — spawned a3 backfill (2026-08-01)
- [ ] Composites built from a **Drive-sourced** run use the lh3 w1600 render, so the reference half is
      capped at ~1600px while the drawing half is full PSD resolution — fine at the 1400px cell, revisit
      if the pair cell ever grows — spawned a3 (2026-08-01)
- [ ] Re-logging the **same** session re-writes `notes.txt` and re-copies refs as **duplicate** Drive files (Drive allows dup names; no find-existing→update). Low-harm; fix = look up the existing file id and PATCH, or disable Save after a full `done` — spawned a2 (2026-07-08)
- [ ] Design taste-queue is still open (display typeface, pace-ramp palette pull, in-session theme switch,
      two parked themes) — `gestures-creative-direction.md` §Taste queue — spawned 🎨 (2026-07-04)

Owner-side, never automatable: live-verify a capture Save with a PSD attached on the deploy (does
`Pair_<n>` land beside `Ref_<n>`?), and the iPad spot-check of M1 polish. If sign-in fails on
`andreitim.com` but works on localhost, the OAuth client's **authorized JavaScript origin** is missing
`https://andreitim.com`.

Resolved: `www.andreitim.com` alias — proxied `www` record + redirect rule → apex, verified 301 to
`/apps/gestures/` (2026-07-04).

M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
