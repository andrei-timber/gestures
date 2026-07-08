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
- **M2 opened (2026-07-08):** ledger laid out below. **Spike S2 (Drive write) ✅ passed** — `drive.file`
  download-bytes → `files.create` is byte-exact, can parent into the user's own folder; findings +
  Box/Dropbox park logged (`decisions.md`, spec §3/§13). **Box + Dropbox parked** (need a Worker; owner's
  call) — placeholder rows + Setup copy removed, quiet "maybe later" line left. So **M2 = Drive write
  only.** Uncommitted: the RemoteInput/Setup stub removal + the doc revisions (one commit).
- **Next step:** **M2 slice (a), step a1 — GIS sign-in (`drive.file`).** Plan-gate: agree Scope + DoD
  before build code. First owner setup task: create an **OAuth Client ID** (Web-app type) in the Google
  Cloud project (JS origins: `http://localhost:5173` + `https://andreitim.com`; no redirect URI for the
  GIS token model). Then wire `initTokenClient` + capture-time prompt.
- **Verify:** live — `curl https://andreitim.com/apps/gestures/` → **200** (Version `a1ab6b46`,
  2026-07-06; no redeploy this session). Gate: **typecheck + lint green** after the stub removal (run
  `pnpm test` before commit to confirm 182 still pass). Owner still to spot-check the M1 polish touch
  fixes on iPad (sticky-tap + free-draw aids).

## M2 step ledger — Capture (Tier 2 Drive write)
Drive write behind the GIS token model (spec §3/§7/§13). **Box + Dropbox read was the original slice (b)
— parked 2026-07-08** (both need a server-side app token → a Worker; Box also proxying every image; owner
cut them, §3 + `decisions.md`). So M2 is Drive write only. Slice (a) is a plan-gate: agree Scope + DoD
before build code.

**Spike (done):**
- [x] S2 — **download-bytes → `files.create`** proven under `drive.file`: byte-exact round-trip (md5
      match), root-folder create works, and can parent into the user's *own* existing folder (so
      `<ref>/sessions/` default is reachable). Spike content cleaned up. (2026-07-08)
- [—] S3 / S4 (Box / Dropbox) — **not run; parked** (see above).

**Slice (a) — Drive write (`drive.file`) — not started:**
- [ ] a1 — GIS sign-in (token model, `drive.file` scope, ~1h tokens + silent re-request via
      `prompt:''`); prompted only on capture, never for the core timer. Needs an **OAuth Client ID**
      (Web-app type) added to the Google Cloud project — owner setup step.
- [ ] a2 — Session capture into the user's **own** Drive (decoupled from the ref source, which may be
      someone else's public folder): find-or-create `Gestures Sessions/` in My-Drive root (id remembered
      locally) → `Gestures Sessions/<date>/`; write reference copies `Ref_<n>.<ext>` via download-bytes →
      `files.create`. ⚠ in-browser the source image URL must be CORS-readable to grab bytes (curl spike
      bypassed this). *(Google-Picker "Change folder…" = P1 fast-follow, parked.)*
- [ ] a3 — In-app drawing upload at session end, named to correspond to the reference numbering.
- [ ] a4 — Reconcile the Setup copy: "Files stay in your browser — nothing is uploaded" is true for ref
      loading but not for opt-in capture (which uploads to the user's own Drive) — distinguish the two.

Spike findings + Box/Dropbox park: `docs/decisions.md` (2026-07-08). Write mechanics: `gestures-spec.md` §3/§7.

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
| M2 | Capture (Tier 2 Drive write, `drive.file`) — Box/Dropbox parked (§3) | ☐ |
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
