# Status

Single status surface. `/session-start` reads this; `/session-wrap` resets the "Now" block.

## Now
- **Focus:** **M1 — Drive read (Tier 1) — code done, browser-verified locally; one step left: deploy +
  iPad check.** Recursive public-folder read is built and working: pasting the owner's "Refs" link loads
  **2686 images** across 5 folders, a session renders the Drive references full-bleed, prefetch + next are
  clean, no console errors. Prod build inlines the referrer-restricted key (gitignored `.env.local`). S1
  spike settled the display URL (`drive.google.com/thumbnail?id=…&sz=w1600`, keyless, 1600×2400). Decision
  + spec §3 revision logged (2026-07-04).
- **Next step:** **M1-6 — deploy + iPad verify.** `pnpm deploy` (owner action; ships the inlined key) →
  on iPad open `https://andreitim.com/apps/gestures/`, paste the Refs link → "2686 images loaded" → run a
  full session. *Owner-facing — not auto-run.* Then session-wrap: tick step 6, groom M1 → history, suggest
  the commit.
- **Verify:** local flow green (2686 loaded, session renders Drive refs). Gate green — **164 tests,
  typecheck, lint**; `pnpm build` clean, key inlined. Remaining: the live iPad run.

### M1 step ledger — Drive read (Tier 1)
Public folder link → API-key `files.list` (recursive) → slideshow (spec §3/§13). Decisions locked
(2026-07-04): paste input with a **remembered** link; key via gitignored local `.env`; **recursive**
subfolder walk (owner's library is nested, matches the local source).
- [x] 1 — API-key walkthrough (owner) + **S1 spike**: confirmed anyone-with-link folder lists via API key
      only (private→404, shared→200); display URL settled (`drive.google.com/thumbnail?id=…&sz=w1600`);
      Shared-Drive / `resourceKey` handling wired defensively.
- [x] 2 — Drive source module (`src/lib/source/drive.ts`, node-tested): parse link → `folderId`
      (+`resourceKey`); **recursive BFS walk** (cycle-safe visited set); filter jpg/png/webp; map to
      `{name, url}` via the keyless thumbnail URL.
- [x] 3 — Store: `SourceImage` moved to `images.ts`; `source.loadRemote` adopts a remote list, revokes
      only `blob:` URLs.
- [x] 4 — UI: `RemoteInput.svelte` paste input (working Drive row + Box/Dropbox **SOON** placeholders for
      future providers), side-by-side with the local picker under one centered prompt; loading / error
      states, remembered link; shared bold "Folder picked up successfully…" count in Setup.
- [x] 5 — Config: `VITE_GOOGLE_DRIVE_API_KEY` via gitignored `.env.local` (+ `.env.example`), inlined at
      build; documented in `deploy-notes.md`.
- [ ] 6 — Verify on iPad against the live deploy: paste link → "2686 images loaded" → run a full session.

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
- [ ] Promote the proxied-apex-record to an explicit numbered prerequisite step in `deploy-notes.md` (it bit the first deploy even with the zone already on Cloudflare) — spawned in deploy track (2026-07-04)

Resolved: `www.andreitim.com` alias — proxied `www` record + redirect rule → apex, verified 301 to
`/apps/gestures/` (2026-07-04).

M0's resolved follow-ups are archived in `docs/history.md`. The grid-overlay image-bounds
tightening (step 20) was **dropped** (owner's call, 2026-07-03) — the viewport-spanning 9×9 lattice is
good enough; we won't fit it to the letterboxed image rect.
