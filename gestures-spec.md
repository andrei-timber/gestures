# Gestures — Spec

> Status: **v0.3 draft** (2026-07-02). Living document. 🟡 = open question · ⭐ = proposed enhancement ·
> ✅ = decided. Research substrate: [gestures-apps-examples-research.md](./gestures-apps-examples-research.md)
> — this spec points into it rather than restating it (findings there, decisions here).

---

## 1. What it is

**Gestures** is a minimalist, delightful web app for **figure / gesture drawing practice**. Point it at a
Google Drive folder of pose references, set a couple of parameters, hit start, and it plays a timed
slideshow of random poses to draw along with. A later phase archives sessions to Drive so practice becomes
reviewable progress via reference↔drawing comparisons.

The first of several small, useful, freely-published art tools the author builds while learning art. It is
also the **template project** for a future family of lightweight art tools — a place to patternise the
author's taste, dev approach, and operations (adopting what's meaningful from the larger **Ondalu**
project, avoiding overkill). Ondalu remains the main large parallel endeavor; Gestures stays lightweight.

### Philosophy (the whole point — §21 non-negotiable)
> **A simple, blazingly-fast tool that looks genuinely pleasant. No complexity, no UX noise.**
> Minimalistic but *atmospheric* — subtle glows, non-intrusive VFX that add delight. Nothing between the
> artist and the drawing.

### The strategic bet (research Part A)
The field splits into *powerful-but-cluttered-and-paywalled* (Line of Action, Bodies in Motion) vs
*simple-but-fixed-library* (SketchDaily, AdorkaStock). **Simple AND bring-your-own-Drive AND free** is an
empty corner. Three stacked whitespace gaps we own:
1. **Google-Drive-native library** — only DrawGestures does it, chronically breaking. Careful, cached,
   robust implementation is the moat.
2. **First-class grayscale / value mode** — near-absent, core drawing skill, one keypress.
3. **Web-based post-session review** — nobody serves the "reference on screen, drawing on paper" case.

## 2. Publishing & context

- **Host:** Cloudflare Pages (static/JAMstack). Path: **`andreitim.com/apps/gestures`** ✅.
- **Cloudflare status:** only the domain is purchased — nothing else set up. Owner is new to Cloudflare and
  wants **education + step-by-step guidance** (separate setup guide to be produced — see §14).
- **Audience:** public, no account for the core timer; Google sign-in only for the Phase-2 write/review
  features.
- **Cost & compliance (hard constraint):** hobby app — **no recurring costs, no heavyweight compliance.**
  **Avoid Google restricted OAuth scopes** (`drive.readonly`/`drive`) — they trigger an annual CASA audit
  (~$500–$4,500/yr). We stay on non-sensitive `drive.file` + API-key public reads. See §3.
- **Targets:** **iPad and desktop/laptop only. No phone / small-mobile.** ✅

## 3. Google Drive integration (research Part B) ✅ direction

All sources sit behind one **`ImageSource` abstraction** (`list()` → image refs, `getUrl()` → displayable
URL). Local folder and Drive are just two implementations — so adding sources is cheap.

### Tier 0 — Local folder (⭐ proposed, read-first, desktop superpower)
Reading local images is **easier than Drive** — no auth/CDN/expiry/limits, instant, offline
(`URL.createObjectURL`). Two mechanisms: **File System Access API** (`showDirectoryPicker`, Chromium
desktop only; persistent handle in IndexedDB; **supports write-back** for session capture) vs
**`<input webkitdirectory>` / drag-a-folder** (broader desktop support, read-only, re-pick each session).
- ⚠ **iPad blocker:** iPad Safari supports **neither** folder-picking mechanism — only individual-file
  multi-select. So local-folder is a **desktop** feature; **Drive public link remains the iPad path.**
- **Write-back** (capture) is Chromium-desktop-only; elsewhere fall back to a "download composite" button.
- ✅ **Confirmed included**, and **doubles as the M0 build/test source** — build/tune the whole engine
  against a real local folder with zero Drive/Cloudflare setup, before any Drive work.

### Google Drive tiers
**Load-bearing constraint:** Google's `drive.file` scope is **per-file and does NOT cascade into folder
contents.** Picking a private folder grants the folder object only — not the images inside. "Paste any
private folder → enumerate images" is impossible without restricted `drive.readonly` + CASA. Two tiers:

### Tier 1 — Public folder read (✅ Phase-1, zero-auth, zero-audit) — the primary reference path
- User shares a Drive folder as **"anyone with the link"** and pastes the URL. ✅ (Owner accepts this;
  better UX considered later if needed.)
- App lists images with an **API key only** (`files.list?q='FOLDER_ID' in parents`, paginate 1000/page).
  **No OAuth, no consent screen, no CASA.**
- **Only `.jpg` / `.png` / `.webp` are admitted** — filter out every other type at listing time. ✅
- One **flat folder** is enough; no subfolder categories in v1. It's the user's job to pick which folder to
  share; we don't care what's in it. ✅
- Display via `thumbnailLink` (refresh on expiry) + a larger render for the active slide; lazy-load; cache.
- ⚠ **Empirical spike (M1, done by me):** confirm unlisted "anyone-with-link" folders list via API-key;
  handle Shared-Drive params & `resourceKey` edge cases. See §Q4 answer / research risk #2.

### Tier 2 — Private read + write-back (✅ Phase-2, `drive.file` only, still zero-audit)
- **Private folder reading via Picker file multi-select is P1 (next phase), not P0.** ✅
- **Auth:** Google Identity Services (GIS) token model, `drive.file` scope, ~1h tokens, re-request on
  expiry. No browser refresh token, **no backend required.** Sign-in is prompted only when the user
  chooses to capture/review a session — the core timer needs no login.
- **Write (session capture):** create the session folders and write reference copies + uploaded drawings.
  - **Robust write approach (avoids uncertain `files.copy` semantics):** fetch the reference image bytes
    from its public CDN link and **re-upload as a new file the app creates** (`files.create`) — fully
    covered by `drive.file`. No dependency on copying a file the app only read publicly. ✅
- **Owner's own large personal library track is locked for now** (unsure of redistribution rights) — Tier 1
  public sharing is on the user; we ship no reference content ourselves. ✅ (So §11/§12 licensing concerns
  are moot: users use their own folders; we host/share nothing.)

### The honest trade (decided)
Tier 1 (public folder link) is the **primary** path — the only one that gracefully handles thousands of
images in one folder. Tier 2 `drive.file` powers the **Phase-2 review loop** and later private-library
support. No backend unless a future need appears (>1h sessions → refresh tokens need a client secret Google
requires even under PKCE; or an image-proxy cache) → then a small Cloudflare Worker.

## 4. Primary user flow

**Phase 1 (core tool):**
1. Paste a public Drive folder link → app lists the `.jpg/.png/.webp` images.
2. **Pick mode** (Class or Quick) → set parameters (§5). Total session time auto-computes and is shown.
3. **Start** → full-bleed, distraction-free slideshow.
4. Draw each pose with a calm countdown + "pose N of M." Mirror / grayscale / pause available live.
5. Optional rest slide between poses. Next random pose.
6. **Session end** → calm summary (poses, total time).

**Phase 2 adds:** at session end, sign in and **capture** the session to Drive + **upload your drawings**,
then generate **paired reference↔drawing composites** (§7).

## 5. Session settings

Two modes. Pick mode first, then the minimal params. **Session length is by number of poses only**; total
time is a *function of the settings and is auto-computed and surfaced as an FYI during setup.* ✅

### Class mode (the default idea) ✅
Enter **number of poses N** (min 10). Durations auto-distribute by geometric halving of the count:
```
c1 = floor(N/2)   c2 = ceil(3N/4)   c3 = ceil(7N/8)
pose i:  i≤c1 → 1min | c1<i≤c2 → 2min | c2<i≤c3 → 5min | i>c3 → 10min
```
Examples: N=10 → 5×1m,3×2m,1×5m,1×10m (26m) · N=16 → 8×1m,4×2m,2×5m,2×10m (46m) · N=20 →
10×1m,5×2m,3×5m,2×10m (55m). Long poses scale with N ✅ — but bounded by the health caps below.

### Health caps (hard limits — enforced, not merely discouraged) ✅
Sessions beyond ~90 min are unhealthy, so we make them **impossible**:
- **Max 90 min of active drawing time** (sum of pose durations; rests excluded, shown only in the total
  FYI). The setup UI clamps N (Class) / N×interval (Quick) so this can't be exceeded.
- **Max three 10-min poses** in Class mode — an invariant that naturally holds under the 90-min cap
  (the distribution reaches 3 long poses right around 90 min, ~N≈30; e.g. N=30 → 3×10m, 81 min). If the
  math ever yields more, cap the count at 3.
- These caps bind before any absurd N; the UI shows the ceiling and won't accept more.

### Quick mode ✅
Enter **number of poses N** + a **uniform interval**: `30s / 60s / 2min / 5min / custom (minutes)`.
- More elaborate custom setup (arbitrary segment builders) is **P1, next phase.**

### Shared params
| Param | Description | Default |
|---|---|---|
| Number of poses | Session length (min 10) | ✅ 10 |
| Interval (Quick only) | 30s / 60s / 2m / 5m / custom-min | ✅ 60s |
| **Rest between poses** | Optional dim/blank pause slide | **10s** ✅ |
| Randomization | Shuffle, no within-session repeats | ✅ on |
| Remember last settings | Restore prior config on return | ⭐ on |
| Auto total-time FYI | Live-computed, shown during setup | ✅ on |

## 6. In-session helpers (research Part A)

**In for v1:**
- ✅ **Horizontal / vertical mirror** — one-key H and V.
- ✅ **Grayscale / value toggle** — one-key desaturate. Headline craft feature (near-unique in the field).
- ✅ **Pause keeps the reference on screen** — fixes the top competitor complaint; steal drawing time.
- ✅ **Extend / add-time** to current pose; **prev / next.**
- ✅ **Grid / line-of-action overlay** — toggle.
- ✅ **Gentle end cue** — optional soft beep for the last ~3s + subtle visual.
- ✅ **Keyboard-first, documented shortcuts** — space=pause, ←/→=nav, m=mirror-H, v=mirror-V,
  g=grayscale, r=grid, +=extend.

**Deferred (P1, next phase):** brightness/dim, favorites/snooze, notan/posterize, draw-on-reference.

## 7. Posterior review / session capture (Phase 2, research Part C) ✅ direction

Frictionless and optional (drawabox 50% rule — review must not become busywork).
- ✅ **Session folder:** default **`<reference-folder>/sessions/<date>/`**; the target folder is
  **user-configurable** (e.g. `<some other folder>/<date>`). Used for both reference copies and uploaded
  drawings.
- ✅ **Reference copies** written as **`Ref_<number>.<jpg|png|webp>`** (original extension preserved).
- ✅ **Drawings uploaded in-app at session end** (not a manual Drive step), named to correspond to the
  reference numbering.
- ✅ **Composites: individual paired images** (one per pose) — reference + drawing side-by-side, built
  **in-browser via Canvas**: uniform cell + `contain` letterbox on a neutral mat (never crop/stretch);
  per-pair orientation (`portrait→stack, landscape→side-by-side`); dated caption; margin for hand-drawn
  red-lines. EXIF auto-orient phone photos via `createImageBitmap(blob,{imageOrientation:'from-image'})`.
  Export `canvas.toBlob(cb,'image/jpeg',0.9)` back into the session folder.
- ⭐ **Dated timeline** of sessions (the folder structure already encodes progress) — low-effort payoff.
- 🟡 Future: layered PSD upload for compositing (too complex now — drawings-by-name for v1).
- ❌ **Not in v1:** overlay-alignment mode, accuracy scoring, per-drawing metadata, contact-sheet (individual
  pairs first; contact sheet可 later).

## 8. Design & feel (dedicated creative-direction session to follow — §14)

- **Dark theme only** for v1. ✅
- Minimalist but **atmospheric**: subtle glows, gentle motion, non-intrusive VFX that add delight. Owner is
  opinionated about aesthetics — this gets its **own dedicated design/creative-direction session** before
  heavy UI build; we'll iterate a small design system (the first of the future tool family).
- **Zero-friction start**, full-bleed reference, generous negative space. **Blazingly fast** — instant
  start, preload next image, no jank on thousands-of-file folders (lazy/paged listing, small thumbnail
  sizes, cache; CDN throttling — not the API — is the scale risk).
- Great on **iPad** (next to the drawing) and **desktop/laptop**. No phone.

## 9. Tech stack (goal-driven assessment)

Assessed against the four stated goals: **fast · minimalist · smooth · delightful.**

**Reality check:** at this scale the app is **image/CDN-bound, not framework-bound** — all options feel
instant; the bottleneck is Google's thumbnail CDN (handled by lazy-load + preload regardless). So "fastest"
is ~a tie; the real differentiators are **animation ergonomics, codebase minimalism, and
template-consistency.**

**Firm regardless of framework:** static SPA on Cloudflare Pages, **no backend** in v1. Drive: API-key
`files.list` (Tier 1); GIS `initTokenClient` + Google Picker + Drive v3 `files.create` (Tier 2). Canvas +
`createImageBitmap` for compositing. Vite 8 + TypeScript (strict). Plain modern CSS + custom-property
design tokens (see styling decision below). Vitest for logic; colocated tests; pre-push gate.

| Goal → | **1. React 19** | **2. Svelte 5** ⭐ recommended | **3. Vanilla TS** |
|---|---|---|---|
| Fast | ✓ fine (~45kb rt) | ✓✓ tiniest runtime | ✓✓ zero overhead |
| Minimalist codebase | ~ most boilerplate | ✓✓ least boilerplate | ✗ grows manual as UI expands |
| Smooth / delightful | ✓ needs motion lib (~5kb) or CSS | ✓✓ **built-in transitions + spring/tween** | ✓ all manual (WAAPI/CSS) |
| Template for future tools | ✓✓ matches Ondalu + React familiarity | ~ makes Svelte the family template | ✗ least reusable |
| Bespoke VFX / scoped styles | CSS Modules | ✓✓ scoped styles built-in | manual |

**✅ Decided: Option 2 — Svelte 5.** Wins 3 of 4 stated goals and ties on speed; least code to reach the
atmospheric micro-interactions. Becomes the **template for the future family of art tools** (Svelte, not
React). Owner is new to Svelte → **education-as-we-go is a standing requirement**: introduce runes
(`$state` / `$derived` / `$effect`), `{#each}`/`{#if}`, scoped `<style>`, and `svelte/transition` +
`svelte/motion` (spring/tween) **in context as we build**, not as upfront theory. Runes learning curve is
the only cost, mitigated by teaching inline.

### Styling — ✅ plain modern CSS + custom-property design tokens (not Tailwind)
Atmospheric, glow-heavy, bespoke-VFX aesthetics are better expressed in real CSS (nesting, custom
properties, `@layer`, layered shadows, custom easings) than utility classes. Pairs perfectly with Svelte's
scoped styles (or CSS Modules under React). The token set (colors/glows/easings) is defined in the
creative-direction session (§14) and is the shared design vocabulary.

### Still lifted from Ondalu (framework-agnostic subset)
Vite 8 + TS strict flags (`erasableSyntaxOnly`, no-unused, no-fallthrough) + `@/*` alias + Vitest + ESLint
flat config (**with `eslint-plugin-svelte` in place of the React plugins**) + colocated tests +
`src/lib/unreachable.ts` (exhaustive-switch guard) + `src/lib/constants.ts` + a `src/{ui,state,lib}`
layout. **Deliberately dropped:** Express backend, Three.js/agent code, `.env` (no client-side secrets),
milestone/session rituals, per-dir coverage gating, the 5-doc constitution layer,
`agent-kb/world-kb/world-state`.

## 10. Non-goals (guard against scope creep — §21)

- No user accounts / server DB (Google is identity+storage; app is local-first).
- No hosting a reference library ourselves; no social features; no shipped reference content.
- No restricted OAuth scopes (avoid CASA). No auto-overlay critique / accuracy scoring in v1.
- No phone support. No layered-PSD compositing in v1. No subfolder-category system in v1.
- Not out-breadthing Line of Action — being the *simplest, most delightful BYO-Drive* tool.

## 11. Top enhancements adopted (research-driven)

1. ✅ **Grayscale/value toggle** as a headline feature.
2. ✅ **One-mode Class preset** (geometric arc) — a great session with near-zero config.
3. ✅ **Pause keeps the reference visible** + extend-time.
4. ✅ **Dated session archive as the review loop** (paired composites + timeline).
5. ✅ **Keyboard-first, documented shortcuts** + remembered settings.

## 12. Open questions

**Plan is fully locked** — no blocking open questions. ✅ Framework = Svelte 5 (educate-as-we-go) · local
folder included + M0 source · Drive model · session engine + health caps · defaults 10/60s · styling =
plain CSS + tokens · sequencing (dev setup → Cloudflare → M0 → creative direction → M1+). Fine-tuning
(exact numbers, token values, copy) happens live during each milestone.

## 13. Roadmap

> **Sequencing (owner-set):** 🧭 **Dev setup pass (NEXT STEP)** → ☁️ **Cloudflare setup guide** → **M0**
> (build core against local folder, deploy it) → 🎨 **creative-direction session** (originate the design
> system, then restyle M0) → **M1+**. Getting a deployable skeleton live early; aesthetics layered on once
> the core feels right.
>
> **🧭 Dev setup pass (the immediate next deliverable)** — stand up the project skeleton + repo before any
> product code: scaffold **Svelte 5 + Vite 8 + TS (strict)**; the Ondalu adoption subset (strict tsconfig
> flags, `@/*` alias, Vitest, ESLint flat config with Svelte plugins, colocated tests,
> `src/lib/{unreachable,constants}.ts`, `src/{ui,state,lib}` layout); **pnpm** + pinned `engines`/`.nvmrc`;
> `dev`/`build`/`test`/`lint`/`typecheck` scripts; **Husky pre-push gate** (`test && lint && typecheck`);
> **GitHub repo** (init, `.gitignore`, first commit, remote); thin `CLAUDE.md` map + the adopted ops
> conventions (§14). Output: an empty-but-correct, committed, test/lint-green Svelte app ready for M0.

> **Verification spikes (throwaway tests, run at the start of the relevant milestone — no product code):**
> **S1** (before M1) — confirm an *unlisted* "anyone-with-link" folder lists via **API key only**; note
> Shared-Drive / `resourceKey` handling. **S2** (before M2) — confirm the **download-bytes → `files.create`
> re-upload** write path works under `drive.file` (the robust alternative to `files.copy`). Both are ~15-min
> checks that de-risk the architecture before real build.

- **M0 — Delightful core (local folder source).** Static shell; **local-folder image source** (real
  images, no Drive/Cloud setup); session engine (Class + Quick), mirror, grayscale, grid, pause-keeps-ref,
  extend, keyboard, calm countdown, end cue.
- **M1 — Drive read (Tier 1).** Spike **S1** → public folder link → API-key listing (jpg/png/webp) →
  slideshow. Auto total-time FYI.
- **M2 — Drive write / capture (Tier 2).** Spike **S2** → GIS sign-in (`drive.file`); write
  `sessions/<date>/Ref_N.ext`; in-app drawing upload at session end; configurable session folder.
- **M3 — Review composites.** Canvas paired images → session folder; dated timeline.
- **Later (P1+).** Private-folder Picker read, custom segment builder, brightness/notan/favorites/
  draw-on-reference, contact sheet, PSD compositing.

## 14. Companion tracks (separate deliverables)

- 🎨 **Creative-direction session** — dedicated working session on the design system / aesthetic (dark,
  atmospheric, subtle glow/VFX). Ondalu has **no reusable web CSS tokens** to copy (its creative doc is
  3D/Three.js), so we **originate** the palette, easing curves, and glow recipes — but reuse its *doc
  pattern* (north-star one-liner, `decided`/`TBD` markers, owner taste-queue, "intent here, math in code")
  as `gestures-creative-direction.md`. Starting chrome to react against: dark neutral + single accent.
- ☁️ **Cloudflare setup guide** — beginner-friendly, step-by-step (Pages, custom domain routing to
  `andreitim.com/apps/gestures`, deploys). Owner is new to Cloudflare.
- 🧭 **Ops/dev conventions (patternised from Ondalu, ~1/5 ceremony)** — a thin ~30-line `CLAUDE.md` *map*
  (not a copy) + these adopted habits: one-canonical-home-per-fact; test the logic / visually-verify UI
  (exclude visuals from coverage); **pre-push** green gate (`test && lint && typecheck`), no pre-commit;
  scoped conventional commits, **never auto-commit**; suggest-only memory; privacy-first (trivial — no
  backend); no product name in reusable paths (keeps the template generic). **Skip** Ondalu's milestone-
  file template, session-start/wrap rituals, retrospective cadence, per-dir coverage gates.
