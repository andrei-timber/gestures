# Gestures — Creative Direction

> **North star:** a quiet nocturnal studio — the reference is lit, everything else recedes into
> atmospheric dark, and the only colour the chrome ever raises is a calm signal about *time*.

This doc holds **intent**; the **math lives in code**. Every hex value is a semantic token in
`src/app.css` — that file is the one canonical home for the numbers, and all chrome reads tokens (no
colour literals in components). This doc says *why* those tokens are what they are, tracks what's
`decided` vs `TBD`, and parks taste calls in the queue at the bottom. It reuses Ondalu's creative-doc
*pattern*, not its content (Ondalu is 3D/Three.js — no reusable web tokens; spec §14).

Product-level "design & feel" intent stays in `gestures-spec.md` §8; this is the build-level system.

---

## The system

**`decided`** — dark-only, atmospheric, minimalist; full-bleed reference, generous negative space,
quiet chrome. One accent per theme; semantic colour (the pace ramp) is separate from the accent.

The chrome is a small **semantic token set** (`src/app.css`), theme-agnostic in name so it doubles as
the future tool-family kit:

| Token | Role |
|---|---|
| `--bg` | app canvas / letterbox behind the reference |
| `--surface` | elevated panel (Setup) |
| `--fg` / `--fg-muted` | primary / secondary text + icon |
| `--accent` / `--on-accent` | identity accent (primary action, active state) + ink on top of it |
| `--grid` | construction-grid stroke |
| `--pace-1 … --pace-4` | pace ramp, calm → urgent (semantic, not the accent) |

**Frosted glass** (`.glass`, global) — `decided`. A translucent pill (`blur(14px) saturate(1.6)`, a
52% wash of `--bg`, white hairline + inset highlight) so controls stay legible over bright references.
Reads `--bg`, so it re-tints with the theme. Shared by the clock, nav arrows, pause badge, HUD chips,
and the theme picker.

**Pace cue** (`cue.ts` → `.clock.cue-*`) — `decided`. A faint wash of the band hue over the glass,
warming green → yellow → orange → red as a pose drains; the red band lifts a soft glow. The band hues
are `--pace-*` tokens, so the cue is tinted per theme. *Intent: a calm peripheral "where am I in this
pose" signal, no sound.*

**Motion** — `decided` (light-touch). Cue/theme transitions ease over `0.35–0.6s`; hovers and toggles
over `0.15s`. Nothing announces itself; motion confirms, never entertains. Honour
`prefers-reduced-motion` as surfaces grow.

---

## Themes (`decided`)

Three dark, atmospheric palettes ship as user-pickable token sets. **Candlelit is the first-run
default.** The picker is **Setup-only**, **icon-only** swatch pills (owner's calls), and re-tints the
whole app live; the choice persists via the settings store (`theme` field). Exact hex per theme live
in `src/app.css`.

| | Theme | Character | Accent |
|---|---|---|---|
| ① | **Moonlit** | nocturnal, calm; blue-cyan glow over blue-biased black | cool blue |
| ② | **Candlelit** *(default)* | incandescent, intimate; amber warm-white over warm charcoal — drawing by lamplight | amber |
| ④ | **Sanguine** | old-master atelier; sanguine red-chalk on warm cream over umber-black | sanguine red-brown |

(Numbering keeps the Round-1 comparison labels; ③ *Neutral · Single jewel* and ⑤ *Twilight ember* were
explored and set aside — see queue.)

---

## Taste queue (owner) & TBD

- **`TBD` — pace ramp, universal vs theme-pulled.** Ramp stays semantic green→red in every theme, but
  each theme's calm/urgent bands are nudged toward its palette (e.g. Sanguine's calm as olive, Moonlit's
  as teal). Revisit whether to pull them further or keep them near-universal for instant legibility.
- **`TBD` — display typeface.** Type is still `system-ui` across all three. A characterful serif display
  (classical drawing tradition) for the Setup title / recap could deepen the atmosphere without cost to
  speed. Not yet attempted — keep or originate next round.
- **`TBD` — in-session theme switch.** Deferred: picker is Setup-only to keep the drawing view bare.
  Revisit if switching mid-session is wanted.
- **`TBD` — more themes.** ③ Neutral-jewel and ⑤ Twilight-ember are parked, not killed. ③'s indigo read
  close to a known design default; if revived, pick a less-expected jewel.
- **`decided` (set aside)** — the two directions above were dropped from Round 1 in favour of the three
  warm/cool identities the owner chose to ship as a switchable set.

---

*Round 1 comparison artifact (5 directions, real chrome per palette): built 2026-07-04, owner picked
①②④ and asked to ship them as a user switch rather than lock one.*
