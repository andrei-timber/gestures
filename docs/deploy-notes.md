# Deploy notes — Cloudflare

Locks the deploy model so the later Cloudflare setup-guide track (spec §14) starts with decisions
already made. No wrangler / deploy config exists yet — this is intent, not implementation.

## Target: Workers Static Assets (not Pages)
- Cloudflare's 2026-recommended path for new static / SPA projects. Pages is in migrate-to-Workers mode.
- **Route:** `andreitim.com/apps/gestures/*` — route-based, so other `/apps/*` tools can coexist under
  the one domain. (Pages custom domains bind a whole domain/subdomain and can't serve a subpath.)
- **Assets** mirror the subpath at deploy (`dist/apps/gestures/…`); Vite `base` is `/apps/gestures/`,
  so the built asset URLs already match the route.
- **SPA fallback:** `not_found_handling: "single-page-application"` → deep links and refreshes serve
  `index.html`.

## Static now; a Worker only if a real need appears
No server code in v1. A small Worker shows up only if a future need does: an image-proxy / cache, or
sessions longer than the ~1h token lifetime (refresh tokens need a client secret → a backend). All
deliberately avoided so far.

## No client secrets
- Drive read (Tier 1): public API key, **referrer-restricted to andreitim.com**.
- Drive write (Tier 2): client-side GIS token, `drive.file` scope. No refresh token, no client secret.

## Static vs dynamic — where the line is
- **Static** = files identical for every request (HTML / JS / CSS / images), built once by `vite build`
  and served verbatim from the edge. No per-request server code. Free and instant.
- **Dynamic** = computed per request on a server: SSR, API endpoints, exchanging a secret for a token,
  database reads, per-user personalization, request-time redirect logic. Each needs a Worker.
- **Gestures is fully static:** the timer, shuffle, mirror / grayscale, and canvas compositing all run
  in the browser; Drive calls go browser → Google directly. Nothing is computed on a server.
