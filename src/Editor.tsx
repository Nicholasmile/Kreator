import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { TechnicalTools } from './studio/TechnicalTools';
import { TemplateGallery } from './studio/TemplateGallery';
import { StudioExportDialog } from './studio/ExportDialog';
const WritingWorkspace = lazy(() =>
  import('./studio/WritingWorkspace').then((m) => ({ default: m.WritingWorkspace })),
);
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Undo2,
  Redo2,
  Save,
  Download,
  Play,
  Copy,
  Trash2,
  Type,
  Shapes,
  Image,
  Upload,
  Palette,
  LayoutTemplate,
  Layers,
  WandSparkles,
  PenLine,
  Clapperboard,
  Square,
  Circle,
  Sigma,
  ArrowUp,
  ArrowDown,
  Maximize,
  X,
  Music2,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { useEditor } from './store';
import { Canvas } from './Canvas';
import { templates, templatePage } from './templates';
import {
  element,
  blankPage,
  fonts,
  applyBrand,
  resizeProject,
  uid,
  type Brand,
  type DesignElement,
  type Project,
} from './model';
import { loadImage, mathImage, readFile, readImage, thumbnail } from './render';
import { saveProject } from './storage';
import {
  exportPNG,
  exportZip,
  exportPDF,
  exportVideo,
  videoMime,
  download,
  safeName,
  prepareVideo,
  drawVideoFrame,
  durationOf,
  type VideoFrame,
} from './exports';
import { Logo, Modal, ColorField } from './ui';
type Mode = 'design' | 'write' | 'reel';
type Tab =
  'Templates' | 'Text' | 'Shapes' | 'Backgrounds' | 'Images' | 'Uploads' | 'Elements' | 'Brand kit';
export function Editor({
  onHome,
  notice,
  brands,
  initialMode,
}: {
  onHome: () => Promise<void>;
  notice: (m: string) => void;
  brands: Brand[];
  initialMode: Mode;
}) {
  const state = useEditor(),
    p = state.project!,
    page = p.pages[state.pageIndex];
  const [tab, setTab] = useState<Tab>('Templates'),
    [mode, setMode] = useState<Mode>(initialMode),
    [exporting, setExporting] = useState(false),
    [preview, setPreview] = useState(false),
    [focusCanvas, setFocusCanvas] = useState(false),
    [saveStatus, setSaveStatus] = useState('Saved locally'),
    [zoom, setZoom] = useState(1),
    [area, setArea] = useState({ width: 700, height: 620 }),
    [math, setMath] = useState<{ id?: string; expression: string } | null>(null),
    [templateConfirm, setTemplateConfirm] = useState<string | null>(null);
  const workspace = useRef<HTMLDivElement>(null),
    uploadRef = useRef<HTMLInputElement>(null),
    saveSequence = useRef(0),
    mounted = useRef(true);
  const selected = page.elements.find((e) => e.id === state.selected);
  const persist = useCallback(async (snapshot: Project) => {
    const seq = ++saveSequence.current;
    setSaveStatus('Saving…');
    try {
      const thumb = await thumbnail(snapshot);
      if (seq !== saveSequence.current) return;
      await saveProject({ ...snapshot, thumbnail: thumb });
      if (mounted.current && seq === saveSequence.current) setSaveStatus('Saved locally');
    } catch (err) {
      if (mounted.current) setSaveStatus('Save failed');
      throw err;
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    setSaveStatus('Unsaved changes');
    const timer = setTimeout(
      () =>
        void persist(p).catch((e) => notice(`Could not save: ${e.message}. Export a JSON backup.`)),
      700,
    );
    return () => clearTimeout(timer);
  }, [p, persist, notice]);
  useEffect(() => {
    const warnIfUnsaved = (event: BeforeUnloadEvent) => {
      if (saveStatus !== 'Saved locally') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warnIfUnsaved);
    return () => window.removeEventListener('beforeunload', warnIfUnsaved);
  }, [saveStatus]);
  useEffect(() => {
    if (!workspace.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setArea({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(workspace.current);
    return () => observer.disconnect();
  }, [mode]);
  const removeSelected = useCallback(() => {
    const s = useEditor.getState();
    if (
      s.selected &&
      !s.project?.pages[s.pageIndex].elements.find((e) => e.id === s.selected)?.locked
    )
      s.updatePage((page) => ({
        ...page,
        elements: page.elements.filter((e) => e.id !== s.selected),
      }));
    s.select(null);
  }, []);
  const duplicateSelected = useCallback(() => {
    const s = useEditor.getState(),
      e = s.project?.pages[s.pageIndex].elements.find((e) => e.id === s.selected);
    if (e) {
      const copy = { ...e, id: uid(), x: e.x + 24, y: e.y + 24 };
      s.updatePage((page) => ({ ...page, elements: [...page.elements, copy] }));
      s.select(copy.id);
    }
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (document.querySelector('[role="dialog"]')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void persist(useEditor.getState().project!).catch((err) => notice(err.message));
        return;
      }
      if (target.closest('input,textarea,select,[contenteditable="true"],.cm-editor')) return;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? useEditor.getState().redo() : useEditor.getState().undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useEditor.getState().redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeSelected();
      } else if (e.key === 'Escape') useEditor.getState().select(null);
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const s = useEditor.getState(),
          el = s.project?.pages[s.pageIndex].elements.find((el) => el.id === s.selected);
        if (el && !el.locked) {
          e.preventDefault();
          const n = e.shiftKey ? 10 : 1;
          s.patchElement(el.id, {
            x: el.x + (e.key === 'ArrowRight' ? n : e.key === 'ArrowLeft' ? -n : 0),
            y: el.y + (e.key === 'ArrowDown' ? n : e.key === 'ArrowUp' ? -n : 0),
          });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [persist, notice, removeSelected, duplicateSelected]);
  const add = (e: DesignElement) => {
    state.updatePage((page) => ({ ...page, elements: [...page.elements, e] }));
    state.select(e.id);
  };
  const fit = Math.min((area.width - 96) / p.width, (area.height - 84) / p.height, 1),
    scale = Math.max(0.04, fit) * zoom;
  const upload = async (file: File) => {
    try {
      const src = await readImage(file),
        img = await loadImage(src),
        width = Math.min(p.width * 0.65, img.width),
        height = (width * img.height) / img.width;
      add(
        element('image', {
          src,
          x: (p.width - width) / 2,
          y: (p.height - height) / 2,
          width,
          height,
        }),
      );
      notice('Image added. Drag the corners to resize.');
    } catch (err) {
      notice((err as Error).message);
    }
  };
  const convertReel = () => {
    state.commit((project) => resizeProject(project, 1080, 1920));
    setMode('reel');

    notice('Converted to 9:16. Adjust the layout and slide timing before exporting.');
  };
  const goHome = async () => {
    try {
      await persist(useEditor.getState().project!);
      await onHome();
    } catch (err) {
      notice(`Could not save: ${(err as Error).message}. Export a JSON backup before leaving.`);
    }
  };
  return (
    <div className={`editor-shell ${focusCanvas ? 'canvas-focus' : ''}`}>
      <header className="editor-header">
        <button
          className="icon-button"
          aria-label="Back to workspace"
          onClick={() => void goHome()}
        >
          <ArrowLeft size={20} />
        </button>
        <Logo small />
        <span className="header-divider" />
        <input
          className="project-title-input"
          aria-label="Project name"
          value={p.name}
          maxLength={100}
          onChange={(e) => state.commit((p) => ({ ...p, name: e.target.value }))}
        />
        <span className="save-indicator">
          <span className={saveStatus === 'Saved locally' ? 'saved-dot' : 'pending-dot'} />
          {saveStatus}
        </span>
        <div className="header-spacer" />
        <button
          className="icon-button"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          disabled={!state.past.length}
          onClick={state.undo}
        >
          <Undo2 size={19} />
        </button>
        <button
          className="icon-button"
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
          disabled={!state.future.length}
          onClick={state.redo}
        >
          <Redo2 size={19} />
        </button>
        <span className="header-divider" />
        <button
          className="secondary compact"
          onClick={() => void persist(p).catch((e) => notice(e.message))}
        >
          <Save size={16} />
          Save
        </button>
        <button className="secondary compact" onClick={() => setPreview(true)}>
          <Play size={16} />
          Preview
        </button>
        <button className="primary compact" onClick={() => setExporting(true)}>
          <Download size={16} />
          Export
        </button>
      </header>
      <div className="editor-modebar">
        <button className="text-button" onClick={() => setFocusCanvas(!focusCanvas)}>
          {focusCanvas ? 'Show panels' : 'Focus canvas'}
        </button>
        <div className="mode-switch">
          {(
            [
              { id: 'design', name: 'Design', icon: Palette },
              { id: 'write', name: 'Write & create', icon: PenLine },
              { id: 'reel', name: 'Reel studio', icon: Clapperboard },
            ] as const
          ).map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              className={mode === id ? 'active' : ''}
              onClick={() => {
                setMode(id);
              }}
            >
              <Icon size={16} />
              {name}
            </button>
          ))}
        </div>
        <span>
          {p.width} × {p.height} px <span className="dot-separator">·</span> {p.pages.length}{' '}
          {p.pages.length === 1 ? 'page' : 'pages'}
        </span>
        <button className="text-button" onClick={state.duplicatePage}>
          <Copy size={15} />
          Duplicate page
        </button>
      </div>
      <TechnicalTools
        brands={brands}
        notice={notice}
        onVariant={(project) => {
          state.open(project);
          location.hash = `project/${project.id}`;
          setMode('design');
        }}
      />
      {mode === 'write' ? (
        <Suspense fallback={<div className="empty-state">Opening your writing desk…</div>}>
          <WritingWorkspace brands={brands} notice={notice} onDesign={() => setMode('design')} />
        </Suspense>
      ) : (
        <div className="editor-body">
          <aside className="tool-rail">
            {(
              [
                { name: 'Templates', icon: LayoutTemplate },
                { name: 'Text', icon: Type },
                { name: 'Shapes', icon: Shapes },
                { name: 'Backgrounds', icon: Palette },
                { name: 'Images', icon: Image },
                { name: 'Uploads', icon: Upload },
                { name: 'Elements', icon: WandSparkles },
                { name: 'Brand kit', icon: Layers },
              ] as const
            ).map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={tab === name && mode === 'design' ? 'active' : ''}
                onClick={() => {
                  setTab(name);
                  setMode('design');
                }}
              >
                <Icon size={21} />
                <span>{name}</span>
              </button>
            ))}
          </aside>
          <aside className="tool-panel">
            {mode === 'reel' ? (
              <>
                <div className="panel-title">
                  <span className="panel-icon">
                    <Clapperboard size={19} />
                  </span>
                  <h2>A little motion</h2>
                </div>
                <p className="panel-description">
                  Give your ideas time to shine. Each slide becomes a scene.
                </p>
                <label className="field">
                  Scene notes
                  <textarea
                    rows={3}
                    value={page.notes || ''}
                    onChange={(e) => state.updatePage((pg) => ({ ...pg, notes: e.target.value }))}
                  />
                </label>
                <label className="field">
                  On-screen subtitle
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={page.subtitle || ''}
                    onChange={(e) =>
                      state.updatePage((pg) => ({ ...pg, subtitle: e.target.value }))
                    }
                  />
                </label>
                <button className="secondary full-width" onClick={() => setExporting(true)}>
                  Export this scene as a cover
                </button>
                {p.width / p.height !== 9 / 16 && (
                  <button className="primary full-width" onClick={convertReel}>
                    <Maximize size={17} />
                    Convert to vertical 9:16
                  </button>
                )}
                <label className="field">
                  This slide’s duration
                  <input
                    aria-label="Slide duration"
                    type="number"
                    min={1}
                    max={30}
                    step={0.5}
                    value={page.duration}
                    onChange={(e) =>
                      state.updatePage((page) => ({
                        ...page,
                        duration: Math.max(1, Math.min(30, Number(e.target.value))),
                      }))
                    }
                  />
                </label>
                <label className="field">
                  Entrance transition
                  <select
                    value={page.transition}
                    onChange={(e) =>
                      state.updatePage((page) => ({
                        ...page,
                        transition: e.target.value as 'fade' | 'slide' | 'none',
                      }))
                    }
                  >
                    <option value="fade">Soft fade</option>
                    <option value="slide">Slide across</option>
                    <option value="none">Cut</option>
                  </select>
                </label>
                <div className="info-note">
                  <WandSparkles size={17} />
                  <span>
                    Text fades and rises into each scene. Transitions blend the previous slide into
                    the next.
                  </span>
                </div>
                <label className="upload-box">
                  <Music2 size={24} />
                  <strong>{p.audio ? 'Replace background audio' : 'Add background audio'}</strong>
                  <span>MP3, WAV, OGG · up to 20 MB</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      try {
                        if (!f.type.startsWith('audio/') || f.size > 20 * 1024 * 1024)
                          throw new Error('Choose an audio file smaller than 20 MB.');
                        const audio = await readFile(f);
                        state.commit((p) => ({ ...p, audio }));
                      } catch (err) {
                        notice((err as Error).message);
                      }
                    }}
                  />
                </label>
                {p.audio && (
                  <>
                    <label className="field">
                      Audio volume · {Math.round(p.volume * 100)}%
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={p.volume}
                        onChange={(e) =>
                          state.commit((p) => ({ ...p, volume: Number(e.target.value) }))
                        }
                      />
                    </label>
                    <button
                      className="text-button danger-text"
                      onClick={() => state.commit((p) => ({ ...p, audio: undefined }))}
                    >
                      <Trash2 size={14} />
                      Remove audio
                    </button>
                  </>
                )}
                <button className="secondary full-width" onClick={() => setPreview(true)}>
                  <Play size={17} />
                  Play {durationOf(p).toFixed(1)}s video
                </button>
                <p className="hint">
                  Video records in real time. Keep this tab visible during export. WebM availability
                  depends on your browser.
                </p>
              </>
            ) : (
              <>
                <h2>{tab}</h2>
                <p className="panel-description">
                  {tab === 'Templates'
                    ? 'A starting point for your next great idea.'
                    : tab === 'Brand kit'
                      ? 'Consistency, in one click.'
                      : 'Make room for your own creative touch.'}
                </p>
                {tab === 'Templates' && (
                  <TemplateGallery compact onChoose={(t) => setTemplateConfirm(t.id)} />
                )}
                {tab === 'Text' && (
                  <div className="text-additions">
                    <button
                      className="primary full-width"
                      onClick={() =>
                        add(
                          element('text', {
                            text: 'Your headline here',
                            fontSize: p.width * 0.08,
                            fontStyle: 'bold',
                            width: p.width * 0.8,
                            height: p.height * 0.25,
                            x: p.width * 0.1,
                            y: p.height * 0.2,
                            role: 'heading',
                          }),
                        )
                      }
                    >
                      <Plus size={17} />
                      Add a heading
                    </button>
                    <button
                      className="text-sample subhead"
                      onClick={() =>
                        add(
                          element('text', {
                            text: 'A little more to the story',
                            fontSize: p.width * 0.045,
                            width: p.width * 0.8,
                            height: p.height * 0.15,
                            role: 'body',
                          }),
                        )
                      }
                    >
                      Add a subheading
                    </button>
                    <button
                      className="text-sample"
                      onClick={() =>
                        add(
                          element('text', {
                            text: 'Every idea starts somewhere. Tell your story, one thoughtful word at a time.',
                            fontSize: p.width * 0.03,
                            width: p.width * 0.7,
                            height: p.height * 0.2,
                            role: 'body',
                          }),
                        )
                      }
                    >
                      Add body text
                    </button>
                    <div className="panel-divider" />
                    <button
                      className="secondary full-width"
                      onClick={() => setMath({ expression: 'f(x) = \\frac{x^2}{2} + \\sqrt{x}' })}
                    >
                      <Sigma size={19} />
                      Add an equation
                    </button>
                    <p className="hint">
                      Equations use KaTeX and remain editable. Fractions, integrals, matrices, and
                      more.
                    </p>
                  </div>
                )}
                {(tab === 'Shapes' || tab === 'Elements') && (
                  <>
                    <div className="shape-grid">
                      <button
                        onClick={() =>
                          add(
                            element('rect', {
                              width: p.width * 0.3,
                              height: p.width * 0.3,
                              fill: '#ad94d4',
                              radius: tab === 'Elements' ? 50 : 0,
                              role: 'accent',
                            }),
                          )
                        }
                      >
                        <Square size={40} fill="#ad94d4" strokeWidth={0} />
                        <span>Rectangle</span>
                      </button>
                      <button
                        onClick={() =>
                          add(
                            element('ellipse', {
                              width: p.width * 0.3,
                              height: p.width * 0.3,
                              fill: '#e7bd94',
                              role: 'accent',
                            }),
                          )
                        }
                      >
                        <Circle size={40} fill="#e7bd94" strokeWidth={0} />
                        <span>Circle</span>
                      </button>
                      <button
                        onClick={() =>
                          add(element('rect', { width: p.width * 0.6, height: 6, fill: '#6f5a86' }))
                        }
                      >
                        <Minus size={40} />
                        <span>Line</span>
                      </button>
                      <button
                        onClick={() =>
                          add(
                            element('text', {
                              text: '✦',
                              fontSize: 200,
                              width: 240,
                              height: 260,
                              fill: '#a08bc2',
                              role: 'accent',
                            }),
                          )
                        }
                      >
                        <span className="shape-star">✦</span>
                        <span>Sparkle</span>
                      </button>
                    </div>
                    {tab === 'Elements' && (
                      <button
                        className="secondary full-width"
                        onClick={() =>
                          add(
                            element('text', {
                              text: '“',
                              fontFamily: 'Georgia',
                              fontSize: 300,
                              width: 320,
                              height: 340,
                              fill: '#b395cf',
                              role: 'accent',
                            }),
                          )
                        }
                      >
                        Add a quotation mark
                      </button>
                    )}
                  </>
                )}
                {tab === 'Backgrounds' && (
                  <>
                    <ColorField
                      label="Page background"
                      value={page.background}
                      onChange={(v) => state.updatePage((page) => ({ ...page, background: v }))}
                    />
                    <div className="swatch-grid">
                      {[
                        '#faf7f2',
                        '#eee9f7',
                        '#e9eee7',
                        '#f9ebd9',
                        '#e9eef3',
                        '#f1e8e4',
                        '#282842',
                        '#163d35',
                        '#ffffff',
                        '#f5e3df',
                        '#e3edf0',
                        '#f3edda',
                      ].map((c) => (
                        <button
                          key={c}
                          aria-label={`Set background ${c}`}
                          style={{ background: c }}
                          onClick={() => state.updatePage((page) => ({ ...page, background: c }))}
                        />
                      ))}
                    </div>
                    <button
                      className="secondary full-width"
                      onClick={() =>
                        state.commit((p) => ({
                          ...p,
                          pages: p.pages.map((pg) => ({ ...pg, background: page.background })),
                        }))
                      }
                    >
                      Use on every slide
                    </button>
                  </>
                )}
                {(tab === 'Images' || tab === 'Uploads') && (
                  <>
                    <button
                      className="upload-box full-width"
                      onClick={() => uploadRef.current?.click()}
                    >
                      <Upload size={29} />
                      <strong>Bring your own imagery</strong>
                      <span>Upload PNG, JPG, or WebP</span>
                      <small>Up to 15 MB · stored with your project</small>
                    </button>
                    <p className="hint">
                      Drag an image onto the canvas to upload it. Your images stay on this device.
                    </p>
                    <div className="uploaded-grid">
                      {p.pages
                        .flatMap((pg) => pg.elements)
                        .filter(
                          (e, i, a) =>
                            e.kind === 'image' && a.findIndex((other) => other.src === e.src) === i,
                        )
                        .map((e) => (
                          <button
                            key={e.id}
                            title="Add another copy"
                            onClick={() => add({ ...e, id: uid(), x: 100, y: 100 })}
                          >
                            <img src={e.src} alt="Uploaded image" />
                          </button>
                        ))}
                    </div>
                  </>
                )}
                {tab === 'Brand kit' && (
                  <div className="editor-brands">
                    {brands.map((b) => (
                      <div key={b.id}>
                        <div
                          className="brand-mini"
                          style={{ background: b.secondary, color: b.primary }}
                        >
                          <strong style={{ fontFamily: b.headingFont }}>{b.name}</strong>
                          <div>
                            {[b.primary, b.secondary, b.accent].map((c, i) => (
                              <i key={i} style={{ background: c }} />
                            ))}
                          </div>
                        </div>
                        <button
                          className="secondary full-width"
                          onClick={() => {
                            state.commit((p) => applyBrand(p, b));
                            notice(`${b.name} applied to all slides.`);
                          }}
                        >
                          Apply Brand Kit
                        </button>
                      </div>
                    ))}
                    <p className="hint">
                      Create and edit brand profiles from Brand kits in your workspace.
                    </p>
                  </div>
                )}
              </>
            )}
          </aside>
          <section className="canvas-area">
            <div
              ref={workspace}
              className="canvas-workspace"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) void upload(f);
              }}
            >
              <div className="canvas-wrap">
                <div className="canvas-page-label">
                  <span>PAGE {String(state.pageIndex + 1).padStart(2, '0')}</span>
                  <span>{'Your ideas, beautifully made'}</span>
                </div>
                <Canvas
                  page={page}
                  width={p.width}
                  height={p.height}
                  zoom={scale}
                  interactive
                  onError={notice}
                />
              </div>
            </div>
            <div className="canvas-status">
              <span>
                <span className="status-key">↔</span> Drag to move · corners to resize
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Zoom out"
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
                >
                  <Minus size={15} />
                </button>
                <button className="zoom-label" title="Reset to fit" onClick={() => setZoom(1)}>
                  {Math.round(scale * 100)}%
                </button>
                <button
                  className="icon-button"
                  aria-label="Zoom in"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                >
                  <Plus size={15} />
                </button>
                <button className="icon-button" aria-label="Fit canvas" onClick={() => setZoom(1)}>
                  <Maximize size={15} />
                </button>
              </div>
            </div>
            <div className={`page-strip ${mode === 'reel' ? 'timeline' : ''}`}>
              <div className="page-strip-label">
                <span>{mode === 'reel' ? 'TIMELINE' : 'YOUR PAGES'}</span>
                <span>
                  {mode === 'reel'
                    ? `${durationOf(p).toFixed(1)}s total`
                    : `${p.pages.length} pages`}
                </span>
              </div>
              <div className="page-thumbnails">
                {p.pages.map((pg, i) => (
                  <button
                    className={`page-thumbnail ${state.pageIndex === i ? 'active' : ''}`}
                    key={pg.id}
                    onClick={() => state.setPage(i)}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/kreator-page', String(i))}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const raw = e.dataTransfer.getData('text/kreator-page');
                      if (raw === '') return;
                      const from = Number(raw);
                      if (!Number.isInteger(from) || from < 0 || from >= p.pages.length) return;
                      state.commit((p) => {
                        const pages = [...p.pages];
                        pages.splice(i, 0, pages.splice(from, 1)[0]);
                        return { ...p, pages };
                      });
                      state.setPage(i);
                    }}
                  >
                    <div style={{ background: pg.background }}>
                      <Canvas
                        page={pg}
                        width={p.width}
                        height={p.height}
                        zoom={Math.min(80 / p.width, 60 / p.height)}
                      />
                    </div>
                    <span>
                      {String(i + 1).padStart(2, '0')}
                      {mode === 'reel' && ` · ${pg.duration}s`}
                    </span>
                  </button>
                ))}
                <button
                  className="add-page"
                  onClick={() => {
                    state.commit((p) => ({ ...p, pages: [...p.pages, blankPage()] }));
                    state.setPage(p.pages.length);
                  }}
                >
                  <Plus size={22} />
                  <span>Add page</span>
                </button>
              </div>
              <div className="page-actions">
                <button
                  className="icon-button"
                  aria-label="Move page left"
                  disabled={state.pageIndex === 0}
                  onClick={() => state.movePage(-1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Move page right"
                  disabled={state.pageIndex === p.pages.length - 1}
                  onClick={() => state.movePage(1)}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Duplicate page"
                  onClick={state.duplicatePage}
                >
                  <Copy size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Delete page"
                  disabled={p.pages.length === 1}
                  onClick={state.removePage}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </section>
          <aside className="properties-panel">
            <div className="properties-heading">
              <h2>{selected ? 'Make it yours' : 'Page settings'}</h2>
              {selected && (
                <button
                  className="icon-button"
                  aria-label="Deselect element"
                  onClick={() => state.select(null)}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {selected ? (
              <Properties
                element={selected}
                width={p.width}
                onPatch={(patch) => state.patchElement(selected.id, patch)}
                onMath={() => setMath({ id: selected.id, expression: selected.text || '' })}
                onDuplicate={duplicateSelected}
                onDelete={removeSelected}
                onLayer={(direction) =>
                  state.updatePage((page) => {
                    const elements = [...page.elements],
                      index = elements.findIndex((e) => e.id === selected.id),
                      target = Math.max(0, Math.min(elements.length - 1, index + direction));
                    [elements[index], elements[target]] = [elements[target], elements[index]];
                    return { ...page, elements };
                  })
                }
              />
            ) : (
              <>
                <ColorField
                  label="Background"
                  value={page.background}
                  onChange={(background) => state.updatePage((page) => ({ ...page, background }))}
                />
                <div className="page-info">
                  <LayoutTemplate size={28} />
                  <h3>A canvas of possibilities</h3>
                  <p>Select an element to change its text, color, size, and more.</p>
                </div>
                <button
                  className="secondary full-width"
                  onClick={() => {
                    setMode('write');
                  }}
                >
                  Create from your words <ArrowRight size={15} />
                </button>
              </>
            )}
            <div className="layers-heading">
              <h3>Layers</h3>
              <span>{page.elements.length}</span>
            </div>
            <div className="layers-list">
              {[...page.elements].reverse().map((e) => (
                <button
                  key={e.id}
                  className={selected?.id === e.id ? 'active' : ''}
                  onClick={() => state.select(e.id)}
                >
                  {e.kind === 'text' ? (
                    <Type size={15} />
                  ) : e.kind === 'image' ? (
                    <Image size={15} />
                  ) : e.kind === 'math' ? (
                    <Sigma size={15} />
                  ) : (
                    <Square size={15} />
                  )}
                  <span>{e.text?.slice(0, 35) || e.kind}</span>
                </button>
              ))}
            </div>
            <p className="shortcut-hint">
              Ctrl+Z undo · Ctrl+D duplicate
              <br />
              Delete remove · Arrow keys nudge
            </p>
          </aside>
        </div>
      )}
      <input
        ref={uploadRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void upload(f);
        }}
      />
      {exporting && (
        <StudioExportDialog
          project={p}
          pageIndex={state.pageIndex}
          onClose={() => setExporting(false)}
          notice={notice}
        />
      )}
      {preview && (
        <PreviewDialog
          project={p}
          video={mode === 'reel'}
          onClose={() => setPreview(false)}
          notice={notice}
        />
      )}
      {math && (
        <MathDialog
          initial={math.expression}
          onClose={() => setMath(null)}
          onApply={async (expression) => {
            try {
              const old = math.id ? page.elements.find((e) => e.id === math.id) : undefined;
              const rendered = await mathImage(expression, old?.fill || '#28213e');
              const width = Math.min(p.width * 0.8, rendered.width),
                height = (width * rendered.height) / rendered.width;
              if (old)
                state.patchElement(old.id, { text: expression, src: rendered.src, width, height });
              else
                add(
                  element('math', {
                    text: expression,
                    src: rendered.src,
                    width,
                    height,
                    x: p.width * 0.1,
                    y: p.height * 0.4,
                  }),
                );
              setMath(null);
            } catch (err) {
              notice((err as Error).message);
            }
          }}
        />
      )}
      {templateConfirm && (
        <Modal title="Use this template?" onClose={() => setTemplateConfirm(null)}>
          <p>
            This replaces the current page’s layout and text. Your other pages stay as they are. You
            can undo this change.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setTemplateConfirm(null)}>
              Cancel
            </button>
            <button
              className="primary"
              onClick={() => {
                const t = templates.find((t) => t.id === templateConfirm)!;
                state.updatePage(() => templatePage(t, p.width, p.height));
                state.select(null);
                setTemplateConfirm(null);
              }}
            >
              Apply template
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Properties({
  element: e,
  width,
  onPatch,
  onMath,
  onDuplicate,
  onDelete,
  onLayer,
}: {
  element: DesignElement;
  width: number;
  onPatch: (p: Partial<DesignElement>) => void;
  onMath: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLayer: (n: number) => void;
}) {
  const numeric = (
    key: 'x' | 'y' | 'width' | 'height' | 'rotation' | 'fontSize' | 'letterSpacing' | 'radius',
    label: string,
    min?: number,
    max?: number,
  ) => (
    <label className="field" key={key}>
      {label}
      <input
        type="number"
        aria-label={label}
        value={Math.round((e[key] || 0) * 10) / 10}
        min={min}
        max={max}
        onChange={(event) => {
          const value = Number(event.target.value);
          if (Number.isFinite(value))
            onPatch({ [key]: Math.min(max ?? 100000, Math.max(min ?? -100000, value)) });
        }}
      />
    </label>
  );
  return (
    <>
      {e.kind === 'text' && (
        <>
          <label className="field">
            Text
            <textarea
              aria-label="Element text"
              value={e.text}
              rows={4}
              onChange={(event) => onPatch({ text: event.target.value })}
            />
          </label>
          <label className="field">
            Font family
            <select
              value={e.fontFamily || 'Arial'}
              onChange={(event) => onPatch({ fontFamily: event.target.value })}
            >
              {fonts.map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </label>
          <div className="field-row">
            {numeric('fontSize', 'Font size', 2, 1000)}
            <label className="field">
              Weight
              <select
                value={e.fontStyle || 'normal'}
                onChange={(event) => onPatch({ fontStyle: event.target.value })}
              >
                <option value="normal">Regular</option>
                <option value="bold">Bold</option>
                <option value="italic">Italic</option>
                <option value="bold italic">Bold italic</option>
              </select>
            </label>
          </div>
          <div className="segmented">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                className={(e.align || 'left') === align ? 'active' : ''}
                onClick={() => onPatch({ align })}
              >
                {align}
              </button>
            ))}
          </div>
          {numeric('letterSpacing', 'Letter spacing', -10, 50)}
        </>
      )}
      {(e.kind === 'rich' || e.kind === 'code') && (
        <>
          <label className="field">
            Editable source
            <textarea
              aria-label="Technical element source"
              rows={8}
              className={e.kind === 'code' ? 'code-source' : ''}
              value={e.text || ''}
              onChange={(event) => onPatch({ text: event.target.value })}
            />
          </label>
          {numeric('fontSize', 'Font size', 8, 180)}
          <label className="field">
            Font family
            <select
              value={e.fontFamily || 'Arial'}
              onChange={(event) => onPatch({ fontFamily: event.target.value })}
            >
              {fonts.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <p className="hint">
            Use Code studio or Rich Markdown above for the full component settings.
          </p>
        </>
      )}
      {e.kind === 'image' && (
        <div className="mask-controls">
          <label className="field">
            Image mask
            <select
              value={e.mask || 'none'}
              onChange={(event) => onPatch({ mask: event.target.value as 'none' | 'circle' })}
            >
              <option value="none">Rectangle</option>
              <option value="circle">Ellipse / circle</option>
            </select>
          </label>
          {(['x', 'y', 'width', 'height'] as const).map((key) => (
            <label className="field" key={key}>
              Crop {key} (%)
              <input
                type="number"
                min={key === 'width' || key === 'height' ? 1 : 0}
                max={100}
                value={Math.round(
                  (e.crop?.[key] ?? (key === 'width' || key === 'height' ? 1 : 0)) * 100,
                )}
                onChange={(event) => {
                  const crop = {
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                    ...e.crop,
                    [key]: Math.max(
                      key === 'width' || key === 'height' ? 0.01 : 0,
                      Math.min(
                        key === 'x' || key === 'y' ? 0.99 : 1,
                        Number(event.target.value) / 100,
                      ),
                    ),
                  };
                  crop.width = Math.min(crop.width, 1 - crop.x);
                  crop.height = Math.min(crop.height, 1 - crop.y);
                  onPatch({ crop });
                }}
              />
            </label>
          ))}
          <button
            className="text-button"
            onClick={() => onPatch({ crop: undefined, mask: 'none' })}
          >
            Reset crop
          </button>
        </div>
      )}
      {e.kind === 'math' && (
        <button className="secondary full-width" onClick={onMath}>
          <Sigma size={18} />
          Edit equation
        </button>
      )}
      {!['image', 'math'].includes(e.kind) && (
        <ColorField
          label={e.kind === 'text' ? 'Text color' : 'Fill color'}
          value={e.fill}
          onChange={(fill) => onPatch({ fill })}
        />
      )}
      <label className="field">
        Opacity · {Math.round(e.opacity * 100)}%
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={e.opacity}
          onChange={(event) => onPatch({ opacity: Number(event.target.value) })}
        />
      </label>
      <div className="panel-divider" />
      <h3 className="property-section">Position & size</h3>
      <div className="field-row">
        {numeric('x', 'X position')}
        {numeric('y', 'Y position')}
      </div>
      <div className="field-row">
        {numeric('width', 'Width', 12, 10000)}
        {numeric('height', 'Height', 12, 10000)}
      </div>
      <div className="field-row">
        {numeric('rotation', 'Rotation', -360, 360)}
        {e.kind === 'rect' && numeric('radius', 'Corner radius', 0, 1000)}
      </div>
      <button
        className="secondary full-width"
        onClick={() => onPatch({ x: (width - e.width) / 2 })}
      >
        Center horizontally
      </button>
      <div className="field-row layer-buttons">
        <button className="secondary" onClick={() => onLayer(1)}>
          <ArrowUp size={14} />
          Forward
        </button>
        <button className="secondary" onClick={() => onLayer(-1)}>
          <ArrowDown size={14} />
          Back
        </button>
      </div>
      <div className="field-row">
        <button className="secondary" onClick={onDuplicate}>
          <Copy size={15} />
          Copy
        </button>
        <button className="secondary danger-text" onClick={onDelete}>
          <Trash2 size={15} />
          Delete
        </button>
      </div>
      {e.kind === 'text' && (
        <p className="hint">
          Text automatically shrinks to fit its box. Enlarge the box for a more readable size.
        </p>
      )}
    </>
  );
}
function MathDialog({
  initial,
  onClose,
  onApply,
}: {
  initial: string;
  onClose: () => void;
  onApply: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initial),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="A little mathematical clarity" onClose={onClose}>
      <label className="field">
        LaTeX expression
        <textarea rows={5} value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <p className="hint">
        Try: {'\\frac{a}{b}'}, {'\\sqrt{x}'}, {'\\int_0^1 x^2 dx'}, or{' '}
        {'\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}'}.
      </p>
      <button
        className="primary full-width"
        disabled={busy || !value.trim()}
        onClick={async () => {
          setBusy(true);
          await onApply(value);
          setBusy(false);
        }}
      >
        <Sigma size={18} />
        {busy ? 'Rendering…' : 'Add to design'}
      </button>
    </Modal>
  );
}
function PreviewDialog({
  project: p,
  video,
  onClose,
  notice,
}: {
  project: Project;
  video: boolean;
  onClose: () => void;
  notice: (m: string) => void;
}) {
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [ready, setReady] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null),
    frames = useRef<VideoFrame[]>([]),
    audio = useRef<HTMLAudioElement>(null),
    timeRef = useRef(0);
  const total = durationOf(p);
  useEffect(() => {
    if (!video) return;
    let active = true;
    void prepareVideo(p, Math.min(720, p.width))
      .then((f) => {
        if (!active) return;
        frames.current = f;
        setReady(true);
        if (canvas.current) drawVideoFrame(canvas.current.getContext('2d')!, p, f, 0);
      })
      .catch((e) => notice(e.message));
    return () => {
      active = false;
    };
  }, [p, video, notice]);
  useEffect(() => {
    if (!playing || !ready) return;
    let raf = 0;
    const start = performance.now() - timeRef.current * 1000;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (elapsed >= total) {
        setPlaying(false);
        setTime(total);
        timeRef.current = 0;
        return;
      }
      timeRef.current = elapsed;
      setTime(elapsed);
      if (canvas.current)
        drawVideoFrame(canvas.current.getContext('2d')!, p, frames.current, elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    if (audio.current) {
      audio.current.currentTime = timeRef.current;
      audio.current.volume = p.volume;
      void audio.current
        .play()
        .catch(() => notice('Audio could not be played. Try a different audio file.'));
    }
    return () => {
      cancelAnimationFrame(raf);
      audio.current?.pause();
    };
  }, [playing, ready, p, total, notice]);
  return (
    <Modal
      title={video ? 'Your ideas in motion' : 'A fresh look at your creation'}
      onClose={onClose}
      wide
    >
      <div className="preview-stage">
        {video ? (
          <canvas
            ref={canvas}
            width={Math.min(720, p.width)}
            height={Math.round((Math.min(720, p.width) * p.height) / p.width)}
            style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
          />
        ) : (
          <Canvas
            page={p.pages[index]}
            width={p.width}
            height={p.height}
            zoom={Math.min(600 / p.width, (window.innerHeight * 0.58) / p.height)}
          />
        )}
      </div>
      {video ? (
        <>
          <div className="preview-controls">
            <button
              className="primary"
              disabled={!ready}
              onClick={() => {
                if (time >= total) {
                  timeRef.current = 0;
                  setTime(0);
                }
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}{' '}
              {ready ? (playing ? 'Pause' : 'Play') : 'Preparing…'}
            </button>
            <span>
              {time.toFixed(1)} / {total.toFixed(1)}s
            </span>
            <button
              className="icon-button"
              aria-label="Restart preview"
              onClick={() => {
                setPlaying(false);
                timeRef.current = 0;
                setTime(0);
                if (canvas.current && ready)
                  drawVideoFrame(canvas.current.getContext('2d')!, p, frames.current, 0);
              }}
            >
              <RotateCcw size={18} />
            </button>
          </div>
          {p.audio && <audio ref={audio} src={p.audio} loop />}
        </>
      ) : (
        <div className="preview-controls">
          <button className="secondary" disabled={!index} onClick={() => setIndex((i) => i - 1)}>
            <ChevronLeft size={18} />
            Previous
          </button>
          <span>
            {index + 1} / {p.pages.length}
          </span>
          <button
            className="secondary"
            disabled={index === p.pages.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </Modal>
  );
}
