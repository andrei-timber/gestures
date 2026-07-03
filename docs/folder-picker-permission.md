# Design note — folder-picker permission prompt

**Status:** proposed, not built. Parked as a Follow-up in `STATUS.md`.
**Origin:** the browser shows a scary upload disclaimer when picking a folder (2026-07-03).

## Problem

`src/ui/FolderInput.svelte` picks the reference folder with the classic
`<input type="file" webkitdirectory>`. Semantically that element *attaches every
file in the directory to a form for upload*, so Chrome shows its hardcoded,
worst-case warning:

> *"This will upload all files from [folder] to [site]. Do this only if you
> trust the site."*

The warning is **misleading**: nothing is uploaded. We only read the `File`
objects locally in the browser (`source.load`) — no network, no backend (spec
§9). But the browser can't infer intent, so it shows the upload dialog for any
`webkitdirectory` input, and the dialog is browser chrome we can neither reword
nor suppress. For an unknowledgeable user it reads as "this site is about to
exfiltrate thousands of my files."

## Approach — two independent, additive fixes

### 1. File System Access API (the real fix)

Swap `webkitdirectory` for `window.showDirectoryPicker()`. Its permission prompt
is gentle and *accurate*:

> *"Let [site] view files? — View files / Cancel"*

No "upload," no "thousands of files," framed as read-only viewing. It returns a
directory **handle**; iterate it to collect `File`s:

```js
const dir = await window.showDirectoryPicker()
const files = []
for await (const entry of dir.values()) {
  if (entry.kind === 'file') files.push(await entry.getFile())
}
source.load(files)
```

Bonus: the handle is persistable (IndexedDB), which could later let us
remember / re-open the last folder without re-picking.

**Trade-offs:**
- **Chromium-only.** `showDirectoryPicker` is absent in Firefox and Safari — keep
  the `webkitdirectory` `<input>` as a fallback where the API is missing (feature
  detect `'showDirectoryPicker' in window`). The scary dialog still shows on those
  browsers, but the owner's own browser (Chromium, the deploy target) gets the
  clean prompt.
- Requires a secure context — already satisfied (HTTPS / localhost).
- Recursion: `dir.values()` is one level; recurse into subdirectories if we want
  nested reference folders (current `webkitdirectory` walks the tree for free).

### 2. Inline reassurance (cheap, complements #1)

Add a one-line note near the pick button — e.g. *"Files stay in your browser —
nothing is uploaded."* Defuses the dialog socially and still helps on the
`webkitdirectory` fallback path where the scary prompt persists. Low effort,
independent of #1.

## Why it fits the architecture

Purely a source-picking UI concern in `FolderInput.svelte`; `source.load`'s
contract (an array of `File`s) is unchanged, so the state layer stays untouched.
Matches the repo's "browser-verify UI" split — no new vitest surface.

## Verify

Browser only. On Chromium, load `~/Art Practice/Refs` via the new picker and
confirm the prompt reads "view files" with no upload warning; confirm the same
image count loads as the old input. Feature-detect fallback: confirm a
non-Chromium browser (or forced fallback) still works via `webkitdirectory`.

## Spec

Source-picking UX — worth a line in `gestures-spec.md` (local-folder source)
once a direction is committed.
