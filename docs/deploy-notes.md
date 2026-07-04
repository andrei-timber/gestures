# Deploy — Cloudflare Workers Static Assets

How Gestures ships to `andreitim.com/apps/gestures/`. The config is implemented (`wrangler.jsonc`,
Vite `outDir`, `package.json` scripts); this doc is the map to it plus the owner-only first-deploy
steps. Decisions live here; the "why" for the product line is `gestures-spec.md` §14.

## What's wired up (in the repo)
- **`wrangler.jsonc`** — the Cloudflare project: static assets from `./dist`, routes
  `andreitim.com/apps/gestures` + `…/apps/gestures/*`, no `main` Worker (static-only). This is the
  source of truth for the deploy target; the bullets below just explain its choices.
- **`vite.config.ts`** — one `SUBPATH = 'apps/gestures'` const drives both `base` (asset URLs) and
  `build.outDir` (`dist/apps/gestures`), so the built tree matches the served route 1:1.
- **`package.json`** — `pnpm cf:preview` (local edge emulator) · `pnpm deploy` (build + ship).

## Target: Workers Static Assets (not Pages)
- Cloudflare's recommended path for new static / SPA projects; Pages is in migrate-to-Workers mode.
- **Route:** `andreitim.com/apps/gestures` **+** `…/apps/gestures/*` — route-based, so other `/apps/*`
  tools coexist under one domain. (Pages custom domains bind a whole domain/subdomain and can't serve a
  subpath.) Both patterns are bound because a lone `/*` requires the literal trailing slash, so the
  bare canonical URL (`/apps/gestures`, no slash) wouldn't route here without the exact-path pattern.
- **Subpath mapping (the crux):** Static Assets serves a file by matching the request path against
  the asset folder. So the disk layout must contain the route prefix. Vite's `outDir` writes into
  `dist/apps/gestures/…`; wrangler serves `./dist`; request `/apps/gestures/x` → `dist/apps/gestures/x`.
  No prefix-stripping Worker needed — the match is by layout, which keeps the deploy fully static.
- **404 handling — `not_found_handling: "none"`.** Gestures has no client-side routing (the URL is
  always `/apps/gestures/`, which resolves to the real nested `index.html` via html_handling), so
  unknown paths correctly 404. SPA fallback is deliberately **off**: at a subpath it would serve the
  assets-*root* `index.html`, which doesn't exist (ours is nested) — making it work needs a duplicate
  `index.html` at the dist root. Add that only if in-app routing ever lands. *(Decision: 2026-07-04,
  reversing the earlier `single-page-application` intent — the app has no deep links to fall back for;
  logged in `docs/decisions.md`.)*

## Static now; a Worker only if a real need appears
No server code in v1. A small Worker (`main` in `wrangler.jsonc`) shows up only if a future need does:
an image-proxy / cache, or sessions longer than the ~1h token lifetime (refresh tokens need a client
secret → a backend). All deliberately avoided so far.

## No client secrets
- Drive read (Tier 1): public API key, **referrer-restricted to andreitim.com**.
- Drive write (Tier 2): client-side GIS token, `drive.file` scope. No refresh token, no client secret.

## Google Drive API key (Tier-1 read) — owner steps
The app lists a public "anyone with the link" folder with **one app-owned API key** (spec §3). It's not
a secret in the OAuth sense — Vite inlines `VITE_*` into the public bundle, so the key ships in the JS.
The protection is the **referrer + API restriction**, not obscurity. Each visitor's browser uses this
one key; no user ever creates their own.

**Create the key** (console.cloud.google.com, the Google account that owns the folder):
1. New project (e.g. `gestures`) → select it.
2. **APIs & Services → Library → "Google Drive API" → Enable.**
3. **APIs & Services → Credentials → + Create Credentials → API key** → copy it.
4. Edit the key → lock it down:
   - **Application restrictions → Websites (HTTP referrers):** `andreitim.com/*`, `*.andreitim.com/*`,
     `localhost:5173/*` (dev). *(Referrer changes take a couple minutes to propagate.)*
   - **API restrictions → Restrict key → Google Drive API** only.
5. The reference folder itself: Drive → **Share → General access → "Anyone with the link" → Viewer.**

**Wire it into the build** (the key is read at build time, so it must be present wherever `pnpm deploy`
runs — currently your local machine):
```sh
cp .env.example .env.local          # .env.local is gitignored
# edit .env.local → VITE_GOOGLE_DRIVE_API_KEY=<the key>
```
`pnpm dev` and `pnpm deploy` both pick it up automatically. If the key is absent, the Drive input
renders disabled with a "not configured" note (the local-folder source still works). Display images use
the keyless `drive.google.com/thumbnail?id=…` CDN endpoint — no key, no expiry.

## First deploy — owner steps
These need your Cloudflare account and are interactive, so they're not automated. Run them from the
repo root. Prefix with `! ` in a Claude Code prompt to run in-session (output lands in the chat).

**Prerequisite — the domain must be on Cloudflare.** `andreitim.com` needs to be an active zone in
your Cloudflare account (its DNS served by Cloudflare), with a **proxied** DNS record on the apex
(orange cloud) so the route has a host to attach to. If the domain isn't on Cloudflare yet: add the
site in the dashboard and point the registrar's nameservers at Cloudflare first.

1. **Authenticate** (opens a browser, one-time per machine):
   ```sh
   pnpm exec wrangler login
   pnpm exec wrangler whoami   # confirm the right account
   ```
2. **Build + deploy:**
   ```sh
   pnpm deploy                 # = pnpm build && wrangler deploy
   ```
   First run creates the `gestures` Worker and attaches the route. Wrangler prints a warning that the
   route "will match assets: dist/apps/gestures/*" — that's the expected 1:1 mapping, not an error.
3. **Verify live:** open `https://andreitim.com/apps/gestures/` — Setup screen loads, a session runs.
   (Route/DNS propagation can take a minute on the very first deploy.)

## Redeploys & rollback
- **Redeploy:** `pnpm deploy` again — same command, uploads changed assets.
- **Preview the edge locally** before shipping: `pnpm cf:preview` serves the real workerd runtime at
  `localhost:8787`; hit `http://localhost:8787/apps/gestures/`.
- **Rollback:** `pnpm exec wrangler rollback` (or `wrangler deployments list` → roll back to an id).

## Static vs dynamic — where the line is
- **Static** = files identical for every request (HTML / JS / CSS / images), built once by `vite build`
  and served verbatim from the edge. No per-request server code. Free and instant.
- **Dynamic** = computed per request on a server: SSR, API endpoints, exchanging a secret for a token,
  database reads, per-user personalization, request-time redirect logic. Each needs a Worker.
- **Gestures is fully static:** the timer, shuffle, mirror / grayscale, and canvas compositing all run
  in the browser; Drive calls go browser → Google directly. Nothing is computed on a server.
