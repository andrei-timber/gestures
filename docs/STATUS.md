# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** **M2 — Capture (Tier 2 Drive write, `drive.file`).** M1 (Drive read) is closed & live
  (Version `a1ab6b46`); its ledger is in `docs/history.md`. M2 = Drive write only (Box/Dropbox parked
  2026-07-08 — spec §3). Ledger below.
- **a1 + a2 built (2026-07-08):** a1 (GIS `drive.file` sign-in, write helpers, **Log session** panel →
  `notes.txt`) is owner-verified live. **a2** copies the run's ordered references (`Ref_1…N`) into the
  dated folder: CORS probe forced the **lh3 display-URL switch** (thumbnail bytes are CORS-blocked; lh3 is
  readable) — folded in from a5. Plus per-session dated folders (`<date>`, `<date>-2…`), parallel copy
  (pool of 5), and a per-recap capture reset. a1 committed (`2f3e456` = a2 code); the three refinements
  are an **uncommitted batch**. See `decisions.md` (2026-07-08 a2).
- **⚠ External throttle still active:** Google's image endpoints 429/503 from the ~2k-image bulk upload
  (per-IP, time-bound, **not a code regression**). Blocks live-verify of lh3 display *and* the Drive-ref
  copy path; local-folder copy is unaffected. a5's remaining half (retry-with-backoff) verifies once it clears.
- **Next step:** **a3 — drawing upload**: a recap affordance to upload the user's numbered drawing JPGs
  from the computer, named to correspond to the reference numbering (`Ref_N` ↔ the drawing). Then a4
  (Setup copy reconcile), a5 (503/429 retry-with-backoff — verify once throttle clears).
- **Verify:** `pnpm dev` → local-folder session → finish → **Log session** → sign in → confirm
  `Gestures Sessions/<date>/` has `notes.txt` + `Ref_1.jpg…`; run a **second** same-day session → confirm
  it lands in `<date>-2` and shows no stale "logged" status. Gate green — **218 tests, typecheck (185
  files), lint** (2026-07-08). Live site unchanged (Version `a1ab6b46`; no redeploy). Owner still to
  spot-check M1 polish on iPad; lh3 display + Drive-ref copy pending the Google throttle clearing.

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
- [x] a2 — Copy the **ordered session references** (`Ref_1…N`) into the dated folder (2026-07-08). CORS
      probe: `drive.google.com/thumbnail` bytes are **CORS-blocked**, only `lh3.googleusercontent.com/d/<id>`
      is readable → **folded in a5's lh3 display switch** (`driveImageUrl` → lh3, one URL serves display +
      byte-copy). `copyReferenceImages` (bounded pool of 5, best-effort per-image skip, position-tied
      `Ref_NN.<ext>`), `session.images` exposed, `capture.log(notes, images)`, `createSessionFolder`
      (per-session `<date>[-N]` folder, cached id), per-recap `capture.newSession()` reset. Local refs copy
      full-quality; Drive refs are the w1600 lh3 render (no `drive.file` scope for others' originals). Gate:
      218 tests. ⏳ **owner to live-verify** `Ref_*` land + `-2` folder + no stale status (auth + Drive).
- [ ] a3 — **Drawing upload**: recap affordance to upload the user's numbered drawing JPGs from the
      computer, named to correspond to the reference numbering.
- [ ] a4 — Reconcile the Setup copy: "Files stay in your browser — nothing is uploaded" is true for ref
      loading but not for opt-in capture (which uploads to the user's own Drive) — distinguish the two.
- [ ] a5 — **Display robustness** (folded in 2026-07-08 after a live Drive-throttle bite). The lh3
      display-URL switch (`drive.google.com/thumbnail` → `lh3.googleusercontent.com/d/<id>`, more
      cache-friendly / less throttled) **shipped in a2** (the CORS probe forced it). a5's remaining half: a
      **503/429 retry-with-backoff** on image load so transient throttles self-heal into a retry instead of
      a blank frame. ⚠ Verify only once the current throttle clears (lh3 429s now). Touches the slideshow
      `<img>` load path (spec §3 display URL).

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
- [ ] Re-logging the **same** session re-writes `notes.txt` and re-copies refs as **duplicate** Drive files (Drive allows dup names; no find-existing→update). Low-harm; fix = look up the existing file id and PATCH, or disable Save after a full `done` — spawned a2 (2026-07-08)

Resolved: `www.andreitim.com` alias — proxied `www` record + redirect rule → apex, verified 301 to
`/apps/gestures/` (2026-07-04).

M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
