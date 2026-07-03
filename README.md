# Gestures

A minimalist, fast, atmospheric web app for **figure / gesture drawing practice**. Point it at a Google
Drive (or local) folder of pose references, set a couple of parameters, and it plays a timed slideshow of
random poses to draw along with — with one-key mirror, grayscale/value mode, a grid overlay, and a
pause that keeps the reference on screen. A later phase archives sessions to Drive so practice becomes
reviewable progress.

The first of a small family of freely-published art tools, built while learning to draw.

> **Status:** early development. The full specification (what, why, and every decision) lives in
> [`gestures-spec.md`](./gestures-spec.md); the competitive/technical research substrate is in
> [`gestures-apps-examples-research.md`](./gestures-apps-examples-research.md). This README is a map,
> not a copy — see the spec for details.

## Stack

Svelte 5 · Vite 8 · TypeScript (strict) · plain CSS with custom-property tokens. Static SPA, no backend;
deployed to Cloudflare (Workers Static Assets) under `andreitim.com/apps/gestures`.

## Develop

Requires Node 22 and [pnpm](https://pnpm.io/).

```sh
pnpm install
pnpm dev        # http://localhost:5173/apps/gestures/
```

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
