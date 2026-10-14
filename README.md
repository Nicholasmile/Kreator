# Kreator Studio 2.0

A free, local-first Data Science writing and design workspace for **Malik Kolade**. Write Markdown, preserve editable code and equations, build carousels, plan a campaign, and export graphics without accounts, commercial APIs, or cloud storage.

## Launch in VS Code on Windows

Use Node.js 22.12+ or 24. Open this folder in VS Code, then use its PowerShell terminal:

```powershell
cd D:\Data_Science_Projects\Kreator
npm ci --include=dev
npm run dev -- --port 5186 --strictPort
```

Open **http://127.0.0.1:5186** in your usual browser profile. Continue using the same origin and port to see existing local projects. After the first install, only the `npm run dev` command is needed. Stop the server with Ctrl+C before reinstalling dependencies.

If `vite` is not recognized, the installation did not finish. For an `EPERM` error involving `esbuild.exe`, stop Kreator servers in your terminals, then retry `npm ci --include=dev`. Installing Vite globally does not repair this local installation. Build/test `realpath` errors inside an agent sandbox require permission for those commands; normal VS Code PowerShell is independent of that sandbox.

```powershell
npm run build
npm run preview -- --port 5186 --strictPort
```

The production files are in `dist`. Use an HTTP server, not a double-clicked HTML file. Hash-based project routes support static hosting. Changing hosting origin does not move your browser data automatically.

## Your first technical carousel

1. Choose **Write**, or open a project and select **Write & create**.
2. Paste Markdown or load the Python, statistics, or economics example. The left panel is CodeMirror source; the centre renders formatted text, tables, highlighted code, and KaTeX equations.
3. Choose **Malik Kolade**, a visual style, composition, and five slides. Use explicit `---` slide breaks when you want precise editorial control.
4. Select **Generate Design**. Review the slides, then append them or choose **Use generated slides**. Source edits never regenerate existing designs automatically. Replacing slides is undoable.
5. Select a slide, choose **Chart**, paste your own CSV, and insert it. Use **Page layout** to rearrange its content. Individual text/code/rich/chart objects remain editable.
6. In **Platform captions**, save independent Instagram and LinkedIn drafts. The original tutorial and manual summary remain separate.
7. Export an Instagram **ZIP** with PNG slides, optionally including captions and source. **Repurpose for Platform** creates an independent LinkedIn project; export that as PDF.
8. Wait for **Saved locally** before closing. Reopen through **My projects**. Use **Save writing to Library** to create or update a linked campaign item explicitly.

### Markdown conventions

Supports H1–H6, bold, italic, strikethrough, ordered/unordered lists, blockquotes, callouts, links/reference definitions, tables, inline code, fenced code, inline `$...$` and block `$$...$$` math.

````markdown
# Start with a question

Explain **why** this matters, with a source.

```python
import pandas as pd

for column in df.columns:
    print(column)
```

---

# Explain the calculation

$$
\bar{x} = \frac{1}{n}\sum_{i=1}^{n}x_i
$$

> [!TIP]
> Check the units before sharing a result.

<!-- notes: Explain the denominator aloud. -->
````

Use `---` as a slide separator and `***` as a visual divider. `<!-- slide: Your title -->` starts a named slide; `<!-- notes: ... -->` stores speaker notes. Explicit breaks take priority over requested slide count. Automatic pagination keeps semantic blocks intact; it does not summarize or split code/equations. For dense material, shorten blocks or add explicit breaks.

Raw HTML is omitted from rendered output and retained in source. Markdown images must be embedded PNG/JPEG/WebP data URLs; an optional image title becomes the caption. Remote images display a placeholder. Upload normal image files through Assets or the canvas image tools instead. Links are sanitized. Code and Markdown are never executed.

### Code, math, and charts

**Code studio** offers Python, SQL, R, JavaScript, TypeScript, HTML, CSS, JSON, Bash, Stata, and plaintext (including EViews). Configure dark/light cards, filename, line numbers, highlighted lines (`2,4-6`), wrapping, padding, and transparent backgrounds. Select a code object for canvas font and box controls. Copy keeps indentation. Rich formatting is edited through source and toolbar controls rather than a WYSIWYG rich-text selection editor.

Equations retain LaTeX source. Use Markdown math or **Text → Add an equation** for a standalone equation. KaTeX supports fractions, matrices, roots, integrals, and Greek symbols; unsupported commands require correction.

Charts support bars, lines, scatter, histograms, pie, and KPI. Paste `label,value` or `label,x,y` CSV/TSV; quoted CSV labels and numeric validation are supported. Set labels, colors, highlighted observations, annotations, and pie legends. Bars include zero; scatter/line use numeric x positions; histograms count observations. Pie rejects negative values. No findings or source data are generated. Use Markdown tables for editable comparison tables. Review dense labels and the visible chart before exporting.

## Templates, branding, and canvas editing

There are **80 editable templates**: the original 24 plus 56 technical/editorial templates across 14 new families, for 19 underlying compositions. Families include Python notebooks, SQL walkthroughs, research memos, formulas, comparisons, data stories, portfolios, and vertical lessons. The gallery has actual rendered thumbnails, tags/search, category/platform filters, favorites, and recent templates.

**Brand kits** includes Malik Kolade plus retained Karlmaths, GUIDE, and existing custom profiles. Edit colors, fonts, handle, positioning, signature, logo/profile photo, footer placement, tone, and default caption. Six styles include Dark Editorial, Clean Light, Academic Minimal, Code Studio, Data Visualization, and Professional LinkedIn. Changing a reusable brand does not alter saved artwork until you apply it. The per-page **Brand footer** toggle controls visibility.

The canvas supports dragging, sizing, rotation, snapping, zoom, layer order, lock, image crop/circle mask, opacity, and group/align. Grouped unlocked objects move together after dragging; group rotation/scaling is not implemented. **Focus canvas** collapses side tools; desktop panels can be resized. Pages can be reordered, duplicated, added, and removed.

**Repurpose for Platform** offers Instagram, LinkedIn, Facebook, X, and WhatsApp presets, including portrait, square, banner, and vertical formats. It reflows semantic objects into a new project with independent IDs and keeps source/captions. It removes decorative shape layers during reflow; review short banners and dense content. These are editable starting sizes, not a guarantee of every platform's current upload rules.

| Shortcut                       | Action                    |
| ------------------------------ | ------------------------- |
| Ctrl/Cmd+Z                     | Undo                      |
| Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y | Redo                      |
| Ctrl/Cmd+S                     | Save                      |
| Ctrl/Cmd+D                     | Duplicate selected object |
| Delete/Backspace               | Remove unlocked selection |
| Arrows / Shift+Arrows          | Move 1 / 10 pixels        |
| Escape                         | Deselect or close dialog  |

Typing fields keep native editing shortcuts. Fitting can shrink text significantly; density warnings are heuristic. Inspect every slide at its intended display size.

## Library, calendar, and assets

Store ideas with topic, campaign/day, status, date, Markdown, captions, narration, references, notes, and linked designs. Use list, Kanban, month, or week views and filters. Statuses are Idea → Draft → Designing → Ready → Published. The calendar is a manual planner and does not publish posts.

**Import campaign** accepts Markdown, JSON, CSV, and TSV, with a preview before saving. Import up to 500 items / 20 MB at a time. CSV headers can include `day,title,markdown,caption,script,campaign,topic,status,scheduledDate,format,instagramCaption,linkedInCaption`. Quote multiline fields. JSON accepts an array or `{ "items": [...] }`; a `slides` array becomes separated Markdown slides. Markdown campaign files split at `# Day 31: Title` headings outside code fences. The importer recognizes explicitly supplied fields and never fills missing days or claims. Select imported items and create linked designs in a batch.

Revision history records save/status events, not complete recoverable snapshots. Linked content records show recent exported filenames and times. Separate project snapshots update through explicit actions rather than background synchronization.

Assets accept local PNG/JPEG/WebP photographs, logos, screenshots, illustrations, and exported charts. Rename, tag, search, download, and reuse them. Uploads are limited to 15 MB and normalized to a maximum 2,400-pixel edge. Asset storage usage is shown; browser quota can still be exhausted by large collections. Embedded project assets remain when you delete a library asset.

## Reels and exports

The existing Reel workspace retains scene timing, fade/slide/cut transitions, animated entrances, audio upload/volume, preview, and real-time WebM output. New scene notes and manually entered subtitles travel with projects. Rich/code/chart objects use the shared scene animation; there is no per-token code animation or data-interpolation timeline. Export a selected scene as a cover graphic. Audio uploads are limited to 20 MB.

Keep the recording tab visible and the computer awake. Browser encoder support and machine performance determine video success. Smaller output widths reduce memory pressure. **MP4 is not implemented.** WebM duration metadata may be absent in some players.

| Export     | Output                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| PNG / JPEG | One selected slide at chosen resolution                                               |
| ZIP        | Selected numbered PNG slides, optional related platform variants, source and captions |
| PDF        | Selected slides as raster document pages                                              |
| JSON       | Editable project with source, code/chart configuration, images and audio              |
| Markdown   | Original source                                                                       |
| Captions   | Platform drafts in a text file                                                        |
| WebM       | Selected scenes with supported animation/audio                                        |

The dialog provides a preview, editable filename, output width, background, page selection, and clipping/density warnings. A campaign day prefixes filenames. Longest output edge is capped at 4096 pixels. PDF text is rasterized, not selectable; extremely enlarged equations/code can soften. Canvas editing controls are excluded from export.

## Local storage, migration, and backups

IndexedDB schema 3 adds content and assets to the existing project/brand/settings stores. Project schema 1 upgrades to 2 without changing saved page positions or IDs. Malik's brand is seeded once without replacing custom profiles. Imported project files receive fresh IDs. Workspace restore previews the import and creates copies with remapped relationships; existing records remain.

Use **Library → Backup workspace** to preserve projects, brand kits, content, and assets together. **Restore workspace** imports that backup. Gallery preferences are local settings and are not included. Project JSON remains useful for sharing one design.

There is no cloud synchronization or automatic remote backup. Clearing site data or changing browser/profile/port changes access to local work. Keep backups outside browser storage. Fonts and application dependencies are bundled; core workflows work without internet once installed while the local server is available. There is no installable PWA/service worker for server-free offline launch.

## Example projects

Import the JSON files through **My projects → Import project**, or paste their Markdown into Write:

- [Python tutorial](examples/python-tutorial.json) · [Markdown](examples/python-tutorial.md)
- [Standard deviation](examples/statistics-spread.json) · [Markdown](examples/statistics-spread.md)
- [Economic index chart](examples/economics-simulated-index.json) · [Markdown](examples/economics-simulated-index.md)

All numerical examples are illustrative. The economic index is explicitly simulated and is not official Nigerian data. `node scripts/generate-examples.mjs` rebuilds the editable examples from source.

## Architecture and changed modules

The existing React 19 / TypeScript / Vite 7 / Konva 10 / Zustand architecture is retained. `src/model.ts`, `storage.ts`, and `store.ts` extend schemas and persistence; `App.tsx` and `Editor.tsx` integrate the new workspaces; `Canvas.tsx`, `render.ts`, and `exports.ts` share output rendering. `templates.ts` retains the original template collection.

`src/studio/` contains the Markdown pipeline, CodeMirror wrapper, rich raster rendering, chart renderer, semantic composition/reflow, technical tools, writing workspace, campaign importer, library/calendar/assets, template families/gallery, export dialog, types, and bundled examples. Writing and library workspaces load on demand. Main/editor bundles remain substantial; further splitting is an optional performance improvement.

New dependencies: `@uiw/react-codemirror`, `@codemirror/lang-markdown`, `@codemirror/language-data`, `unified`, `remark-parse`, `remark-gfm`, `remark-math`, `remark-rehype`, `rehype-sanitize`, `rehype-katex`, `rehype-stringify`, and `highlight.js`. Exact versions are in `package-lock.json`. Sanitization precedes KaTeX/highlighting. No subscription or API key is needed. Chart rendering uses a local SVG implementation; output is composed through Konva.

The audit and compatibility decisions are in [UPGRADE-PLAN.md](UPGRADE-PLAN.md). The previous guide is archived at [docs/V1-GUIDE.md](docs/V1-GUIDE.md) for historical reference only.

## Validation

```powershell
npm test
npm run build
```

Browser tests use installed Google Chrome. With the server running, execute in another terminal:

```powershell
$env:TEST_BASE_URL='http://127.0.0.1:5186'
npm run test:e2e
```

Tests use isolated browser contexts. Visual baselines in `tests/visual.spec.ts-snapshots` are Windows/Chrome-specific. Review intentional changes before running `npx playwright test tests/visual.spec.ts --update-snapshots`. Downloads, screenshots, and failure traces are written to ignored `test-results`.

Validation results are recorded in [docs/VALIDATION.md](docs/VALIDATION.md). Coverage includes legacy migration, Markdown safety, source/indentation preservation, math/highlighting, chart scaling, 80 template definitions, platform reflow, persistence, undo, backup/restore, PNG dimensions, ZIP/PDF/WebM validity, and representative visual layouts.

## Practical limits and optional improvements

Desktop Chrome is the tested environment. Small screens can scroll the editor; touch editing and other browsers need broader coverage. Very dense slides, huge tables, many chart labels, and extreme aspect ratios still need manual editing. Rich objects retain editable source but are rasterized inside canvas output; mixed spans are not individually draggable. Platform variants are independent snapshots, not live-linked copies.

Optional future work includes PWA installation, user-installed fonts, vector PDF/math, richer group transformations, timeline/keyframe editing, additional visual regression coverage, and a dependable locally tested MP4 path. There are no AI writing services, social publishing integrations, collaboration server, or stock asset subscriptions.
