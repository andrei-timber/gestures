# Gestures

Minimalist, fast, atmospheric web app for figure / gesture drawing practice: point it at a Google Drive
(or local) folder of pose references and it plays a timed slideshow to draw along with.

Canonical spec: `gestures-spec.md` (what / why / all product decisions). Research substrate:
`gestures-apps-examples-research.md`. **This file is a map, not a copy** — it points into the spec
rather than restating it.

## Stack & layout
- Svelte 5 + Vite 8 + TS (strict) + plain CSS with custom-property tokens. Static SPA, no backend (spec §9).
- `src/ui` components · `src/lib` framework-free helpers (`unreachable`, `constants`) · `src/state`
  shared reactive state as `*.svelte.ts` rune modules (session engine, settings store) — added in M0.
- `@/*` → `src/*`. App is served under `/apps/gestures/`: build runtime asset URLs from
  `import.meta.env.BASE_URL`, never a hardcoded leading `/`.
- Deploy: Cloudflare Workers Static Assets — see `docs/deploy-notes.md`.

## Commands
`pnpm dev` · `build` · `test` (vitest) · `lint` (eslint) · `typecheck` (svelte-check + tsc).
The Husky **pre-push** gate runs test + lint + typecheck (no pre-commit).
Browser-verifying the session? Use the owner's real reference library at `~/Art Practice/Refs`
(subfolders of `.jpg` poses) as the local-folder source — don't generate throwaway images.
The native folder picker can't be driven by automation, and `file_upload` no longer accepts host
paths, so **inject files into the hidden `<input type=file>` instead**: `sips -Z 1400` a few refs to
shrink them, copy into `public/` (Vite serves it at `BASE_URL`), then in-page `fetch` each → build
`File`s → `input.files = dataTransfer.files` → dispatch `change` (fires `source.load`). Clean the
`public/` copies before committing. Resizing the OS window often won't shrink `innerWidth` (maximized);
to test responsive HUD wrapping, set `.screen { width: … }` via the page console and measure instead.

## Work cadence  (`/session-start` and `/session-wrap` point here)
State lives in `docs/STATUS.md` (single status surface) and `docs/decisions.md` (append-only dated
Y-statement log). Product decisions stay in `gestures-spec.md`; `docs/decisions.md` logs build-level ones.
- **Session-start** — read `docs/STATUS.md`, orient in 2-3 sentences (where things stand, what's next,
  blockers), then agree **Scope + Definition-of-done** before editing. A plan-gate whether or not plan
  mode is on: apply nothing until scope is agreed.
- **Session-wrap** — a lightweight reconcile (not a milestone close): tick done steps and reset the
  STATUS "Now" (next step + its verify command), append any decisions, park discovered out-of-scope work
  in the STATUS Follow-ups queue, suggest a semantically-contained commit. **Never auto-commit.**
- **Milestone boundary (grooming)** — at a milestone's *finish* (session-wrap), archive its step ledger
  to `docs/history.md` and clear it from STATUS; at a milestone's *start* (session-start), lay out the
  new milestone's step ledger in STATUS before scoping the first session.

## Habits
- One canonical home per fact; derived docs are maps, not copies.
- Test the logic; browser-verify UI. Visual layers stay out of coverage.
- Subtle visual/timing polish (fades, warm-ups, easings, anim durations): verify the *logic*
  numerically (assert the state/class/threshold flips), then hand the fine visual check to the owner —
  don't burn tool calls trying to screenshot a moving target.
- Scoped conventional commits; never auto-commit. Memory is suggest-only.
- **Add structure, not vigilance** — when the same mistake recurs, add a small gate/affordance where the
  friction is, rather than resolving to be careful. Willpower doesn't scale across sessions.
- No product name in reusable paths (keeps this generic as the future tool-family template).

## Deferred / not adopted (revisit when…)
- Per-directory coverage thresholds — when the suite is large or slow.
- Integration/unit test-lane split (`*.int.test.ts`) — when baking/integration tests appear.
- `.claude/rules/` — when this file nears ~200 lines.
- Milestone-file template, retrospective/distillation ritual, vertical-slice naming — when a milestone
  genuinely needs the extra structure.
