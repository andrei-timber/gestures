# Gestures

A minimalist, fast, atmospheric web app for **figure / gesture drawing practice**. Point it at a Google
Drive (or local) folder of pose references, set a couple of parameters, and it plays a timed slideshow of
random poses to draw along with — with one-key mirror, grayscale/value mode, a grid overlay, and a
pause that keeps the reference on screen. A later phase archives sessions to Drive so practice becomes
reviewable progress.

Published: https://andreitim.com/apps/gestures

This is the first of a small family of freely-published art tools, I'd like to built while learning art myself. 
Next upcoming: Ecorchet anatomy helpers and more in-depth longitudinal agentic progress tracking for self-improvement. 

This is intentionally built via Claude Code and heavily AI-generated coding approach, which is more suitable for small apps.
The rationale for such approach is three-fold: 
- to advance my own art practice without much overhead,
- to share simple niche tools that I think should be free for everyone,
- to have a sandbox and a forcing function for hands-on AI-based development explorations.

## Stack

Svelte 5 · Vite 8 · TypeScript (strict) · plain CSS with custom-property tokens. Static SPA, no backend;
deployed to Cloudflare (Workers Static Assets) under `andreitim.com/apps/gestures`.

## Develop

Requires Node 22 and [pnpm](https://pnpm.io/).

```sh
pnpm install
cp .env.example .env.local   # then add a Google Drive API key (see docs/deploy-notes.md)
pnpm dev                     # http://localhost:5173/apps/gestures/
```

The Drive key is optional — local-folder and drag-and-drop sources work without it; it only powers the
Drive share-link source.

| Script | Does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm lint` | Lint (ESLint) |
| `pnpm typecheck` | Type-check (svelte-check + tsc) |

The pre-push hook runs `test`, `lint`, and `typecheck`. Project layout and working conventions are in
[`CLAUDE.md`](./CLAUDE.md).
