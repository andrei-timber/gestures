# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** **M2 — Capture (Tier 2 Drive write, `drive.file`).** M1 (Drive read) is closed & live
  (Version `a1ab6b46`); its ledger is in `docs/history.md`. M2 = Drive write only (Box/Dropbox parked
  2026-07-08 — spec §3). Ledger below.
- **a1 + a2 shipped (2026-07-08), all committed** (`ba531ca`, `2f3e456`, `99f40bc`): GIS `drive.file`
  sign-in + **Log session** panel → `notes.txt`; ordered `Ref_1…N` copy; per-session dated folders
  (`<date>`, `<date>-2…`); parallel copy (pool of 5); per-recap capture reset. The CORS probe forced the
  **lh3 display-URL switch** (thumbnail bytes are CORS-blocked) — folded in from a5.
- **a3 shipped, committed & live (2026-08-01)** — commits `0a5e182` (feat) + `535c3ff` (docs), pushed;
  **deployed as Version `688d42ab`**. Drawings arrive as **the session `.psd`** (one layer per pose) and
  only the **paired composite** is saved: `Pair_<n>`, reference left / drawing right, white ground, 15%
  outer margins, seam gap 15% of the drawing's width. New `src/lib/capture/`
  (`psd.ts` · `composite.ts` · `report.ts`), `copyReferenceImages` → `copySessionFiles` (ref copy + pair
  build off **one** byte read), `ag-psd` as a lazily-imported dep (own 282 kB chunk; main bundle stays
  88.6 kB). Browser-verified against the real 57 MB PSD — 11/11 layers in 1.4 s, pair 2800×1400 at
  156 KB, margins 210 px, seam gap 169 px vs 165 expected. ⏳ **owner to verify the live Save with a PSD
  attached** (Google popup can't be automated): does `Pair_<n>` land beside `Ref_<n>`?
- **✅ Google throttle cleared (2026-08-01, owner-confirmed live).** The 429/503s from the ~2k-image bulk
  upload were time-bound and per-IP, as diagnosed — not a code regression. lh3 display and the Drive-ref
  copy path are unblocked, so a5's remaining half (retry-with-backoff) is now verifiable.
- **Next step:** **a4 — reconcile the Setup copy.** "Files stay in your browser — nothing is uploaded"
  (`src/ui/screens/Setup.svelte`) is true for reference loading but false for opt-in capture, which now
  uploads notes, references *and* composites to the user's own Drive — distinguish the two without
  souring the calm entry copy. Then a5 (503/429 retry-with-backoff — now unblocked).
- **Verify:** `pnpm test && pnpm lint && pnpm typecheck` — gate green at wrap: **259 tests, typecheck
  (200 files), lint** (2026-08-01). Browser-check a4's copy on Setup once written. Owner still to
  spot-check M1 polish on iPad. ⚠ Live capture needs the OAuth client's **authorized JavaScript origin**
  to include `https://andreitim.com` — if sign-in fails there but works on localhost, that's the cause.

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
- [x] a3 — **PSD upload → paired composites** (2026-08-01). Scope revised mid-session (owner): the
      drawings arrive as the session `.psd` (one `Layer <n>` per pose, hidden flag ignored, `Background`
      excluded) and **only the pair is saved**, never the bare drawing — so M3's composite *render*
      landed here. `capture/psd.ts` (lazy `ag-psd`, layer selection pure + node-tested),
      `capture/composite.ts` (pure geometry node-tested, canvas draw browser-verified),
      `capture/report.ts` (result wording), `copySessionFiles` (ref copy + pair from one byte read).
      Gate: 259 tests. ⏳ **owner to live-verify** the Save (auth + Drive).
- [ ] a4 — Reconcile the Setup copy: "Files stay in your browser — nothing is uploaded" is true for ref
      loading but not for opt-in capture (which uploads to the user's own Drive) — distinguish the two.
- [ ] a5 — **Display robustness** (folded in 2026-07-08 after a live Drive-throttle bite). The lh3
      display-URL switch (`drive.google.com/thumbnail` → `lh3.googleusercontent.com/d/<id>`, more
      cache-friendly / less throttled) **shipped in a2** (the CORS probe forced it). a5's remaining half: a
      **503/429 retry-with-backoff** on image load so transient throttles self-heal into a retry instead of
      a blank frame. Unblocked — the throttle cleared 2026-08-01, so this is now insurance against the
      *next* one rather than a fix for a live bite. Touches the slideshow `<img>` load path (spec §3
      display URL).

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
| M3 | Review surface + dated timeline (composite *render* shipped early, in M2 a3) | ☐ |

Full roadmap, sequencing rationale, and each item's contents: `gestures-spec.md` §13 (roadmap) · §14
(companion tracks).

## Follow-ups
Discovered out-of-scope work, parked one line each: `- [ ] <what> — spawned in <step> (yyyy-mm-dd)`.

- [ ] Bare root `andreitim.com/` returns 522 — add a redirect rule (→ `/apps/gestures/`) or a landing page — spawned in deploy track (2026-07-04)
- [ ] Promote the proxied-apex-record to an explicit numbered prerequisite step in `deploy-notes.md` (it bit the first deploy even with the zone already on Cloudflare) — spawned in deploy track (2026-07-04)
- [ ] Drive-key **quota is shared across all users** — fine for a hobby tool; if `files.list` ever strains it, add caching or a tiny Worker proxy (spec §3) — spawned M1-1 (2026-07-04)
- [ ] `VITE_GOOGLE_OAUTH_CLIENT_ID` must be set in the Cloudflare build env (like the Drive API key) before capture works on the live deploy — update `docs/deploy-notes.md` when M2 ships — spawned a1 (2026-07-08)
- [ ] Timing menu is now **three buttons tall** (pause/extend/refresh) — eyeball its spacing vs the mid-screen nav arrow on short viewports (phone/iPad-landscape); may need the split-rail math retuned — spawned polish batch (2026-07-06)
- [ ] The seven older local session PSDs (`04-07`…`30-07`) **can't be backfilled into pairs** — those runs
      predate capture, so no `Ref_*` exists in Drive for them (only `2026-07-26` and `2026-08-01` folders
      exist). Would need the original references re-identified by hand — spawned a3 backfill (2026-08-01)
- [ ] Composites built from a **Drive-sourced** run use the lh3 w1600 render, so the reference half is
      capped at ~1600px while the drawing half is full PSD resolution — fine at the 1400px cell, revisit
      if the pair cell ever grows — spawned a3 (2026-08-01)
- [ ] Re-logging the **same** session re-writes `notes.txt` and re-copies refs as **duplicate** Drive files (Drive allows dup names; no find-existing→update). Low-harm; fix = look up the existing file id and PATCH, or disable Save after a full `done` — spawned a2 (2026-07-08)

Resolved: `www.andreitim.com` alias — proxied `www` record + redirect rule → apex, verified 301 to
`/apps/gestures/` (2026-07-04).

M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
