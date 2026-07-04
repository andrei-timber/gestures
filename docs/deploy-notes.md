# Deploy — Cloudflare Workers Static Assets

How Gestures ships to `andreitim.com/apps/gestures/`. The config is implemented (`wrangler.jsonc`,
Vite `outDir`, `package.json` scripts); this doc is the map to it plus the owner-only first-deploy
steps. Decisions live here; the "why" for the product line is `gestures-spec.md` §14.

## What's wired up (in the repo)
- **`wrangler.jsonc`** — the Cloudflare project: static assets from `./dist`, route
  `andreitim.com/apps/gestures/*`, no `main` Worker (static-only). This is the source of truth for
  the deploy target; the bullets below just explain its choices.
- **`vite.config.ts`** — one `SUBPATH = 'apps/gestures'` const drives both `base` (asset URLs) and
  `build.outDir` (`dist/apps/gestures`), so the built tree matches the served route 1:1.
- **`package.json`** — `pnpm cf:preview` (local edge emulator) · `pnpm deploy` (build + ship).

## Target: Workers Static Assets (not Pages)
- Cloudflare's recommended path for new static / SPA projects; Pages is in migrate-to-Workers mode.
- **Route:** `andreitim.com/apps/gestures/*` — route-based, so other `/apps/*` tools coexist under
  one domain. (Pages custom domains bind a whole domain/subdomain and can't serve a subpath.)
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
