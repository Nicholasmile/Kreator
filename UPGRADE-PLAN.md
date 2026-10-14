# Kreator Studio 2.0 implementation plan

## Audit — 13 October 2026

The repository is clean at the start of this upgrade. The original React/TypeScript/Vite application is intact. Konva's shared scene builder feeds editing and PNG/PDF/video output; it should be extended, not replaced. Zustand keeps immutable project history. IndexedDB version 2 stores projects, brands, and settings. Project JSON has schema version 1. The 24 templates are editable, with five underlying compositions. The writing engine removes emphasis and divides whitespace-delimited words; code indentation and semantic blocks are not represented. Live regeneration replaces all pages. Richer content needs its own parsed representation and editable source-backed canvas objects. The existing tests cover persistence, transformations, brand application, PNG/ZIP/PDF/WebM, audio and equations.

## Implementation sequence

1. Add project schema v2 and additive IndexedDB migrations, personal branding, platform configuration, source/caption metadata.
2. Add semantic Markdown parsing, CodeMirror, sanitized preview, reusable code/rich-content rendering, safe pagination and explicit regeneration.
3. Expand editable composition families and the gallery; add brand styles and independent platform reflow variants.
4. Add caption drafting, structured content library, campaign import preview, calendar and local backup/restore.
5. Add editable charts, reusable assets, selected-page/JPEG/source/caption exports, scene notes/subtitles and canvas controls.
6. Extend unit and browser coverage, inspect real outputs, run production build and document limits honestly.

## Compatibility decisions

- Existing projects retain IDs, source text, pages, images, audio and positioning on storage migration. Imports receive fresh identities.
- Existing GUIDE, Karlmaths and custom brand records are retained; Malik Kolade is seeded once as an additional profile.
- Markdown is never executed. Raw HTML is discarded; links and assets use restricted protocols. Code is highlighted, never run.
- Rich objects retain their editable Markdown/code/chart data, with a common renderer for preview and export.
- Generation uses a preview and explicit replace/append action. Editing source never overwrites existing page edits.
- No external publishing or AI service is necessary. No MP4 claim.

## Delivery verification — 14 October 2026

The seven implementation areas are integrated into the existing application. Project version 2, IndexedDB version 3, 80 templates, technical writing/rendering, chart components, platform variants, campaign management, assets, and extended exports are implemented. Three editable example projects and their Markdown sources are included.

Final verification: 34 unit tests pass, all 8 browser tests pass (including visual comparisons), and the TypeScript/Vite production build passes. See `docs/VALIDATION.md` for evidence and scope; README.md documents usage, dependencies, migration, and remaining limitations. Existing browser data on the user's port was not used for automated testing.
