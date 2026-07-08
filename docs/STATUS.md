# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** **M2 — Capture (Tier 2 Drive write, `drive.file`).** M1 (Drive read) is closed & live
  (Version `a1ab6b46`); its ledger is in `docs/history.md`. M2 = Drive write only (Box/Dropbox parked
  2026-07-08 — spec §3). Ledger below.
- **a1 done & owner-verified (2026-07-08):** GIS `drive.file` sign-in (`drive-auth.ts`), write helpers
  (`drive-write.ts`), reactive `capture.svelte.ts`, and the **Log session** panel on the Summary recap
  (disclaimer + Free-form Notes → `Gestures Sessions/<date>/notes.txt`). Owner confirmed the **live
  sign-in + write works**. Config `VITE_GOOGLE_OAUTH_CLIENT_ID` in `.env.local`. Committed this session.
- **⚠ Live issue found (external, transient):** the slideshow went blank mid-verify — **HTTP 503 from
  Google's image endpoints** (`/thumbnail` *and* `lh3`), a per-IP throttle from bulk-uploading ~2k images
  (thumbnail-generation backlog) + the day's spike traffic. **Not a code regression.** Recovers on its
  own; hardening folded into **ledger a5** (lh3 CDN + 503 retry). See `decisions.md` / spec §3.
- **Next step:** **a2 — copy the ordered session reference images** (`Ref_1…N`) into the dated folder
  (`uploadFile` already built; needs the session's ordered image list + byte fetch, CORS-checked for
  Drive URLs). Then a3 (drawing upload), a4 (Setup copy), a5 (display robustness — verify once throttle clears).
- **Verify:** `pnpm dev` → finish a session → **Log session** on the recap → sign in → confirm
  `Gestures Sessions/<date>/notes.txt` in Drive. Gate green — **205 tests, typecheck (185 files), lint,
  build** (2026-07-08). Live site unchanged (Version `a1ab6b46`; no redeploy this session). Owner still to
  spot-check M1 polish touch fixes on iPad; slideshow render pending the Google throttle clearing.

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

**Slice (a) — Drive write (`drive.file`). End-screen "Log session" UX (spec §7).**
- [x] a1 — Auth + folder + notes (2026-07-08). GIS sign-in (`drive-auth.ts`: token cache/expiry pure +
      node-tested; GIS glue guarded), write helpers (`drive-write.ts`: find-or-create folder, multipart
      upload, node-tested w/ injected fetch), reactive `capture.svelte.ts`, and the **Log session** panel
      on Summary (disclaimer + Free-form Notes textarea) → creates `Gestures Sessions/<date>/` + writes
      `notes.txt`. Config `VITE_GOOGLE_OAUTH_CLIENT_ID`. Gate green (205 tests). ⏳ **owner to verify the
      live Google sign-in** (native popup can't be automated).
- [ ] a2 — Copy the **ordered session reference images** (`Ref_1…N`) into the dated folder via
      download-bytes → multipart upload (`uploadFile` already built). ⚠ in-browser the source URL must be
      CORS-readable — local `blob:` URLs are fine; Drive thumbnail URLs need a CORS check.
- [ ] a3 — **Drawing upload**: recap affordance to upload the user's numbered drawing JPGs from the
      computer, named to correspond to the reference numbering.
- [ ] a4 — Reconcile the Setup copy: "Files stay in your browser — nothing is uploaded" is true for ref
      loading but not for opt-in capture (which uploads to the user's own Drive) — distinguish the two.
- [ ] a5 — **Display robustness** (folded in 2026-07-08 after a live Drive-throttle bite): switch the
      slideshow display URL from `drive.google.com/thumbnail` to the `lh3.googleusercontent.com/d/<id>`
      CDN (more cache-friendly / less throttled) **and** add a **503 retry-with-backoff** on image load so
      transient throttles self-heal into a retry instead of a blank frame. ⚠ Verify only once the current
      throttle clears (both endpoints 503 now). Touches `drive.ts` `driveImageUrl` (spec §3 display URL).

*(Google-Picker "Change folder…" destination = P1 fast-follow, parked — spec §7.)*

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
- [ ] `VITE_GOOGLE_OAUTH_CLIENT_ID` must be set in the Cloudflare build env (like the Drive API key) before capture works on the live deploy — update `docs/deploy-notes.md` when M2 ships — spawned a1 (2026-07-08)
- [ ] Timing menu is now **three buttons tall** (pause/extend/refresh) — eyeball its spacing vs the mid-screen nav arrow on short viewports (phone/iPad-landscape); may need the split-rail math retuned — spawned polish batch (2026-07-06)

Resolved: `www.andreitim.com` alias — proxied `www` record + redirect rule → apex, verified 301 to
`/apps/gestures/` (2026-07-04).

M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
