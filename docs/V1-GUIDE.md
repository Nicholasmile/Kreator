# Kreator Studio

A free, local-first creative workspace for turning your writing into social graphics, educational carousels, and short animated videos. The interface and templates are original. There are no accounts, paid APIs, cloud storage requirements, or analytics.

## Run on Windows 11

Install a current Node.js LTS release (Node 22.12+ or Node 24 recommended). In PowerShell:

```powershell
cd D:\Data_Science_Projects\Kreator
npm ci
npm run dev
```

Open the local URL printed by Vite, normally **http://127.0.0.1:5173**. If that port is occupied, Vite selects another port. Use the same origin and browser profile to return to saved projects.

For a predictable port:

```powershell
npm run dev -- --port 5186 --strictPort
```

For a production build:

```powershell
npm run build
npm run preview
```

Serve the generated `dist` directory with any static HTTP host. Relative asset paths support deployment beneath a subdirectory. Open the app through HTTP or HTTPS rather than double-clicking `index.html`. Project URLs use a hash, so no server-side route rewriting is required. Deployment does not transfer projects between browser origins: export/import JSON to move them.

## What works

- Dashboard with six social format shortcuts and custom canvases from 100–4096 pixels per edge.
- 24 editable templates across education, mathematics, data science, research, quotes, business, tutorials, comparisons, myth/fact, product announcements, LinkedIn, and carousel covers.
- A real Konva canvas: selection, dragging, resizing, rotation, center snapping guides, zoom, and editable layers.
- Text controls for font, requested size, weight, italic style, alignment, letter spacing, color, and opacity. Position, dimensions, corner radius, and layer ordering for compatible elements.
- Shapes, decorative elements, image upload, drag/drop upload, and reuse of images already in a project.
- Split writing/design workspace with local, deterministic text layout and optional live updates.
- Carousels with independent pages, duplication, deletion, reordering by dragging or buttons, and automatic slide numbering.
- Reusable brand kits, logos, watermarks, handles, color palettes, heading fonts, and body fonts. Includes editable Karlmaths, GUIDE, and Personal Brand presets.
- Editable LaTeX math rendered through KaTeX, including fractions, roots, exponents, integrals, matrices, and symbols.
- PNG, a ZIP of every slide's PNG, raster PDF, editable project JSON, and supported WebM video export.
- Reel workspace with vertical conversion, scene durations, fade/slide/cut transitions, animated text entrances, playback, uploaded background audio, and volume control.
- IndexedDB autosave, manual save, project duplication, rename, deletion, import, and reopen.
- Undo/redo for design changes, keyboard shortcuts, labeled controls, modal focus trapping, useful error messages, and empty states.

## Create a design

1. Choose a format on Home, or use **Create a design** for a named project and custom size.
2. Choose a template. Applying a template replaces the current page's contents after confirmation; other pages are preserved.
3. Click an element on the canvas or in the **Layers** list. Edit its text and properties on the right.
4. Drag to move it. Corner handles resize it; the handle above it rotates it. Pink center guides help align it.
5. Add text, shapes, equations, and uploaded imagery from the left tools.
6. Rename the project in the top bar. Changes autosave after a short pause; **Save** writes immediately.
7. Use **Export** to download a finished file or an editable backup.

Text is measured using the actual canvas font metrics and shrinks to fit its box. A requested font size is therefore a maximum: enlarge the box if text looks too small. Supported design fonts use local system fonts; the interface's DM Sans and Manrope and KaTeX fonts are bundled with the app.

### Keyboard shortcuts

| Shortcut                             | Action                            |
| ------------------------------------ | --------------------------------- |
| Ctrl/Cmd + Z                         | Undo                              |
| Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y | Redo                              |
| Ctrl/Cmd + S                         | Save                              |
| Ctrl/Cmd + D                         | Duplicate the selected element    |
| Delete / Backspace                   | Remove the selected element       |
| Arrow keys                           | Move the selected element 1 pixel |
| Shift + Arrow keys                   | Move 10 pixels                    |
| Escape                               | Close a dialog or deselect        |

Typing fields retain their native editing shortcuts. Canvas object operations are single-selection; use the layer list when an element is covered by another.

## Turn an article into a carousel

1. Open **Carousel creator**, or switch an existing design to **Write & create**.
2. Put the headline on the first line and paragraphs or bullet points below it. **Try an example** supplies a data science article.
3. Select a design style and number of slides, then click **Generate Design**.
4. For a carousel, the engine makes a cover, content slides, and a closing call to action. Words are preserved when dividing paragraphs. It never invents factual content.
5. Turn on **Update preview as I write** for a live writing workflow. Generation replaces the current pages and can be undone. Turn live updates off before independent slide editing.
6. Reorder thumbnails by dragging them or using the arrow buttons. Add, remove, and duplicate slides in the page strip.
7. Apply a brand kit to update the whole carousel's theme, or change individual pages and elements.
8. Export a **ZIP** for every slide, a single **PNG** for the current page, or a **PDF** for the whole carousel.

The rules recognize leading heading markers, paragraphs, and `-`/`*` bullets. Double-asterisk emphasis markers are normalized to plain content; bold and italic styling currently applies to an entire text element, not individual words. Very long copy requires more slides for readability; the app refuses generation above 2,200 characters per requested slide. It uses typography and spacing rules rather than semantic AI summarization.

## Make a Reel

1. Open an existing carousel and select **Reel studio**, or start with **Reel creator** on Home.
2. Select **Convert to vertical 9:16** if needed. This scales existing positions and boxes to 1080 × 1920; review the resulting layout before exporting.
3. Select each scene in the timeline. Set its duration from 1–30 seconds and choose fade, slide, or cut for its entrance. Text fades and rises into the scene.
4. Optionally upload background audio, then set its volume. Short audio loops for the length of the video.
5. Open **Preview** and press **Play**.
6. Export **WebM**. The option appears only if the browser reports a supported WebM encoder and canvas capture API.

Recording happens in real time, at a requested 30 fps. Keep the tab visible and the computer awake. Output frame rate depends on the machine's rendering performance. Chrome or Edge on Windows is the recommended environment. A browser can advertise codec support and still fail under memory or encoder pressure; use a smaller output width if that happens. A 360 px width creates a 360 × 640 vertical video, and 1080 px gives 1080 × 1920.

No webcam or microphone is accessed. MP4 is not implemented or advertised. WebM files from MediaRecorder may lack duration metadata in some players; use a compatible player or import into a video editor. There is no separate per-element keyframe editor or independent exit-effect control; slide transitions provide the scene exit behavior.

## Brand kits and equations

Open **Brand kits** on the dashboard to create or edit a brand. Set its name, primary/secondary/accent colors, heading/body fonts, default watermark, social handle, and optional logo. In the editor, **Brand kit → Apply Brand Kit** updates theme-linked elements across all pages and replaces the watermark. Manually added images and equations retain their own appearance. Brand definitions are stored locally, separately from projects; the applied artwork travels in project JSON, but the reusable brand profile itself does not.

Choose **Text → Add an equation** for a KaTeX-compatible LaTeX expression. After insertion, select the equation and choose **Edit equation** to change it. Its editable source and high-resolution raster are stored together. The raster is shared by the canvas, PNG, PDF, and video exporters, keeping the equation's appearance consistent. Equations can be moved and resized like images. Exceptionally large upscaling can soften the raster.

Image uploads accept PNG, JPG, and WebP up to 15 MB. They are normalized to PNG and constrained to a 2,400-pixel longest edge to keep local projects manageable. Audio uploads accept browser-decodable audio files up to 20 MB.

## Exports and local storage

| Format | Contents                                                                      |
| ------ | ----------------------------------------------------------------------------- |
| PNG    | Current page, with chosen output width                                        |
| ZIP    | Every page as a numbered, full-resolution PNG                                 |
| PDF    | One raster image per document page, preserving visual layout                  |
| WebM   | Animated sequence, including uploaded audio when present                      |
| JSON   | Editable project, including pages, source writing, embedded images, and audio |

The export's longest edge is limited to 4096 pixels. JSON exports retain the project's native dimensions. Selection borders and canvas editing handles never appear in finished exports.

Projects live in IndexedDB for the current browser profile and origin. Clearing site data, using a different port, changing browsers, or moving to a deployed origin can make the existing local library unavailable. **Export JSON backups regularly.** Import them through **My projects → Import project**. Imported projects receive new identities and do not overwrite existing work. Untrusted external image URLs and SVG data are rejected during import.

The app has no remote persistence. Browser storage limits vary; large collections with audio can exhaust available space. Save errors are surfaced, and a JSON export can preserve an open project. Wait for **Saved locally** before closing the browser.

## Architecture and technology decisions

- **React 19 + TypeScript + Vite 7** for a static, client-only application. Exact dependency versions are locked in `package-lock.json`.
- **Konva 10** is used directly inside a React lifecycle component. One scene builder drives both the interactive canvas and offscreen export, avoiding separate DOM/canvas layout logic. The imperative adapter attaches transforms and guides without duplicating canvas state in React.
- **Zustand 5** holds the active project, selection, page index, and a bounded 50-step immutable history. Selection changes do not pollute undo history.
- **IndexedDB via idb 8** stores project and brand records, with a settings store for one-time brand seeding. Embedded image/audio data makes projects self-contained and portable.
- **Rule-based layout** parses content, distributes complete words, applies templates, and measures text through Konva. No AI service is needed.
- **KaTeX + html-to-image** turns mathematical markup and bundled fonts into a portable high-resolution image while retaining the expression source.
- **JSZip and jsPDF** are loaded on demand for ZIP and PDF exports. PDF is deliberately raster-based to preserve the same math, fonts, and positioning as the canvas.
- **Canvas captureStream + MediaRecorder + Web Audio** provides actual WebM rendering with optional audio. Remotion and FFmpeg are not needed for this MVP, keeping installation and rendering entirely local to the browser.
- **Lucide icons + ordinary CSS** provide a custom, responsive visual system. CSS is used instead of Tailwind to keep the visual tokens and component rules in one readable stylesheet.
- **Vitest + Playwright** cover layout/state integrity and real Chrome browser workflows.

API references: [Konva Transformer](https://konvajs.org/docs/react/Transformer.html), [MediaRecorder support detection](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static), and [canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream).

### Folder structure

```text
src/
  App.tsx          Dashboard, project library, templates, brand dialogs
  Editor.tsx       Canvas workspace, properties, writing, reels, export UI
  Canvas.tsx       Interactive Konva lifecycle and transform controls
  model.ts         Portable project schema, theme and size transformations
  templates.ts     24 original editable template definitions
  layout.ts        Deterministic writing-to-design and carousel rules
  store.ts         Zustand project actions and undo/redo
  storage.ts       IndexedDB schema, persistence, brand initialization
  render.ts        Shared scene renderer, font fitting, image and math assets
  exports.ts       PNG, ZIP, PDF, video composition, recording, downloads
  ui.tsx           Shared dialogs and small controls
  styles.css       Dashboard and editor design system, responsive rules
  *.test.ts        Unit tests
tests/
  workflows.spec.ts  Browser acceptance and file verification tests
playwright.config.ts
vite.config.ts
```

## Validation commands

```powershell
npm test
npm run build
```

Browser tests use installed Google Chrome. Start the app on port 5186 in one terminal, then run tests in a second terminal:

```powershell
npm run dev -- --port 5186 --strictPort
```

```powershell
npm run test:e2e
```

For a machine without Google Chrome, install Playwright's Chromium using `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.ts`.

Browser test artifacts are written to the ignored `test-results` directory. Tests check editing and persistence across reload, generated carousel count and ordering, PNG dimensions/signature, ZIP contents, PDF signature, WebM output, math rendering, and brand application. Screenshots are captured for visual inspection. These are targeted MVP checks, not a claim of exhaustive coverage across browsers or devices.

## Known limitations and troubleshooting

- **`vite` is not recognized after an npm permissions error:** an interrupted install can leave `node_modules` incomplete. If the npm log reports `EPERM` while unlinking `@esbuild/win32-x64/esbuild.exe`, stop any running Kreator development/preview server with **Ctrl+C** in its terminal (including an agent-started preview). Then run `npm ci --include=dev` from the project folder, followed by `npm run dev`. Do not reinstall dependencies while the server is running. Installing Vite globally does not repair this local installation.
- **Desktop editing:** the dashboard responds to narrow screens; the full editor requires approximately 750 pixels of horizontal space and scrolls on phones. Mobile/touch editing is not yet optimized.
- **Storage appears empty:** use the same browser profile and exact URL/port. Projects are not synchronized across devices. JSON import is the migration path.
- **Text is too small:** shorten the copy, enlarge its box, or distribute it across more slides. Text fitting prevents clipping but cannot make dense copy readable at every size.
- **Image/audio upload fails:** check format and size. Audio must be decodable by the current browser. SVG and remote stock-image search are not part of this MVP.
- **Video is slow or fails:** keep the tab in front, reduce output width, reduce the number of scenes, and use Chrome/Edge. Export time is at least the total scene duration plus preparation.
- **Equations fail:** check KaTeX-compatible syntax. Unsupported commands show an error and leave the current design intact.
- **Font appearance differs on another device:** design fonts are common system families and can fall back when unavailable. Export graphics on the authoring device for matching appearance.
- **Local development EPERM inside an agent sandbox:** the Windows sandbox may block Vite's `realpath` or child processes. Run the commands from a normal PowerShell terminal or grant the agent the specific build/test/server permissions. This is separate from app runtime behavior.
- **No rich text within one box:** whole-element bold/italic is supported. Mixed emphasis, bullet indentation styles, and semantic subsection parsing are future improvements.
- **No crop/mask/group tools, stock asset service, multiplayer, cloud backup, MP4, or server-side rendering.** These are intentionally outside the implemented browser MVP.

## Roadmap

1. Rich text spans, semantic section-aware pagination, and better long-article readability guidance.
2. Image crop/mask tools, grouping/multi-select, lock/hide layers, and wider keyboard accessibility.
3. Better vertical reflow, independent element animation settings, and timeline scrubbing.
4. Brand profile backup/import, storage usage reporting, and optional PWA offline installation.
5. User-installed font support, vector math export, and additional original template families.
6. A genuinely tested MP4 rendering path if browser codecs or a practical optional local renderer permit it.

All implemented features run without paid services.
