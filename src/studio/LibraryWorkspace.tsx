import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  CalendarDays,
  FolderOpen,
  ImagePlus,
  Search,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../ui';
import { uid, presets, type Brand, type Project } from '../model';
import {
  listContent,
  saveContent,
  removeContent,
  listAssets,
  saveAsset,
  removeAsset,
  backupWorkspace,
  restoreWorkspace,
  saveProject,
  listProjects,
} from '../storage';
import { emptyContent, statuses, platforms, type ContentItem, type Asset } from './types';
import { importCampaign, projectFromContent } from './campaign';
import { readImage } from '../render';
import { download, safeName } from '../exports';
export function LibraryWorkspace({
  calendar = false,
  brands,
  notice,
  onOpen,
}: {
  calendar?: boolean;
  brands: Brand[];
  notice: (s: string) => void;
  onOpen: (p: Project, mode?: 'design' | 'write' | 'reel') => void;
}) {
  const [items, setItems] = useState<ContentItem[]>([]),
    [assets, setAssets] = useState<Asset[]>([]),
    [tab, setTab] = useState<'content' | 'assets'>('content'),
    [view, setView] = useState<'month' | 'week' | 'list' | 'kanban'>(calendar ? 'month' : 'list'),
    [date, setDate] = useState(
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    ),
    [query, setQuery] = useState(''),
    [status, setStatus] = useState('All'),
    [campaign, setCampaign] = useState('All'),
    [platform, setPlatform] = useState('All'),
    [format, setFormat] = useState('All'),
    [editing, setEditing] = useState<ContentItem | null>(null),
    [preview, setPreview] = useState<ContentItem[] | null>(null),
    [selection, setSelection] = useState<string[]>([]),
    [restore, setRestore] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [storage, setStorage] = useState(''),
    [brandId, setBrandId] = useState('malik-kolade');
  const file = useRef<HTMLInputElement>(null),
    backup = useRef<HTMLInputElement>(null);
  const refresh = async () => {
    try {
      setItems(await listContent());
      setAssets(await listAssets());
      const usage = await navigator.storage?.estimate();
      if (usage)
        setStorage(
          `${((usage.usage || 0) / 1024 / 1024).toFixed(1)} MB used on this origin${usage.quota ? ` · ${Math.round(((usage.usage || 0) / usage.quota) * 100)}% of available storage` : ''}`,
        );
    } catch (e) {
      notice((e as Error).message);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const filtered = items.filter(
    (i) =>
      `${i.title} ${i.details.topic} ${i.markdown}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'All' || i.details.status === status) &&
      (campaign === 'All' || i.details.campaign === campaign) &&
      (platform === 'All' || i.details.platform === platform) &&
      (format === 'All' || i.format === format),
  );
  const save = async (item: ContentItem) => {
    await saveContent({
      ...item,
      updatedAt: Date.now(),
      history: [
        ...item.history.slice(-29),
        {
          at: Date.now(),
          note: `Saved as ${item.details.status}${item.details.scheduledDate ? ' · ' + item.details.scheduledDate : ''}.`,
        },
      ],
    });
    await refresh();
  };
  const createDesigns = async (records: ContentItem[]) => {
    setBusy(true);
    try {
      const brand = brands.find((b) => b.id === brandId) || presets[0];
      for (const item of records) {
        const p = projectFromContent(item, brand);
        await saveProject(p);
        await saveContent({
          ...item,
          projectIds: [...item.projectIds, p.id],
          details: { ...item.details, status: 'Designing' },
        });
      }
      await refresh();
      notice(
        `${records.length} design project${records.length === 1 ? '' : 's'} created. Open them from linked designs or My projects.`,
      );
    } catch (e) {
      notice((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const tile = (item: ContentItem) => (
    <div className="content-tile" key={item.id}>
      <label className="select-item">
        <input
          type="checkbox"
          aria-label={`Select ${item.title}`}
          checked={selection.includes(item.id)}
          onChange={(e) =>
            setSelection((s) =>
              e.target.checked ? [...s, item.id] : s.filter((id) => id !== item.id),
            )
          }
        />
        <span>
          {item.details.day ? `DAY ${String(item.details.day).padStart(3, '0')}` : item.format}
        </span>
      </label>
      <button className="content-title" onClick={() => setEditing(structuredClone(item))}>
        {item.title}
      </button>
      <p>{item.details.topic || 'Add a topic'}</p>
      <div>
        <span className={`status-chip status-${item.details.status.toLowerCase()}`}>
          {item.details.status}
        </span>
        <small>{item.details.scheduledDate || 'Unscheduled'}</small>
      </div>
      <small>
        {item.details.campaign} · {item.details.platform}
      </small>
    </div>
  );
  const base = new Date(`${date}T12:00:00`),
    start = new Date(base);
  if (view === 'month') start.setDate(1);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: view === 'week' ? 7 : 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  return (
    <section className="library-workspace">
      <header className="library-heading">
        <div>
          <p className="eyebrow">YOUR IDEAS, WITH ROOM TO GROW</p>
          <h1>{calendar ? 'A rhythm for your ideas.' : 'Your content, connected.'}</h1>
          <p className="subheading">
            Plan your 120-day campaign. Keep the writing, designs, and next steps together.
          </p>
        </div>
        <button
          className="primary"
          onClick={() =>
            setEditing({
              id: uid(),
              title: 'Untitled idea',
              markdown: '',
              details: { ...emptyContent(), status: 'Idea' },
              projectIds: [],
              format: 'Carousel',
              updatedAt: Date.now(),
              history: [],
            })
          }
        >
          <Plus size={16} />
          New idea
        </button>
      </header>
      <div className="library-actions">
        <div className="mode-switch">
          <button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>
            <FolderOpen size={15} />
            Content
          </button>
          <button className={tab === 'assets' ? 'active' : ''} onClick={() => setTab('assets')}>
            <ImagePlus size={15} />
            Assets
          </button>
        </div>
        <button className="secondary" onClick={() => file.current?.click()}>
          <Upload size={15} />
          Import campaign
        </button>
        <button
          className="secondary"
          onClick={() =>
            void backupWorkspace()
              .then((data) =>
                download(
                  new Blob([JSON.stringify(data)], { type: 'application/json' }),
                  'kreator-workspace-backup.json',
                ),
              )
              .catch((e) => notice(e.message))
          }
        >
          <Download size={15} />
          Backup workspace
        </button>
        <button className="text-button" onClick={() => backup.current?.click()}>
          Restore backup
        </button>
      </div>
      {tab === 'content' ? (
        <>
          <div className="library-filters">
            <label className="search-box">
              <Search size={16} />
              <input
                aria-label="Search content"
                placeholder="Search title, topic, or writing…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Status filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="Campaign filter"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
            >
              <option value="All">All campaigns</option>
              {[...new Set(items.map((i) => i.details.campaign).filter(Boolean))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Platform filter"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="All">All platforms</option>
              {platforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              aria-label="Format filter"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="All">All formats</option>
              {['Carousel', 'Graphic', 'Reel', 'Article'].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="library-viewbar">
            <div className="mode-switch">
              {(['list', 'kanban', 'month', 'week'] as const).map((v) => (
                <button key={v} className={v === view ? 'active' : ''} onClick={() => setView(v)}>
                  {v}
                </button>
              ))}
            </div>
            <span>{filtered.length} items</span>
            <button
              className="text-button"
              onClick={() => setSelection(selection.length ? [] : filtered.map((i) => i.id))}
            >
              {selection.length ? 'Clear selection' : 'Select filtered items'}
            </button>
            {selection.length > 0 && (
              <>
                <select
                  aria-label="Batch brand"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void createDesigns(items.filter((i) => selection.includes(i.id)))}
                >
                  {busy ? 'Creating…' : `Create ${selection.length} designs`}
                </button>
              </>
            )}
          </div>
          {view === 'list' ? (
            <div className="content-grid">{filtered.map(tile)}</div>
          ) : view === 'kanban' ? (
            <div className="kanban-board">
              {statuses.map((s) => (
                <section key={s}>
                  <h3>
                    {s} <span>{filtered.filter((i) => i.details.status === s).length}</span>
                  </h3>
                  {filtered.filter((i) => i.details.status === s).map(tile)}
                </section>
              ))}
            </div>
          ) : (
            <>
              <div className="calendar-toolbar">
                <button
                  className="icon-button"
                  aria-label="Previous calendar period"
                  onClick={() => {
                    const d = new Date(base);
                    view === 'month' ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7);
                    setDate(d.toISOString().slice(0, 10));
                  }}
                >
                  <ArrowLeft size={17} />
                </button>
                <input
                  aria-label="Calendar date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
                <button
                  className="icon-button"
                  aria-label="Next calendar period"
                  onClick={() => {
                    const d = new Date(base);
                    view === 'month' ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7);
                    setDate(d.toISOString().slice(0, 10));
                  }}
                >
                  <ArrowRight size={17} />
                </button>
              </div>
              <div className="calendar-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <strong key={d}>{d}</strong>
                ))}
                {days.map((day) => (
                  <div
                    className={`calendar-day ${day.slice(0, 7) !== date.slice(0, 7) ? 'outside' : ''}`}
                    key={day}
                  >
                    <span>{Number(day.slice(8))}</span>
                    {filtered
                      .filter((i) => i.details.scheduledDate === day)
                      .map((item) => (
                        <button key={item.id} onClick={() => setEditing(structuredClone(item))}>
                          {item.details.day ? `${item.details.day}. ` : ''}
                          {item.title}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
              <p className="hint">
                {filtered.filter((i) => !i.details.scheduledDate).length} unscheduled items.
                Calendar dates are manual planning dates; Kreator does not post to social accounts.
              </p>
            </>
          )}
          {!filtered.length && (
            <div className="empty-state">
              Start with an idea, or import your campaign from Markdown, JSON, or CSV.
            </div>
          )}
        </>
      ) : (
        <>
          <label className="upload-box">
            <ImagePlus size={25} />
            <strong>Upload reusable images</strong>
            <span>Profile photos, screenshots, illustrations, backgrounds, and logos</span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                try {
                  for (const f of [...(e.target.files || [])]) {
                    const src = await readImage(f);
                    await saveAsset({
                      id: uid(),
                      name: f.name,
                      tags: '',
                      src,
                      bytes: Math.round(src.length * 0.75),
                      createdAt: Date.now(),
                    });
                  }
                  await refresh();
                } catch (err) {
                  notice((err as Error).message);
                }
                e.target.value = '';
              }}
            />
          </label>
          <p className="hint">
            {storage}. Large images and audio share browser storage with your designs. Keep
            workspace backups.
          </p>
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label="Search assets"
              placeholder="Search names or tags…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="asset-grid">
            {assets
              .filter((asset) =>
                (asset.name + ' ' + asset.tags).toLowerCase().includes(query.toLowerCase()),
              )
              .map((asset) => (
                <div key={asset.id}>
                  <img src={asset.src} alt={asset.name} />
                  <input
                    aria-label={`Asset name ${asset.name}`}
                    value={asset.name}
                    onChange={(e) =>
                      setAssets((a) =>
                        a.map((x) => (x.id === asset.id ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    onBlur={() => void saveAsset(asset).catch((e) => notice(e.message))}
                  />
                  <input
                    aria-label={`Tags for ${asset.name}`}
                    placeholder="Tags: profile, python, chart…"
                    value={asset.tags}
                    onChange={(e) =>
                      setAssets((a) =>
                        a.map((x) => (x.id === asset.id ? { ...x, tags: e.target.value } : x)),
                      )
                    }
                    onBlur={() => void saveAsset(asset).catch((e) => notice(e.message))}
                  />
                  <button
                    className="text-button"
                    onClick={() => download(asset.src, safeName(asset.name) + '.png')}
                  >
                    Download
                  </button>
                  <button
                    className="text-button danger-text"
                    onClick={() =>
                      void removeAsset(asset.id)
                        .then(refresh)
                        .catch((e) => notice(e.message))
                    }
                  >
                    Remove from library
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
      <input
        hidden
        ref={file}
        type="file"
        accept=".md,.markdown,.json,.csv,.tsv"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f)
            try {
              setPreview(importCampaign(await f.text(), f.name));
            } catch (err) {
              notice((err as Error).message);
            }
        }}
      />
      <input
        hidden
        ref={backup}
        type="file"
        accept=".json"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f)
            try {
              if (f.size > 150_000_000) throw new Error('Backup is larger than 150 MB.');
              const raw = await f.text();
              const data = JSON.parse(raw);
              if (data.kind !== 'kreator-workspace')
                throw new Error('Choose a Kreator workspace backup.');
              setRestore(raw);
            } catch (err) {
              notice((err as Error).message);
            }
        }}
      />
      {preview && (
        <Modal
          title={`Import preview · ${preview.length} items`}
          onClose={() => setPreview(null)}
          wide
        >
          <p>
            Review the detected writing before saving. Explicit day numbers, captions, scripts, and
            slide text are retained. No designs or claims are invented.
          </p>
          <div className="import-preview">
            {preview.map((i) => (
              <div key={i.id}>
                <strong>
                  {i.details.day ? `Day ${i.details.day} · ` : ''}
                  {i.title}
                </strong>
                <span>
                  {i.markdown.length} source characters ·{' '}
                  {Object.values(i.details.captions).filter(Boolean).length} captions
                </span>
                <p>{i.markdown.slice(0, 180)}</p>
              </div>
            ))}
          </div>
          <button
            className="primary full-width"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                for (const item of preview) await saveContent(item);
                setPreview(null);
                await refresh();
                notice('Campaign imported. Select items to create design projects in a batch.');
              } catch (e) {
                notice((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Save imported content
          </button>
        </Modal>
      )}
      {restore && (
        <Modal title="Restore a local workspace backup" onClose={() => setRestore(null)}>
          <p>
            This adds {JSON.parse(restore).projects?.length || 0} projects,{' '}
            {JSON.parse(restore).content?.length || 0} content items, and{' '}
            {JSON.parse(restore).assets?.length || 0} assets as independent copies. Existing records
            are preserved.
          </p>
          <button
            className="primary full-width"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await restoreWorkspace(restore);
                setRestore(null);
                await refresh();
                notice('Workspace backup restored as new records.');
              } catch (e) {
                notice((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Restore copies
          </button>
        </Modal>
      )}
      {editing && (
        <ContentDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSave={async (item) => {
            try {
              await save(item);
              setEditing(null);
            } catch (e) {
              notice((e as Error).message);
            }
          }}
          onCreate={async (item) => {
            try {
              await save(item);
              const p = projectFromContent(
                item,
                brands.find((b) => b.id === brandId) || presets[0],
              );
              await saveProject(p);
              await saveContent({ ...item, projectIds: [...item.projectIds, p.id] });
              onOpen(p, 'write');
            } catch (e) {
              notice((e as Error).message);
            }
          }}
          onOpen={async (id) => {
            try {
              const project = (await listProjects()).find((p) => p.id === id);
              if (project) onOpen(project);
              else notice('This linked project is no longer in the local library.');
            } catch (e) {
              notice((e as Error).message);
            }
          }}
          onDelete={async () => {
            await removeContent(editing.id);
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </section>
  );
}
function ContentDialog({
  item,
  onClose,
  onSave,
  onCreate,
  onOpen,
  onDelete,
}: {
  item: ContentItem;
  onClose: () => void;
  onSave: (i: ContentItem) => void;
  onCreate: (i: ContentItem) => void;
  onOpen: (id: string) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(item),
    [remove, setRemove] = useState(false);
  const details = (patch: Partial<ContentItem['details']>) =>
    setValue((v) => ({ ...v, details: { ...v.details, ...patch } }));
  return (
    <Modal title="Content notebook" onClose={onClose} wide>
      <div className="technical-dialog-grid">
        <div>
          <label className="field">
            Working title
            <input
              value={value.title}
              onChange={(e) => setValue((v) => ({ ...v, title: e.target.value }))}
            />
          </label>
          <label className="field">
            Original Markdown
            <textarea
              aria-label="Content Markdown"
              rows={13}
              value={value.markdown}
              onChange={(e) => setValue((v) => ({ ...v, markdown: e.target.value }))}
            />
          </label>
          <label className="field">
            Instagram caption
            <textarea
              rows={3}
              value={value.details.captions.Instagram}
              onChange={(e) =>
                details({ captions: { ...value.details.captions, Instagram: e.target.value } })
              }
            />
          </label>
          <label className="field">
            Reel script
            <textarea
              value={value.details.narration}
              onChange={(e) => details({ narration: e.target.value })}
            />
          </label>
        </div>
        <div>
          <label className="field">
            Topic
            <input
              value={value.details.topic}
              onChange={(e) => details({ topic: e.target.value })}
            />
          </label>
          <label className="field">
            Campaign
            <input
              value={value.details.campaign}
              onChange={(e) => details({ campaign: e.target.value })}
            />
          </label>
          <div className="field-row">
            <label className="field">
              Day number
              <input
                type="number"
                min={1}
                value={value.details.day || ''}
                onChange={(e) => details({ day: Number(e.target.value) || undefined })}
              />
            </label>
            <label className="field">
              Status
              <select
                value={value.details.status}
                onChange={(e) =>
                  details({ status: e.target.value as ContentItem['details']['status'] })
                }
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Scheduled date
            <input
              type="date"
              value={value.details.scheduledDate}
              onChange={(e) => details({ scheduledDate: e.target.value })}
            />
          </label>
          <div className="field-row">
            <label className="field">
              Platform
              <select
                value={value.details.platform}
                onChange={(e) =>
                  details({ platform: e.target.value as ContentItem['details']['platform'] })
                }
              >
                {platforms.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Format
              <select
                value={value.format}
                onChange={(e) => setValue((v) => ({ ...v, format: e.target.value }))}
              >
                {['Carousel', 'Graphic', 'Reel', 'Article'].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Planning notes
            <textarea
              rows={3}
              value={value.details.notes}
              onChange={(e) => details({ notes: e.target.value })}
            />
          </label>
          <h3 className="property-section">Linked designs</h3>
          {value.projectIds.map((id, i) => (
            <button className="text-button" key={id} onClick={() => onOpen(id)}>
              Open design {i + 1}
            </button>
          ))}
          <details>
            <summary>Revision history & exports</summary>
            {value.exports?.map((entry, i) => (
              <p className="hint" key={`export-${i}`}>
                {new Date(entry.at).toLocaleString()} · Exported {entry.name}
              </p>
            ))}
            {value.history.map((h, i) => (
              <p className="hint" key={i}>
                {new Date(h.at).toLocaleString()} · {h.note}
              </p>
            ))}
          </details>
        </div>
      </div>
      <div className="modal-actions">
        <button
          className="text-button danger-text"
          onClick={() => (remove ? onDelete() : setRemove(true))}
        >
          {remove ? 'Confirm deletion' : 'Delete content'}
        </button>
        <button className="secondary" onClick={() => onCreate(value)}>
          Open in writing studio
        </button>
        <button className="primary" disabled={!value.title.trim()} onClick={() => onSave(value)}>
          Save content
        </button>
      </div>
    </Modal>
  );
}
