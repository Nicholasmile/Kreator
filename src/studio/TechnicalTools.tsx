import { useEffect, useState } from 'react';
import { Code2, BarChart3, Shuffle, Lock, Unlock, ImagePlus, Rows3, FileText } from 'lucide-react';
import { useEditor } from '../store';
import { element, presets, type Brand, type Project } from '../model';
import { Modal, ColorField } from '../ui';
import { defaultCode, type CodeStyle, type ChartConfig, type Asset } from './types';
import { codeLanguages, codeHTML, markdownHTML } from './markdown';
import { chartData, chartSVG, defaultChart } from './charts';
import {
  layoutNames,
  layoutPage,
  repurpose,
  platformFormats,
  densityWarnings,
} from './composition';
import { saveProject, listAssets, listContent, saveContent } from '../storage';
import { uid } from '../model';
import { thumbnail, loadImage } from '../render';
export function TechnicalTools({
  brands,
  notice,
  onVariant,
}: {
  brands: Brand[];
  notice: (s: string) => void;
  onVariant: (p: Project) => void;
}) {
  const state = useEditor(),
    p = state.project!,
    page = p.pages[state.pageIndex],
    selected = page.elements.find((e) => e.id === state.selected);
  const [dialog, setDialog] = useState<
      'code' | 'chart' | 'rich' | 'repurpose' | 'assets' | 'arrange' | null
    >(null),
    [layout, setLayout] = useState(page.layout || 'Editorial'),
    [target, setTarget] = useState(0),
    [assets, setAssets] = useState<Asset[]>([]),
    [busy, setBusy] = useState(false);
  useEffect(() => setLayout(page.layout || 'Editorial'), [page.id, page.layout]);
  const [arranged, setArranged] = useState<string[]>([]);
  const brand = brands.find((b) => b.id === p.brandId) || presets[0];
  const add = (
    kind: 'code' | 'rich' | 'chart',
    text = '',
    code?: CodeStyle,
    chart?: ChartConfig,
  ) => {
    if (selected?.kind === kind) state.patchElement(selected.id, { text, code, chart });
    else {
      const e = element(kind, {
        text,
        code,
        chart,
        x: p.width * 0.08,
        y: p.height * 0.3,
        width: p.width * 0.84,
        height: p.height * 0.48,
        fontSize: Math.min(p.width, p.height) * 0.031,
        fill: brand.primary,
        role: 'body',
      });
      state.updatePage((page) => ({ ...page, elements: [...page.elements, e] }));
      state.select(e.id);
    }
    setDialog(null);
  };
  return (
    <>
      <div className="technical-toolbar">
        <span className="studio-badge">STUDIO 2.0</span>
        <button
          onClick={() => {
            setArranged([]);
            setDialog('arrange');
          }}
        >
          Group & align
        </button>
        <button onClick={() => setDialog('code')}>
          <Code2 size={15} />
          Code studio
        </button>
        <button onClick={() => setDialog('chart')}>
          <BarChart3 size={15} />
          Chart
        </button>
        <button onClick={() => setDialog('rich')}>
          <FileText size={15} />
          Rich Markdown
        </button>
        <button
          onClick={() => {
            void listAssets()
              .then(setAssets)
              .catch((e) => notice(e.message));
            setDialog('assets');
          }}
        >
          <ImagePlus size={15} />
          Assets
        </button>
        <label>
          <Rows3 size={14} />
          <select
            aria-label="Page layout"
            value={layout}
            onChange={(e) => {
              setLayout(e.target.value);
              state.updatePage((page) => layoutPage(page, p.width, p.height, e.target.value));
            }}
          >
            {layoutNames.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setDialog('repurpose')}>
          <Shuffle size={15} />
          Repurpose for Platform
        </button>
        {selected && (
          <button onClick={() => state.patchElement(selected.id, { locked: !selected.locked })}>
            {selected.locked ? <Unlock size={14} /> : <Lock size={14} />}{' '}
            {selected.locked ? 'Unlock' : 'Lock'}
          </button>
        )}
        <label className="brand-visibility">
          <input
            type="checkbox"
            checked={page.brandVisible !== false}
            onChange={(e) => state.updatePage((pg) => ({ ...pg, brandVisible: e.target.checked }))}
          />
          Brand footer
        </label>
      </div>
      <div className="project-writing-link">
        <button
          className="text-button"
          onClick={async () => {
            try {
              const existing = (await listContent()).find((item) => item.projectIds.includes(p.id));
              await saveContent({
                id: existing?.id || uid(),
                title: p.name,
                markdown: p.sourceText,
                details: structuredClone(p.content),
                projectIds: existing?.projectIds || [p.id],
                format: p.height / p.width > 1.7 ? 'Reel' : 'Carousel',
                updatedAt: Date.now(),
                history: [
                  ...(existing?.history || []).slice(-29),
                  { at: Date.now(), note: 'Explicitly synchronized from design project.' },
                ],
              });
              notice('Writing and captions saved to your content library.');
            } catch (e) {
              notice((e as Error).message);
            }
          }}
        >
          Save writing to Library
        </button>
        <span>Source and captions stay with this project.</span>
        {densityWarnings(page, p.width, p.height).length > 0 && (
          <span className="density-warning">
            {densityWarnings(page, p.width, p.height).join(' ')}
          </span>
        )}
      </div>
      {dialog === 'arrange' && (
        <Modal title="Group and align elements" onClose={() => setDialog(null)}>
          <p>
            Select unlocked elements. Groups move together when dragged; alignment uses their
            unrotated bounding boxes.
          </p>
          <div className="arrange-list">
            {page.elements
              .filter((e) => !e.locked)
              .map((e) => (
                <label className="checkbox-row" key={e.id}>
                  <input
                    type="checkbox"
                    checked={arranged.includes(e.id)}
                    onChange={(event) =>
                      setArranged((ids) =>
                        event.target.checked ? [...ids, e.id] : ids.filter((id) => id !== e.id),
                      )
                    }
                  />
                  {e.text?.slice(0, 45) || e.kind}
                </label>
              ))}
          </div>
          <div className="button-row">
            <button
              className="secondary"
              disabled={arranged.length < 2}
              onClick={() => {
                const groupId = uid();
                state.updatePage((pg) => ({
                  ...pg,
                  elements: pg.elements.map((e) =>
                    arranged.includes(e.id) ? { ...e, groupId } : e,
                  ),
                }));
                notice('Elements grouped. Drag any group member to move the group.');
              }}
            >
              Group selected
            </button>
            <button
              className="secondary"
              onClick={() =>
                state.updatePage((pg) => ({
                  ...pg,
                  elements: pg.elements.map((e) =>
                    arranged.includes(e.id) ? { ...e, groupId: undefined } : e,
                  ),
                }))
              }
            >
              Ungroup selected
            </button>
            {['left', 'center', 'right', 'top', 'bottom'].map((align) => (
              <button
                className="secondary"
                key={align}
                disabled={arranged.length < 2}
                onClick={() =>
                  state.updatePage((pg) => {
                    const nodes = pg.elements.filter((e) => arranged.includes(e.id));
                    const left = Math.min(...nodes.map((e) => e.x)),
                      right = Math.max(...nodes.map((e) => e.x + e.width)),
                      top = Math.min(...nodes.map((e) => e.y)),
                      bottom = Math.max(...nodes.map((e) => e.y + e.height));
                    return {
                      ...pg,
                      elements: pg.elements.map((e) =>
                        arranged.includes(e.id)
                          ? {
                              ...e,
                              x:
                                align === 'left'
                                  ? left
                                  : align === 'right'
                                    ? right - e.width
                                    : align === 'center'
                                      ? (left + right - e.width) / 2
                                      : e.x,
                              y:
                                align === 'top'
                                  ? top
                                  : align === 'bottom'
                                    ? bottom - e.height
                                    : e.y,
                            }
                          : e,
                      ),
                    };
                  })
                }
              >
                Align {align}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {dialog === 'code' && (
        <CodeDialog
          text={
            selected?.kind === 'code'
              ? selected.text || ''
              : 'import pandas as pd\n\ndf = pd.read_csv("sales.csv")\nprint(df.head())'
          }
          style={selected?.code || defaultCode()}
          onClose={() => setDialog(null)}
          onApply={(text, code) => add('code', text, code)}
          notice={notice}
        />
      )}
      {dialog === 'chart' && (
        <ChartDialog
          initial={
            selected?.chart || { ...defaultChart(), color: brand.accent, highlightColor: '#8A6CF0' }
          }
          onClose={() => setDialog(null)}
          onApply={(chart) => add('chart', '', undefined, chart)}
          notice={notice}
        />
      )}
      {dialog === 'rich' && (
        <RichDialog
          text={
            selected?.kind === 'rich'
              ? selected.text || ''
              : '## Your next idea\n\nWrite **bold ideas**, `inline code`, and $x^2$ here.'
          }
          onClose={() => setDialog(null)}
          onApply={(text) => add('rich', text)}
        />
      )}
      {dialog === 'repurpose' && (
        <Modal title="Create an independent platform variant" onClose={() => setDialog(null)}>
          <p>
            Your existing design stays intact. Content blocks reflow within the new canvas;
            decorative shapes are omitted from the variant. Review wide banners and dense slides
            before export.
          </p>
          <label className="field">
            Target platform
            <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
              {platformFormats.map((f, i) => (
                <option value={i} key={i}>
                  {f.platform} · {f.name} · {f.width} × {f.height}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary full-width"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await saveProject({ ...p, thumbnail: await thumbnail(p) });
                const next = repurpose(p, platformFormats[target]);
                next.thumbnail = await thumbnail(next);
                await saveProject(next);
                setDialog(null);
                onVariant(next);
                notice('Independent platform variant created.');
              } catch (e) {
                notice((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Creating…' : 'Create and open variant'}
          </button>
        </Modal>
      )}
      {dialog === 'assets' && (
        <Modal title="Your reusable assets" onClose={() => setDialog(null)} wide>
          <p>Upload and tag assets in Library → Assets. Everything stays on this device.</p>
          <div className="asset-grid">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={async () => {
                  try {
                    const img = await loadImage(asset.src),
                      w = p.width * 0.7,
                      h = (w * img.height) / img.width;
                    const e = element('image', {
                      src: asset.src,
                      width: w,
                      height: Math.min(h, p.height * 0.7),
                      x: p.width * 0.15,
                      y: p.height * 0.15,
                    });
                    state.updatePage((pg) => ({ ...pg, elements: [...pg.elements, e] }));
                    state.select(e.id);
                    setDialog(null);
                  } catch (e) {
                    notice((e as Error).message);
                  }
                }}
              >
                <img src={asset.src} alt={asset.name} />
                <strong>{asset.name}</strong>
              </button>
            ))}
          </div>
          {!assets.length && (
            <p className="empty-state">Your asset library is ready for your first upload.</p>
          )}
        </Modal>
      )}
    </>
  );
}
function CodeDialog({
  text,
  style,
  onClose,
  onApply,
  notice,
}: {
  text: string;
  style: CodeStyle;
  onClose: () => void;
  onApply: (s: string, c: CodeStyle) => void;
  notice: (s: string) => void;
}) {
  const [source, setSource] = useState(text),
    [settings, setSettings] = useState(style);
  const patch = (p: Partial<CodeStyle>) => setSettings((s) => ({ ...s, ...p }));
  return (
    <Modal title="Code Snippet Studio" onClose={onClose} wide>
      <div className="technical-dialog-grid">
        <div>
          <label className="field">
            Code source
            <textarea
              aria-label="Code source"
              className="code-source"
              spellCheck={false}
              rows={16}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
          <div className="field-row">
            <label className="field">
              Language
              <select
                value={settings.language}
                onChange={(e) => patch({ language: e.target.value })}
              >
                {codeLanguages.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Syntax theme
              <select
                value={settings.theme}
                onChange={(e) => patch({ theme: e.target.value as 'dark' | 'light' })}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
          </div>
          <label className="field">
            Filename or cell header
            <input
              value={settings.filename}
              onChange={(e) => patch({ filename: e.target.value })}
            />
          </label>
          <div className="field-row">
            <label className="field">
              Highlighted lines
              <input
                placeholder="2,4-6"
                value={settings.highlights}
                onChange={(e) => patch({ highlights: e.target.value })}
              />
            </label>
            <label className="field">
              Padding
              <input
                type="number"
                min={0}
                max={100}
                value={settings.padding}
                onChange={(e) =>
                  patch({ padding: Math.max(0, Math.min(100, Number(e.target.value))) })
                }
              />
            </label>
          </div>
          {(['lineNumbers', 'wrap', 'transparent'] as const).map((key) => (
            <label className="checkbox-row" key={key}>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => patch({ [key]: e.target.checked })}
              />
              {key === 'lineNumbers'
                ? 'Line numbers'
                : key === 'wrap'
                  ? 'Wrap long lines'
                  : 'Transparent background'}
            </label>
          ))}
          <p className="hint">
            EViews commands can use plaintext. Code is displayed, never executed. Canvas font size
            and dimensions control graphical output.
          </p>
        </div>
        <div>
          <div
            className="technical-content snippet-preview"
            dangerouslySetInnerHTML={{ __html: codeHTML(source, settings) }}
          />
          <button
            className="secondary full-width"
            onClick={() =>
              void navigator.clipboard
                .writeText(source)
                .then(() => notice('Code copied with indentation preserved.'))
                .catch(() => notice('Select and copy the source manually.'))
            }
          >
            Copy code
          </button>
        </div>
      </div>
      <div className="modal-actions">
        <button className="primary" onClick={() => onApply(source, settings)}>
          Insert code card
        </button>
      </div>
    </Modal>
  );
}
function RichDialog({
  text,
  onClose,
  onApply,
}: {
  text: string;
  onClose: () => void;
  onApply: (s: string) => void;
}) {
  const [source, setSource] = useState(text);
  return (
    <Modal title="Editable Markdown block" onClose={onClose} wide>
      <div className="technical-dialog-grid">
        <label className="field">
          Block Markdown
          <textarea rows={15} value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
        <article
          className="technical-content document-preview"
          dangerouslySetInnerHTML={{ __html: markdownHTML(source) }}
        />
      </div>
      <button className="primary full-width" onClick={() => onApply(source)}>
        Apply Markdown block
      </button>
    </Modal>
  );
}
function ChartDialog({
  initial,
  onClose,
  onApply,
  notice,
}: {
  initial: ChartConfig;
  onClose: () => void;
  onApply: (c: ChartConfig) => void;
  notice: (s: string) => void;
}) {
  const [config, setConfig] = useState(initial),
    [raw, setRaw] = useState(
      initial.data.length
        ? 'label,x,y\n' +
            initial.data
              .map((d) => `${`"${d.label.replaceAll('"', '""')}"`},${d.x},${d.y}`)
              .join('\n')
        : 'label,value\n',
    ),
    [error, setError] = useState('');
  const patch = (p: Partial<ChartConfig>) => setConfig((c) => ({ ...c, ...p }));
  let preview = '';
  try {
    if (config.data.length)
      preview = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(chartSVG(config))}`;
  } catch {}
  const read = (text: string) => {
    setRaw(text);
    try {
      patch({ data: chartData(text) });
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Modal title="Data Visualization Studio" onClose={onClose} wide>
      <div className="technical-dialog-grid">
        <div>
          <label className="field">
            Chart type
            <select
              value={config.type}
              onChange={(e) => patch({ type: e.target.value as ChartConfig['type'] })}
            >
              {['bar', 'line', 'scatter', 'histogram', 'pie', 'kpi'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Chart title
            <input value={config.title} onChange={(e) => patch({ title: e.target.value })} />
          </label>
          <label className="field">
            CSV data · label,value or label,x,y
            <textarea
              aria-label="Chart CSV data"
              className="code-source"
              rows={7}
              value={raw}
              onChange={(e) => read(e.target.value)}
            />
          </label>
          <label className="field">
            Import CSV
            <input
              type="file"
              accept=".csv,.tsv,text/csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 2_000_000) {
                    notice('Choose a CSV smaller than 2 MB.');
                    return;
                  }
                  read(await file.text());
                }
              }}
            />
          </label>
          {error && <p className="density-warning">{error}</p>}
          <div className="field-row">
            <label className="field">
              X axis label
              <input value={config.xLabel} onChange={(e) => patch({ xLabel: e.target.value })} />
            </label>
            <label className="field">
              Y axis label
              <input value={config.yLabel} onChange={(e) => patch({ yLabel: e.target.value })} />
            </label>
          </div>
          <div className="field-row">
            <ColorField
              label="Series color"
              value={config.color}
              onChange={(color) => patch({ color })}
            />
            <ColorField
              label="Highlight color"
              value={config.highlightColor}
              onChange={(highlightColor) => patch({ highlightColor })}
            />
          </div>
          <label className="field">
            Highlight labels (comma-separated)
            <input
              value={config.highlight}
              onChange={(e) => patch({ highlight: e.target.value })}
            />
          </label>
          {config.type === 'histogram' && (
            <label className="field">
              Histogram bins
              <input
                type="number"
                min={1}
                max={30}
                value={config.bins}
                onChange={(e) => patch({ bins: Number(e.target.value) })}
              />
            </label>
          )}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={config.legend}
              onChange={(e) => patch({ legend: e.target.checked })}
            />
            Show pie labels
          </label>
          <label className="field">
            Source / annotation
            <input
              value={config.annotation}
              onChange={(e) => patch({ annotation: e.target.value })}
            />
          </label>
        </div>
        <div className="chart-preview">
          {preview ? (
            <img src={preview} alt="Chart preview" />
          ) : (
            <p>Add your own data to preview a chart. No figures are generated automatically.</p>
          )}
        </div>
      </div>
      <button
        className="primary full-width"
        disabled={!config.data.length || !!error}
        onClick={() => {
          try {
            chartSVG(config);
            onApply(config);
          } catch (e) {
            notice((e as Error).message);
          }
        }}
      >
        Insert chart
      </button>
    </Modal>
  );
}
