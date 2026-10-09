import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Home,
  FolderOpen,
  LayoutTemplate,
  Palette,
  Layers,
  Clapperboard,
  Search,
  Upload,
  Copy,
  Trash2,
  MoreHorizontal,
  Instagram,
  Linkedin,
  Youtube,
  PanelTop,
  Smartphone,
  Check,
  X,
  Sparkles,
  HardDrive,
  WandSparkles,
} from 'lucide-react';
import { Logo, Modal, ColorField } from './ui';
import { Canvas } from './Canvas';
import { Editor } from './Editor';
import {
  formats,
  newProject,
  presets,
  fonts,
  uid,
  parseProject,
  type Project,
  type Brand,
} from './model';
import { templates, templatePage, type Template } from './templates';
import {
  listProjects,
  saveProject,
  deleteProject,
  listBrands,
  initializeBrands,
  saveBrand,
  deleteBrand,
} from './storage';
import { readImage, thumbnail } from './render';
import { useEditor } from './store';
type Section = 'Home' | 'My projects' | 'Templates' | 'Brand kits';
export default function App() {
  const [section, setSection] = useState<Section>('Home'),
    [editing, setEditing] = useState(false),
    [mode, setMode] = useState<'design' | 'write' | 'reel'>('design');
  const [projects, setProjects] = useState<Project[]>([]),
    [brands, setBrands] = useState<Brand[]>(presets),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('All templates');
  const [create, setCreate] = useState<{
      template?: Template;
      carousel?: boolean;
      reel?: boolean;
    } | null>(null),
    [toast, setToast] = useState(''),
    [loading, setLoading] = useState(true);
  const [brandEdit, setBrandEdit] = useState<Brand | null>(null),
    [deleting, setDeleting] = useState<Project | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const notice = useCallback((message: string) => setToast(message), []);
  const refresh = useCallback(async () => {
    try {
      setProjects(await listProjects());
    } catch {
      notice('Browser storage is unavailable. Enable site storage to save projects.');
    } finally {
      setLoading(false);
    }
  }, [notice]);
  useEffect(() => {
    void refresh();
    void initializeBrands()
      .then(setBrands)
      .catch(() => notice('Brand kits could not be loaded from browser storage.'));
  }, [refresh, notice]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  const open = (project: Project, editorMode: 'design' | 'write' | 'reel' = 'design') => {
    useEditor.getState().open(project);
    setMode(editorMode);
    setEditing(true);
    location.hash = `project/${project.id}`;
  };
  useEffect(() => {
    const id = location.hash.match(/^#project\/(.+)$/)?.[1];
    if (!loading && !editing && id) {
      const p = projects.find((p) => p.id === id);
      if (p) open(p);
    }
  }, [loading]);
  const home = async () => {
    setEditing(false);
    location.hash = '';
    await refresh();
  };
  const make = async (
    name: string,
    width: number,
    height: number,
    t?: Template,
    write = false,
    reel = false,
  ) => {
    const p = newProject(name, width, height, t ? [templatePage(t, width, height)] : undefined);
    try {
      p.thumbnail = await thumbnail(p);
      await saveProject(p);
      setCreate(null);
      open(p, reel ? 'reel' : write ? 'write' : 'design');
    } catch (e) {
      notice((e as Error).message);
    }
  };
  const duplicate = async (p: Project) => {
    try {
      const copy = structuredClone(p);
      copy.id = uid();
      copy.name = `${p.name} copy`;
      copy.updatedAt = Date.now();
      await saveProject(copy);
      await refresh();
      notice('Project duplicated.');
    } catch (e) {
      notice((e as Error).message);
    }
  };
  const filtered = projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      {editing ? (
        <Editor onHome={home} notice={notice} brands={brands} initialMode={mode} />
      ) : (
        <div className="app-shell">
          <aside className="main-sidebar">
            <Logo />
            <button className="primary create-button" onClick={() => setCreate({})}>
              <Plus size={18} /> Create a design
            </button>
            <nav aria-label="Main navigation">
              {(
                [
                  { name: 'Home', icon: Home },
                  { name: 'My projects', icon: FolderOpen },
                  { name: 'Templates', icon: LayoutTemplate },
                  { name: 'Brand kits', icon: Palette },
                ] as const
              ).map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={`nav-item ${section === name ? 'active' : ''}`}
                  onClick={() => {
                    setSection(name);
                    setQuery('');
                  }}
                >
                  <Icon size={19} />
                  {name}
                  {name === 'My projects' && <span className="nav-count">{projects.length}</span>}
                </button>
              ))}
            </nav>
            <div className="sidebar-label">YOUR CREATIVE TOOLKIT</div>
            <button className="nav-item" onClick={() => setCreate({ carousel: true })}>
              <Layers size={19} />
              Carousel creator<span className="new-badge">NEW</span>
            </button>
            <button className="nav-item" onClick={() => setCreate({ reel: true })}>
              <Clapperboard size={19} />
              Reel creator
            </button>
            <div className="sidebar-bottom">
              <div className="local-card">
                <span className="local-icon">
                  <HardDrive size={19} />
                </span>
                <strong>A little space for big ideas.</strong>
                <p>
                  Free to create. Yours to keep.
                  <br />
                  Saved right on this device.
                </p>
              </div>
              <div className="profile">
                <span className="avatar">Y</span>
                <div>
                  <strong>Your workspace</strong>
                  <small>Personal · Free forever</small>
                </div>
                <span className="online-dot" />
              </div>
            </div>
          </aside>
          <main className="dashboard">
            <header className="dashboard-top">
              <div className="breadcrumb">
                Your workspace <span>/</span> <strong>{section}</strong>
              </div>
              <span className="local-status">
                <span /> All creativity. No subscriptions.
              </span>
            </header>
            <div className="dashboard-content">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">A GOOD DAY TO MAKE SOMETHING</p>
                  <h1>
                    {section === 'Home'
                      ? 'Big ideas start here.'
                      : section === 'My projects'
                        ? 'Made by you.'
                        : section === 'Templates'
                          ? 'A head start for every idea.'
                          : 'Make it unmistakably yours.'}
                  </h1>
                  <p className="subheading">
                    {section === 'Home'
                      ? 'Turn what you know into something worth sharing.'
                      : section === 'My projects'
                        ? 'Your ideas, experiments, and next great thing — all in one place.'
                        : section === 'Templates'
                          ? 'Thoughtfully designed. Completely editable. Ready for your words.'
                          : 'Your colors, your type, your signature. One click away.'}
                  </p>
                </div>
                {section === 'My projects' && (
                  <button className="secondary" onClick={() => importRef.current?.click()}>
                    <Upload size={16} />
                    Import project
                  </button>
                )}
                {section === 'Brand kits' && (
                  <button
                    className="primary"
                    onClick={() =>
                      setBrandEdit({
                        ...presets[0],
                        id: uid(),
                        name: 'My brand',
                        watermark: '',
                        handle: '',
                      })
                    }
                  >
                    <Plus size={17} />
                    New brand kit
                  </button>
                )}
              </div>
              {section === 'Home' && (
                <>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="hero-tag">
                        <Sparkles size={13} /> FROM A THOUGHT TO A FINISHED DESIGN
                      </span>
                      <h2>
                        You bring the words.
                        <br />
                        We’ll bring the <em>wow.</em>
                      </h2>
                      <p>
                        A post, a carousel, your next big announcement.
                        <br />
                        Make it beautifully yours in just a few clicks.
                      </p>
                      <button className="dark-button" onClick={() => setCreate({ carousel: true })}>
                        Start with your words <ArrowRight size={17} />
                      </button>
                      <span className="hero-footnote">
                        No design experience needed. Just an idea.
                      </span>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <span className="art-spark spark-one">✳</span>
                      <span className="art-spark spark-two">✧</span>
                      <div className="hero-card card-back">
                        <span>THE DATA NOTEBOOK</span>
                        <strong>
                          Let your data
                          <br />
                          tell the story.
                        </strong>
                        <div className="mini-chart">
                          <i />
                          <i />
                          <i />
                          <i />
                        </div>
                        <small>FIND THE MEANING IN THE NUMBERS.</small>
                      </div>
                      <div className="hero-card card-front">
                        <span>A LITTLE REMINDER</span>
                        <div className="sun-mark">✳</div>
                        <strong>
                          Good things
                          <br />
                          start with
                          <br />
                          <em>one idea.</em>
                        </strong>
                        <small>MAKE SOMETHING THAT MATTERS. ↗</small>
                      </div>
                      <div className="floating-pill">
                        <span>✦</span> A little inspiration, a lot of you.
                      </div>
                    </div>
                  </section>
                  <section className="formats-section">
                    <div className="section-heading">
                      <h2>What are we creating?</h2>
                      <button className="text-button" onClick={() => setCreate({})}>
                        Custom size <Plus size={15} />
                      </button>
                    </div>
                    <div className="format-grid">
                      {formats.map((format, i) => {
                        const Icon = [Instagram, PanelTop, Smartphone, Linkedin, PanelTop, Youtube][
                          i
                        ];
                        return (
                          <button
                            className="format-card"
                            key={format.name}
                            onClick={() =>
                              void make(format.name, format.width, format.height, templates[i])
                            }
                          >
                            <span className={`format-icon format-${i}`}>
                              <Icon size={24} />
                            </span>
                            <strong>{format.name}</strong>
                            <small>
                              {format.width} × {format.height} px
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}
              {(section === 'Home' || section === 'My projects') && (
                <section className="projects-section">
                  <div className="section-heading">
                    <h2>
                      {section === 'Home' ? 'Pick up where you left off' : 'Your projects'}{' '}
                      <span className="count-pill">{projects.length}</span>
                    </h2>
                    {section === 'Home' ? (
                      <button className="text-button" onClick={() => setSection('My projects')}>
                        View all projects <ArrowRight size={15} />
                      </button>
                    ) : (
                      <label className="search-box">
                        <Search size={17} />
                        <input
                          aria-label="Search projects"
                          placeholder="Find a project…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                  {loading ? (
                    <div className="empty-state">Opening your workspace…</div>
                  ) : filtered.length ? (
                    <div className="project-grid">
                      {filtered.slice(0, section === 'Home' ? 4 : undefined).map((p) => (
                        <div className="project-card" key={p.id}>
                          <button className="project-preview" onClick={() => open(p)}>
                            {p.thumbnail ? (
                              <img src={p.thumbnail} alt={p.name} />
                            ) : (
                              <Canvas
                                page={p.pages[0]}
                                width={p.width}
                                height={p.height}
                                zoom={180 / p.width}
                              />
                            )}
                            <span className="page-badge">
                              <Layers size={12} />
                              {p.pages.length} {p.pages.length === 1 ? 'page' : 'pages'}
                            </span>
                          </button>
                          <div className="project-details">
                            <button onClick={() => open(p)}>
                              <strong>{p.name}</strong>
                              <small>
                                {p.width} × {p.height} ·{' '}
                                {new Date(p.updatedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </small>
                            </button>
                            <details className="project-menu">
                              <summary aria-label={`Options for ${p.name}`}>
                                <MoreHorizontal size={19} />
                              </summary>
                              <div>
                                <button onClick={() => void duplicate(p)}>
                                  <Copy size={14} />
                                  Duplicate
                                </button>
                                <button onClick={() => setDeleting(p)}>
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </details>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-projects">
                      <span className="empty-illustration">
                        <FolderOpen size={28} />
                      </span>
                      <div>
                        <h3>
                          {query ? 'No matching projects' : 'Your next great idea belongs here.'}
                        </h3>
                        <p>
                          {query
                            ? 'Try another name.'
                            : 'Create your first design. We’ll keep it safe on this device.'}
                        </p>
                      </div>
                      <button className="secondary" onClick={() => setCreate({})}>
                        <Plus size={16} />
                        Create a design
                      </button>
                    </div>
                  )}
                </section>
              )}
              {(section === 'Home' || section === 'Templates') && (
                <section className="templates-section">
                  <div className="section-heading">
                    <div>
                      <h2>A little inspiration goes a long way</h2>
                      <p>Start with a template. Make it your own.</p>
                    </div>
                    {section === 'Home' && (
                      <button className="text-button" onClick={() => setSection('Templates')}>
                        Explore templates <ArrowRight size={15} />
                      </button>
                    )}
                    {section === 'Templates' && (
                      <label className="search-box">
                        <Search size={17} />
                        <input
                          aria-label="Search templates"
                          placeholder="Search templates…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                  <div className="filter-row">
                    {[
                      'All templates',
                      'Education',
                      'Data Science',
                      'Mathematics',
                      'Research',
                      'Quotes',
                      'Business',
                      'Carousel',
                      ...(section === 'Templates'
                        ? ['Tutorials', 'Myth vs Fact', 'Comparison', 'Product', 'LinkedIn']
                        : []),
                    ].map((c) => (
                      <button
                        className={category === c ? 'active' : ''}
                        key={c}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="template-grid">
                    {templates
                      .filter(
                        (t) =>
                          (category === 'All templates' || t.category === category) &&
                          `${t.name} ${t.category} ${t.title}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .slice(0, section === 'Home' ? 4 : undefined)
                      .map((t) => (
                        <button
                          className="template-card"
                          key={t.id}
                          onClick={() => setCreate({ template: t })}
                        >
                          <div className="template-preview">
                            <TemplateThumb template={t} />
                            <span className="template-use">
                              Make it yours <ArrowUpRight size={16} />
                            </span>
                          </div>
                          <strong>{t.name}</strong>
                          <small>
                            {t.category} <span>·</span> Free template
                          </small>
                        </button>
                      ))}
                  </div>
                </section>
              )}
              {section === 'Brand kits' && (
                <div className="brand-grid">
                  {brands.map((b) => (
                    <button
                      className="brand-card"
                      key={b.id}
                      onClick={() => setBrandEdit(structuredClone(b))}
                    >
                      <div
                        className="brand-sample"
                        style={{
                          background: b.secondary,
                          color: b.primary,
                          fontFamily: b.headingFont,
                        }}
                      >
                        {b.logo ? (
                          <img src={b.logo} alt="" />
                        ) : (
                          <span className="brand-letter">{b.name[0]}</span>
                        )}
                        <strong>{b.name}</strong>
                        <small>{b.watermark || 'YOUR BRAND, BEAUTIFULLY CONSISTENT.'}</small>
                        <div>
                          {[b.primary, b.secondary, b.accent].map((color, i) => (
                            <i key={i} style={{ background: color }} />
                          ))}
                        </div>
                      </div>
                      <div className="brand-card-footer">
                        <strong>{b.name}</strong>
                        <span>
                          Edit brand <ArrowUpRight size={14} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <footer className="dashboard-footer">
                <Logo small />
                <span>A space for your ideas. Made to be yours.</span>
                <span>Saved locally · Back up your projects as JSON</span>
              </footer>
            </div>
          </main>
          <input
            ref={importRef}
            hidden
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                if (f.size > 60 * 1024 * 1024)
                  throw new Error('Project files must be smaller than 60 MB.');
                const p = parseProject(await f.text());
                await saveProject(p);
                open(p);
                notice('Project imported.');
              } catch (err) {
                notice((err as Error).message);
              }
            }}
          />
        </div>
      )}
      {create && <CreateDialog options={create} onClose={() => setCreate(null)} onCreate={make} />}
      {brandEdit && (
        <BrandDialog
          brand={brandEdit}
          onClose={() => setBrandEdit(null)}
          onSave={async (b) => {
            try {
              await saveBrand(b);
              setBrands(await listBrands());
              setBrandEdit(null);
              notice('Brand kit saved.');
            } catch (e) {
              notice((e as Error).message);
            }
          }}
          onDelete={async () => {
            try {
              await deleteBrand(brandEdit.id);
              setBrands(await listBrands());
              setBrandEdit(null);
            } catch (e) {
              notice((e as Error).message);
            }
          }}
          notice={notice}
        />
      )}
      {deleting && (
        <Modal title="Delete this project?" onClose={() => setDeleting(null)}>
          <p>“{deleting.name}” will be removed from this browser. This cannot be undone.</p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setDeleting(null)}>
              Keep project
            </button>
            <button
              className="danger"
              onClick={async () => {
                try {
                  await deleteProject(deleting.id);
                  setDeleting(null);
                  await refresh();
                } catch (e) {
                  notice((e as Error).message);
                }
              }}
            >
              Delete project
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toast}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
function TemplateThumb({ template }: { template: Template }) {
  const [page] = useState(() => templatePage(template));
  return <Canvas page={page} width={1080} height={1080} zoom={0.25} />;
}
function CreateDialog({
  options,
  onClose,
  onCreate,
}: {
  options: { template?: Template; carousel?: boolean; reel?: boolean };
  onClose: () => void;
  onCreate: (
    name: string,
    width: number,
    height: number,
    t?: Template,
    write?: boolean,
    reel?: boolean,
  ) => Promise<void>;
}) {
  const [name, setName] = useState(
      options.template?.name ||
        (options.carousel ? 'My new carousel' : options.reel ? 'My new reel' : 'Untitled design'),
    ),
    [width, setWidth] = useState(1080),
    [height, setHeight] = useState(options.reel ? 1920 : 1080),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title={
        options.carousel
          ? 'Make your words worth swiping'
          : options.reel
            ? 'Create a little motion'
            : 'Make something yours'
      }
      onClose={onClose}
    >
      <p className="muted">
        {options.carousel
          ? 'Paste your article in the writing workspace, then choose how many slides to create.'
          : 'Choose a format and give your idea a name.'}
      </p>
      <label className="field">
        Project name
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
      </label>
      <label className="field">
        Format
        <select
          value={formats.findIndex((f) => f.width === width && f.height === height)}
          onChange={(e) => {
            const f = formats[Number(e.target.value)];
            if (f) {
              setWidth(f.width);
              setHeight(f.height);
            } else {
              setWidth(1000);
              setHeight(1000);
            }
          }}
        >
          {formats.map((f, i) => (
            <option value={i} key={f.name}>
              {f.name} · {f.width} × {f.height}
            </option>
          ))}
          <option value={-1}>Custom size</option>
        </select>
      </label>
      <div className="field-row">
        <label className="field">
          Width (px)
          <input
            type="number"
            min={100}
            max={4096}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Height (px)
          <input
            type="number"
            min={100}
            max={4096}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="info-note">
        <HardDrive size={17} />
        <span>
          Your work stays on this device. Clearing browser data may remove local projects. Export
          JSON backups for safekeeping.
        </span>
      </div>
      <button
        className="primary full-width"
        disabled={
          busy || !name.trim() || width < 100 || height < 100 || width > 4096 || height > 4096
        }
        onClick={async () => {
          setBusy(true);
          await onCreate(
            name.trim(),
            width,
            height,
            options.template || templates[0],
            options.carousel,
            options.reel,
          );
          setBusy(false);
        }}
      >
        <WandSparkles size={18} />
        {busy ? 'Creating…' : 'Let’s create'}
      </button>
    </Modal>
  );
}
function BrandDialog({
  brand,
  onClose,
  onSave,
  onDelete,
  notice,
}: {
  brand: Brand;
  onClose: () => void;
  onSave: (b: Brand) => void;
  onDelete: () => void;
  notice: (m: string) => void;
}) {
  const [value, setValue] = useState(brand),
    [confirmDelete, setConfirmDelete] = useState(false);
  const patch = (p: Partial<Brand>) => setValue((v) => ({ ...v, ...p }));
  return (
    <Modal title="Your brand kit" onClose={onClose}>
      <label className="field">
        Brand name
        <input value={value.name} onChange={(e) => patch({ name: e.target.value })} />
      </label>
      <div className="brand-colors">
        {(['primary', 'secondary', 'accent'] as const).map((key) => (
          <ColorField
            key={key}
            label={key}
            value={value[key]}
            onChange={(v) => patch({ [key]: v })}
          />
        ))}
      </div>
      <div className="field-row">
        {(['headingFont', 'bodyFont'] as const).map((key) => (
          <label className="field" key={key}>
            {key === 'headingFont' ? 'Heading font' : 'Body font'}
            <select value={value[key]} onChange={(e) => patch({ [key]: e.target.value })}>
              {fonts.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className="field">
        Default watermark
        <input value={value.watermark} onChange={(e) => patch({ watermark: e.target.value })} />
      </label>
      <label className="field">
        Social handle
        <input value={value.handle} onChange={(e) => patch({ handle: e.target.value })} />
      </label>
      <label className="upload-box">
        {value.logo ? <img src={value.logo} alt="Brand logo" /> : <Upload size={22} />}
        <span>Upload logo · PNG, JPG, WebP</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file)
              try {
                patch({ logo: await readImage(file) });
              } catch (err) {
                notice((err as Error).message);
              }
          }}
        />
      </label>
      {value.logo && (
        <button className="text-button" onClick={() => patch({ logo: undefined })}>
          Remove logo
        </button>
      )}
      <div className="modal-actions">
        <button
          className="text-button danger-text"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
        >
          {confirmDelete ? 'Confirm deletion' : 'Delete kit'}
        </button>
        <button className="primary" disabled={!value.name.trim()} onClick={() => onSave(value)}>
          Save brand kit
        </button>
      </div>
    </Modal>
  );
}
