# Design note — folder-picker permission prompt (options survey)

**Supersedes** the earlier `folder-picker-permission.md` (deleted 2026-07-04). That note only weighed
`webkitdirectory` vs `showDirectoryPicker()`; this one is the fuller survey after researching how apps
like Google Drive / Dropbox avoid the prompt, and adds the **drag-and-drop** path (previously
unconsidered) plus the other untried options.

**Status:** **drag-and-drop shipped (2026-07-04)** as an *additional* affordance beside the
`<input webkitdirectory>` button (`FolderInput.svelte` drop zone → `filesFromDataTransfer` →
`source.load`). Recursion + batch-loop is unit-tested (`dropped-files.test.ts`); the drop→load wiring
and the drag highlight are browser-verified. **One check still owner-only:** whether a real drag of the
1085-jpg mojibake library returns all 1085 (native OS drag can't be automated) — see the experiment
below. If it under-counts, the drop path shares `showDirectoryPicker`'s bug and should be reconsidered;
the button remains the safe fallback regardless.

## The problem, restated

`src/ui/FolderInput.svelte` picks the reference folder with `<input type="file" webkitdirectory>`.
Selecting a **whole directory** through that input makes Chrome show its hardcoded, un-suppressable
worst-case warning:

> *"This will upload all files from [folder] to [site]. Do this only if you trust the site."*

It's misleading — nothing is uploaded; `source.load` only reads `File` objects locally, no network, no
backend (spec §9). But the dialog is browser chrome we can neither reword nor suppress, and to a
non-technical user it reads as "this site is about to exfiltrate thousands of my files."

## Why Google Drive / Dropbox users never see this

The dialog is **specific to selecting a directory via the native folder chooser** (`webkitdirectory`),
and is Chrome-only — Firefox/Edge don't show it. It does **not** fire for:

- **Individual file selection** — `<input type=file multiple>` (the ordinary picker). No folder → no
  dialog. This is the overwhelmingly common upload flow.
- **Drag-and-drop** — dragging files *or a folder* onto a drop zone shows **no prompt at all**.

Drive/Dropbox don't dodge the dialog with a trick — their default flows are drag-drop or individual
files, so the directory-chooser path is never exercised. Their "Upload folder" *button* still produces
the same Chrome dialog; users just rarely click it. So the observation "I never see a popup on those
sites" is consistent: nobody's selecting a folder through a form input there.

## Option space

| # | Approach | User-facing prompt | Cross-browser | Mojibake risk | Status |
|---|---|---|---|---|---|
| A | `<input webkitdirectory>` | **scary** "upload all files" | Chrome/FF/Edge (dialog Chrome-only) | none — read all 1085 | **current** |
| B | `showDirectoryPicker()` handle | gentle "view files?" | Chromium only | **drops odd-named files** | tried, **reverted** |
| C | Drag-drop folder → `webkitGetAsEntry()` | **none** | Chrome 21+, FF (webkit-prefixed), Safari | **likely OK** (legacy Entry path, like A) — untested on real lib | **shipped 2026-07-04** |
| D | Drag-drop folder → `getAsFileSystemHandle()` | **none** | Chromium only | **likely same bug as B** (same handle type) | untried, deprioritized |
| E | `<input type=file multiple>` (files, not folder) | none | all | none | untried — bad UX for 1000+ refs |

Plus F: the inline reassurance line (*"Files stay in your browser — nothing is uploaded"*), already
shipped, kept regardless of which path wins.

## What shipped — drag-and-drop the folder (C)

Dragging a folder from Finder onto a drop target reads the whole tree with **zero permission dialog**:
the drag gesture *is* the user's grant, so the browser asks nothing further ([web.dev](https://web.dev/patterns/files/drag-and-drop-directories),
[MDN webkitGetAsEntry](https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry)).

```js
async function filesFromDrop(dataTransfer) {
  const files = []
  const walk = (entry) => new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((f) => { files.push(f); resolve() })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const readBatch = () => reader.readEntries(async (batch) => {
        // readEntries returns in BATCHES (~100 in Chrome); an empty array means done.
        // Missing this loop silently truncates large folders — call until empty.
        if (!batch.length) return resolve()
        await Promise.all(batch.map(walk))
        readBatch()
      })
      readBatch()
    } else resolve()
  })
  const roots = [...dataTransfer.items]
    .map((i) => i.webkitGetAsEntry())
    .filter(Boolean)
  await Promise.all(roots.map(walk))
  return files.filter(isImage)   // reuse source.load's image filter
}
```

`source.load`'s contract (an array of `File`s) is unchanged, so the state layer stays untouched — same
as the current picker. Ships alongside the button, not replacing it: a "…or drop a folder here" drop
zone on the same screen.

**Two silent-truncation traps to respect:**
1. `readEntries()` batches — loop until it returns `[]` (handled above). Forgetting this is its own way
   to silently lose files past the first ~100.
2. Use `webkitGetAsEntry()` (option C), **not** `getAsFileSystemHandle()` (option D), for the drop.
   D returns the *same handle type* as `showDirectoryPicker()`, so it most likely inherits the exact
   mojibake-drop bug that killed B. The legacy Entry path (C) is a different, older enumeration — the
   one most likely to behave like `webkitdirectory` (A), which read all 1085 clean. This is a
   hypothesis, not a verified fact — see below.

## Why B was reverted (carried forward, so the old note can be deleted)

`showDirectoryPicker()` was built and backed out on **2026-07-03**: on the owner's real library it
returned **0 files** for a folder of 1085 mojibake-named jpgs. Chrome silently drops files whose names
hold odd characters (nbsp U+00A0, soft-hyphen U+00AD, combining marks) *before* JS sees the handle —
no error, no recovery. `webkitdirectory` read all 1085. Silent, undetectable file loss is worse than a
scary prompt for a reference library, so A stayed. See `decisions.md` (2026-07-03, two entries).

The persistable-handle bonus of B/D (store the handle in IndexedDB → re-open last folder without
re-picking) is real but orthogonal, and only the handle-based paths (B, D) support it — neither A nor C
can. Not worth reviving the mojibake bug for.

## The one check still open (owner-only)

Drag `~/Art Practice/Refs` (the 1085-jpg mojibake library) onto the shipped drop zone and confirm the
loaded count.

- **1085 → done**; C is strictly better than the scary prompt on the drag path, A stays as the click
  fallback.
- **< 1085 → the Entry API shares B's bug**; drop the prompt-free claim for that library and lean on
  A + the reassurance line (leave C for well-named folders, or remove it).

Native OS drag can't be automated (the drop payload comes from Finder, outside page scope), so this is
an **owner-run manual check**, not a vitest surface — matches the repo's browser-verify split. The
recursion/batch logic and the drop→load wiring are already covered (unit tests + a synthetic-drop
browser check); only the real-library file-count needs a human.

## Spec

Source-picking UX — worth a line in `gestures-spec.md` (local-folder source) once a direction is
committed.

## Sources

- [web.dev — drag and drop directories](https://web.dev/patterns/files/drag-and-drop-directories)
- [MDN — DataTransferItem.webkitGetAsEntry()](https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry)
- [Chrome for Developers — drag and drop a folder onto Chrome](https://developer.chrome.com/blog/drag-and-drop-a-folder-onto-chrome-now-available)
- [MDN — HTMLInputElement.webkitdirectory](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory)
