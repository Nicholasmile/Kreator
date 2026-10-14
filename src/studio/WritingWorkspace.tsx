import { useEffect, useMemo, useState } from 'react';
import { Maximize2, Minimize2, Sparkles, ArrowRight, Copy, Download } from 'lucide-react';
import { useEditor } from '../store';
import { presets, type Brand, type Page } from '../model';
import { Modal } from '../ui';
import { Canvas } from '../Canvas';
import { MarkdownEditor } from './MarkdownEditor';
import { markdownHTML, parseMarkdown, plainCaption } from './markdown';
import { markdownPages, styleBrand, layoutNames } from './composition';
import { brandStyles, platforms, type BrandStyle, type Platform } from './types';
import { examples } from './examples';
import { download, safeName } from '../exports';
export function WritingWorkspace({
  brands,
  onDesign,
  notice,
}: {
  brands: Brand[];
  onDesign: () => void;
  notice: (s: string) => void;
}) {
  const state = useEditor(),
    p = state.project!;
  const [focus, setFocus] = useState(false),
    [count, setCount] = useState(5),
    [brandId, setBrandId] = useState(p.brandId || 'malik-kolade'),
    [style, setStyle] = useState<BrandStyle>('Clean Light'),
    [layout, setLayout] = useState('Editorial'),
    [preview, setPreview] = useState<{ pages: Page[]; warnings: string[] } | null>(null),
    [index, setIndex] = useState(0),
    [tab, setTab] = useState<'document' | 'captions' | 'brief'>('document'),
    [platform, setPlatform] = useState<Platform>('Instagram'),
    [useSummary, setUseSummary] = useState(false);
  const [debounced, setDebounced] = useState(p.sourceText);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(p.sourceText), 250);
    return () => clearTimeout(timer);
  }, [p.sourceText]);
  const html = useMemo(() => markdownHTML(debounced), [debounced]);
  const parsed = useMemo(() => parseMarkdown(debounced), [debounced]);
  const brand = brands.find((b) => b.id === brandId) || presets[0];
  const details = (patch: Partial<typeof p.content>) =>
    state.commit((p) => ({ ...p, content: { ...p.content, ...patch } }));
  const generate = () => {
    try {
      const result = markdownPages(
        useSummary ? p.content.summary : p.sourceText,
        p.width,
        p.height,
        count,
        styleBrand(brand, style),
        layout,
      );
      setPreview(result);
      setIndex(0);
    } catch (e) {
      notice((e as Error).message);
    }
  };
  return (
    <section className={`writing-workspace ${focus ? 'writing-focus' : ''}`}>
      <div className="writing-top">
        <div>
          <span className="eyebrow">MALIK’S CONTENT DESK</span>
          <h2>Think clearly. Write beautifully.</h2>
        </div>
        <div className="writing-actions">
          <select
            aria-label="Load example"
            defaultValue=""
            onChange={(e) => {
              const ex = examples[Number(e.target.value)];
              if (ex) {
                state.commit((p) => ({
                  ...p,
                  sourceText: ex.source,
                  content: { ...p.content, topic: ex.topic },
                }));
                e.target.value = '';
              }
            }}
          >
            <option value="">Load an example…</option>
            {examples.map((e, i) => (
              <option key={e.name} value={i}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            className="text-button"
            onClick={() => state.commit((p) => ({ ...p, sourceText: examples[0].source }))}
          >
            Try an example
          </button>
          <button
            className="icon-button"
            aria-label="Toggle distraction-free writing"
            onClick={() => setFocus(!focus)}
          >
            {focus ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
      <div className="writing-columns">
        <div className="source-pane">
          <div className="pane-label">
            <strong>MARKDOWN SOURCE</strong>
            <span>
              {p.sourceText.trim().split(/\s+/).filter(Boolean).length} words · saved with project
            </span>
          </div>
          <MarkdownEditor
            value={p.sourceText}
            onChange={(sourceText) => state.commit((p) => ({ ...p, sourceText }))}
          />
          <p className="hint">
            Use --- for slide breaks, *** for a divider, and &lt;!-- notes: … --&gt; for speaker
            notes. Source changes never replace your slide edits.
          </p>
        </div>
        <div className="document-pane">
          <div className="document-tabs">
            {(['document', 'captions', 'brief'] as const).map((t) => (
              <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
                {t === 'document'
                  ? 'Live preview'
                  : t === 'captions'
                    ? 'Platform captions'
                    : 'Content brief'}
              </button>
            ))}
          </div>
          {tab === 'document' ? (
            <>
              <article
                className="technical-content document-preview"
                dangerouslySetInnerHTML={{
                  __html:
                    html ||
                    '<p class="empty-state">Your next lesson begins here. Write Markdown or load an example.</p>',
                }}
              />
              {parsed.warnings.map((w) => (
                <p className="density-warning" key={w}>
                  {w}
                </p>
              ))}
            </>
          ) : tab === 'captions' ? (
            <div className="caption-workspace">
              <label className="field">
                Caption platform
                <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                  {platforms.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <textarea
                aria-label={`${platform} caption`}
                rows={15}
                value={p.content.captions[platform]}
                onChange={(e) =>
                  details({ captions: { ...p.content.captions, [platform]: e.target.value } })
                }
              />
              <p className="hint">
                {p.content.captions[platform].length} characters. Platform limits vary by account
                and post type; review before publishing.
              </p>
              <div className="button-row">
                <button
                  className="secondary"
                  onClick={() => {
                    const text = plainCaption(p.sourceText);
                    details({
                      captions: {
                        ...p.content.captions,
                        [platform]: p.content.captions[platform]
                          ? p.content.captions[platform] + '\n\n' + text
                          : text,
                      },
                    });
                  }}
                >
                  Append from Markdown
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(p.content.captions[platform])
                      .then(() => notice('Caption copied.'))
                      .catch(() =>
                        notice('Clipboard unavailable. Select and copy the caption manually.'),
                      )
                  }
                >
                  <Copy size={15} />
                  Copy
                </button>
              </div>
              <button
                className="text-button"
                onClick={() =>
                  details({
                    captions: {
                      ...p.content.captions,
                      [platform]:
                        `${p.content.captions[platform]}\n\nToday I’m exploring [topic].\n\nThe key idea: [your explanation].\n\nWhat would you add?`.trim(),
                    },
                  })
                }
              >
                Insert educational caption scaffold
              </button>
            </div>
          ) : (
            <div className="content-brief">
              {(
                [
                  'topic',
                  'hook',
                  'takeaway',
                  'cta',
                  'hashtags',
                  'references',
                  'narration',
                  'notes',
                ] as const
              ).map((key) => (
                <label className="field" key={key}>
                  {
                    {
                      topic: 'Content topic',
                      hook: 'Opening hook',
                      takeaway: 'Key takeaway',
                      cta: 'Call to action',
                      hashtags: 'Hashtags',
                      references: 'Sources and references',
                      narration: 'Reel narration script',
                      notes: 'Notes',
                    }[key]
                  }
                  <textarea
                    rows={key === 'narration' ? 4 : 2}
                    value={p.content[key]}
                    onChange={(e) => details({ [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
        <aside className="writing-settings">
          <h3>Make it a design</h3>
          <p className="hint">
            Keep your original writing. Create editable slides when you’re ready.
          </p>
          <label className="field">
            Personal brand
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Visual style
            <select value={style} onChange={(e) => setStyle(e.target.value as BrandStyle)}>
              {brandStyles.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Slide composition
            <select value={layout} onChange={(e) => setLayout(e.target.value)}>
              {layoutNames.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Number of slides
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[1, 4, 5, 6, 8, 10, 15, 20, 30].map((n) => (
                <option value={n} key={n}>
                  {n === 1 ? 'Single graphic' : `${n} slides`}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">
            Explicit slide breaks take priority over the requested count. Code and equations are
            never divided.
          </p>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={useSummary}
              onChange={(e) => setUseSummary(e.target.checked)}
            />
            Use my manually edited summary
          </label>
          {useSummary && (
            <label className="field">
              Summary Markdown
              <textarea
                rows={6}
                value={p.content.summary}
                onChange={(e) => details({ summary: e.target.value })}
              />
            </label>
          )}
          <button className="primary full-width" onClick={generate}>
            <Sparkles size={16} />
            Generate Design
          </button>
          <button className="secondary full-width" onClick={onDesign}>
            Return to canvas <ArrowRight size={15} />
          </button>
          <button
            className="text-button"
            onClick={() =>
              download(
                new Blob([p.sourceText], { type: 'text/markdown' }),
                `${safeName(p.name)}.md`,
              )
            }
          >
            <Download size={15} />
            Export Markdown
          </button>
        </aside>
      </div>
      {preview && (
        <Modal title="Review your generated slides" onClose={() => setPreview(null)} wide>
          <p>
            Your source and captions stay intact. Replace the current slides explicitly, or append
            these as a new sequence. Undo is available.
          </p>
          <div className="generation-preview">
            <Canvas
              page={preview.pages[index]}
              width={p.width}
              height={p.height}
              zoom={Math.min(430 / p.width, 380 / p.height)}
            />
          </div>
          <div className="preview-controls">
            <button className="secondary" disabled={!index} onClick={() => setIndex((i) => i - 1)}>
              Previous
            </button>
            <span>
              {index + 1} / {preview.pages.length}
            </span>
            <button
              className="secondary"
              disabled={index === preview.pages.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next
            </button>
          </div>
          {preview.warnings.map((w) => (
            <p className="density-warning" key={w}>
              {w}
            </p>
          ))}
          <div className="modal-actions">
            <button
              className="secondary"
              onClick={() => {
                state.commit((p) => ({
                  ...p,
                  pages: [...p.pages, ...preview.pages],
                  lastGeneratedSource: p.sourceText,
                  brandId,
                }));
                state.setPage(p.pages.length);
                setPreview(null);
                onDesign();
              }}
            >
              Append slides
            </button>
            <button
              className="primary"
              onClick={() => {
                state.commit((p) => ({
                  ...p,
                  pages: preview.pages,
                  lastGeneratedSource: p.sourceText,
                  brandId,
                }));
                state.setPage(0);
                setPreview(null);
                onDesign();
              }}
            >
              Use generated slides
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
