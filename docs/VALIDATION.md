# Kreator Studio 2.0 validation

Verified on 14 October 2026, Windows with installed Google Chrome. The local test server used port 5188; browser tests used isolated contexts and did not modify the user's saved workspace on port 5186.

| Command | Result |
| --- | --- |
| `npm test` | 34 tests passed across 3 files |
| `npm run build` | TypeScript and Vite production build passed |
| `$env:TEST_BASE_URL='http://127.0.0.1:5188'; npx playwright test` | All 8 browser tests passed in 1.2 minutes |
| `git diff --check` | Passed; Git reports Windows line-ending conversion notices |

## Browser coverage

1. Markdown tutorial with rich formatting, Python highlighting, and math; five-slide generation; chart insertion; source preservation after layout changes; separate platform captions; PNG ZIP with source/captions; independent LinkedIn variant; PDF; save and reload.
2. Campaign import preview, batch project creation, calendar dates, workspace backup and restore as copies.
3. IndexedDB version 2 legacy project and custom brand preservation through the version 3 upgrade, including save/reload.
4. Visual comparisons for Python code, standard deviation, and an explicitly simulated economic index chart.
5. Visual comparison of the Data Science template gallery.
6. Original creation/editing/persistence workflow, carousel ordering, and exported file checks.
7. Standalone equations exported to PNG and brand application.
8. Canvas dragging, undo, JSON portability, and WebM with audio.

## Visual review

Reviewed the writing workspace, code slide, equation slide, economic chart, and template gallery screenshots. Corrected indistinguishable abbreviated year labels on chart axes, increased chart label sizing, and enlarged standalone equations. Four Windows/Chrome visual baseline images are stored in `tests/visual.spec.ts-snapshots`. The final browser run compared against those baselines without updating them.

Example projects and Markdown are in `examples/`: Python/Pandas, standard deviation, and a simulated economic index with an editable chart. No example numerical data is presented as a real analytical finding.

## Test interruptions and limits

An earlier browser run spanned a long session interruption and ended with two timeouts. A fresh uninterrupted full run passed all eight tests. An initial migration test used an incorrect exact button label; its selector was corrected, and the migration workflow passed. Windows sandbox `realpath` restrictions required approved execution for Vite/build/browser commands. These issues are distinct from the final successful results.

Vite still reports large-chunk warnings and mixed static/dynamic imports for KaTeX and chart modules. These are performance opportunities, not build errors. Tests cover representative workflows and four visual baselines, not every template at every size or every browser. Dense content, unusual aspect ratios, and large media libraries still require user review. PDF output is rasterized; MP4, automatic social publishing, group transforms, and server-free PWA launch are not implemented. See the README for complete operational limits and optional improvements.
