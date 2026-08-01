# Gestures

A seamless web app for **figure / gesture drawing practice**. Point it at a Google
Drive (or local) folder of references, set parameters, and it plays a timed slideshow of
random poses to draw along with. Includes horizontal/vertical mirroring, grayscale/value mode, a grid overlay, and a
few other workflow settings. Finished sessions can be archived to Drive with notes so practice becomes reviewable.

Published: https://andreitim.com/apps/gestures

This is the first of a small family of freely-published art tools, I'd like to built while learning art myself. 
Next upcoming: Ecorchet anatomy helpers and more in-depth longitudinal agentic progress tracking for self-improvement. 

This is intentionally built via Claude Code and heavily AI-generated coding approach, which is more suitable for small apps.
The rationale for such approach is three-fold: 
- to advance my own art practice without much overhead,
- to share simple niche tools that I think should be free for everyone,
- to have a sandbox and a forcing function for hands-on AI-based development explorations.

## Capabilities

Point the app at a folder, choose how many poses and how long, and start. There are two modes: a class run,
where poses begin short and grow longer towards the end, and a quick run at one fixed interval. The total
time is shown before you commit to it. Mid-session you can mirror the reference, switch it to grayscale,
turn on a grid, pause without losing the pose, add time when one is going well, or move between poses.
Everything has a keyboard shortcut, and your settings are remembered for next time.

When a session ends you can log it to your own Google Drive. It creates a dated folder with your notes and
the references you just drew from, kept in order. If you attach the Photoshop file you drew in, one layer
per pose (each layer keeping Photoshop's default name, `Layer 1`, `Layer 2` and so on, numbered in the
order of the poses; a `Background` sheet and any other layers are ignored, as is whether a layer is hidden),
the app splits it apart and pairs every drawing with the reference it came from, side by side,
one image per pose. Nothing else is uploaded, and the dated folders build up into a record of your practice
you can look back through.

Because the references and the archive both live in your Drive rather than inside the app, your practice
travels with you. The app is designed to run just as easily on an iPad or iPhone as on a laptop, so you can
open it next to your sketchbook wherever you are and pick up the same references and past sessions.

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

The Drive key is optional: local-folder and drag-and-drop sources work without it; it only powers the
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
