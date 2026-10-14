import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { Project } from '../model';
import { Modal } from '../ui';
import { Canvas } from '../Canvas';
import { renderPage } from '../render';
import { download, safeName, canvasBlob, exportPDF, exportVideo, videoMime } from '../exports';
import { densityWarnings } from './composition';
import { listProjects, listContent, saveContent } from '../storage';
export function StudioExportDialog({
  project: p,
  pageIndex,
  onClose,
  notice,
}: {
  project: Project;
  pageIndex: number;
  onClose: () => void;
  notice: (s: string) => void;
}) {
  const [format, setFormat] = useState('png'),
    [width, setWidth] = useState(p.width),
    [name, setName] = useState(
      `${p.content.day ? `day-${String(p.content.day).padStart(3, '0')}-` : ''}${safeName(p.name)}`,
    ),
    [background, setBackground] = useState('design'),
    [selected, setSelected] = useState(p.pages.map((_, i) => i)),
    [current, setCurrent] = useState(pageIndex),
    [bundle, setBundle] = useState(false),
    [variants, setVariants] = useState(false),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const single = ['png', 'jpeg'].includes(format),
    imageOutput = !['json', 'markdown', 'captions'].includes(format);
  const transformed = (project: Project, indices: number[]) => ({
    ...project,
    name,
    pages: indices.map((i) => ({
      ...project.pages[i],
      background:
        background === 'white'
          ? '#ffffff'
          : background === 'transparent'
            ? 'rgba(0,0,0,0)'
            : project.pages[i].background,
    })),
  });
  const output = transformed(p, single ? [current] : selected);
  const warnings = densityWarnings(p.pages[current], p.width, p.height);
  const run = async () => {
    setBusy(true);
    setProgress(0);
    try {
      if (format === 'json')
        download(
          new Blob([JSON.stringify(p)], { type: 'application/json' }),
          `${safeName(name)}.json`,
        );
      else if (format === 'markdown')
        download(new Blob([p.sourceText], { type: 'text/markdown' }), `${safeName(name)}.md`);
      else if (format === 'captions')
        download(
          new Blob(
            [
              Object.entries(p.content.captions)
                .map(([platform, text]) => `${platform.toUpperCase()}\n${text}`)
                .join('\n\n---\n\n'),
            ],
            { type: 'text/plain' },
          ),
          `${safeName(name)}-captions.txt`,
        );
      else if (single) {
        const canvas = await renderPage(output.pages[0], p.width, p.height, width);
        if (format === 'jpeg')
          download(
            await new Promise<Blob>((resolve, reject) =>
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('JPEG encoding failed.'))),
                'image/jpeg',
                0.95,
              ),
            ),
            `${safeName(name)}-slide-${String(current + 1).padStart(2, '0')}.jpg`,
          );
        else
          download(
            await canvasBlob(canvas),
            `${safeName(name)}-slide-${String(current + 1).padStart(2, '0')}.png`,
          );
      } else if (format === 'pdf') await exportPDF(output, width, setProgress);
      else if (format === 'webm') {
        abort.current = new AbortController();
        await exportVideo(output, width, setProgress, abort.current.signal);
      } else if (format === 'zip') {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        const related = variants
          ? (await listProjects()).filter(
              (other) =>
                other.id !== p.id &&
                (other.parentId === p.id ||
                  other.id === p.parentId ||
                  (other.parentId && other.parentId === p.parentId)),
            )
          : [];
        const projects = [output, ...related];
        let complete = 0;
        const total = projects.reduce((s, p) => s + p.pages.length, 0);
        for (let k = 0; k < projects.length; k++) {
          const project = projects[k],
            prefix = k === 0 ? '' : `${safeName(project.name)}/`;
          for (let i = 0; i < project.pages.length; i++) {
            const safeWidth = Math.min(width, Math.floor((4096 * project.width) / project.height));
            zip.file(
              `${prefix}${safeName(k === 0 ? name : project.name)}-slide-${String(k === 0 ? selected[i] + 1 : i + 1).padStart(2, '0')}.png`,
              await canvasBlob(
                await renderPage(project.pages[i], project.width, project.height, safeWidth),
              ),
            );
            setProgress(++complete / total);
          }
          if (bundle) {
            zip.file(`${prefix}source.md`, project.sourceText);
            zip.file(
              `${prefix}captions.txt`,
              Object.entries(project.content.captions)
                .map(([key, value]) => `${key}\n${value}`)
                .join('\n\n'),
            );
          }
        }
        download(await zip.generateAsync({ type: 'blob' }), `${safeName(name)}.zip`);
      }
      try {
        for (const item of await listContent()) {
          if (item.projectIds.includes(p.id))
            await saveContent({
              ...item,
              exports: [
                ...(item.exports || []).slice(-49),
                {
                  name:
                    safeName(name) +
                    '.' +
                    ({ markdown: 'md', captions: 'txt', jpeg: 'jpg' }[format] || format),
                  at: Date.now(),
                },
              ],
            });
        }
      } catch {
        /* The download has completed; storage errors must not report an export failure. */
      }
      notice('Export ready. Check your downloads.');
      onClose();
    } catch (e) {
      notice((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Your publishing pack"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <label className="field">
        File format
        <select
          disabled={busy}
          value={format}
          onChange={(e) => {
            setFormat(e.target.value);
            if (['jpeg', 'webm'].includes(e.target.value) && background === 'transparent')
              setBackground('white');
          }}
        >
          <option value="png">PNG · Single slide</option>
          <option value="jpeg">JPEG · Single slide</option>
          <option value="zip">ZIP · Selected slides</option>
          <option value="pdf">PDF · Selected slides</option>
          {videoMime() && <option value="webm">WebM · Selected scenes</option>}
          <option value="json">Editable project JSON</option>
          <option value="markdown">Markdown source</option>
          <option value="captions">Platform captions · Text</option>
        </select>
      </label>
      <label className="field">
        Filename
        <input
          value={name}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
          maxLength={140}
        />
      </label>
      {imageOutput && (
        <>
          <div className="field-row">
            <label className="field">
              Resolution preset
              <select
                disabled={busy}
                defaultValue="original"
                onChange={(e) =>
                  setWidth(e.target.value === 'original' ? p.width : Number(e.target.value))
                }
              >
                <option value="original">Native canvas</option>
                <option value="1080">Instagram / LinkedIn · 1080 wide</option>
                <option value="1600">X · 1600 wide</option>
                <option value="720">Video · 720 wide</option>
                <option value="360">Video · 360 wide</option>
              </select>
            </label>
            <label className="field">
              Output width (px)
              <input
                type="number"
                min={100}
                max={4096}
                value={width}
                disabled={busy}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="hint">
            {width} × {Math.round((width * p.height) / p.width)} px. The design’s aspect ratio is
            retained; use Repurpose for Platform to change composition.
          </p>
          <label className="field">
            Background
            <select
              value={background}
              disabled={busy}
              onChange={(e) => setBackground(e.target.value)}
            >
              <option value="design">Design background</option>
              <option value="white">White</option>
              {format !== 'jpeg' && format !== 'webm' && (
                <option value="transparent">Transparent</option>
              )}
            </select>
          </label>
          {single ? (
            <label className="field">
              Slide to export
              <select
                value={current}
                disabled={busy}
                onChange={(e) => setCurrent(Number(e.target.value))}
              >
                {p.pages.map((_, i) => (
                  <option value={i} key={i}>
                    Slide {i + 1}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="field">Selected slides</label>
              <div className="export-pages">
                {p.pages.map((_, i) => (
                  <button
                    disabled={busy}
                    key={i}
                    className={selected.includes(i) ? 'active' : ''}
                    onClick={() =>
                      setSelected((s) =>
                        s.includes(i) ? s.filter((n) => n !== i) : [...s, i].sort((a, b) => a - b),
                      )
                    }
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="export-mini-preview">
            <Canvas
              page={transformed(p, [current]).pages[0]}
              width={p.width}
              height={p.height}
              zoom={Math.min(180 / p.width, 170 / p.height)}
            />
          </div>
          {warnings.map((w) => (
            <p className="density-warning" key={w}>
              {w}
            </p>
          ))}
        </>
      )}
      {format === 'zip' && (
        <>
          <label className="checkbox-row">
            <input type="checkbox" checked={bundle} onChange={(e) => setBundle(e.target.checked)} />
            Bundle captions and Markdown
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={variants}
              onChange={(e) => setVariants(e.target.checked)}
            />
            Include saved platform variants
          </label>
        </>
      )}
      {format === 'webm' && (
        <p className="hint">
          Recording runs in real time. Keep this tab visible. Uploaded background audio is included.
        </p>
      )}
      {busy && (
        <div className="export-progress">
          <progress value={progress} max={1} />
          <span>{Math.round(progress * 100)}%</span>
        </div>
      )}
      <button
        className="primary full-width"
        disabled={
          busy ||
          !name.trim() ||
          (imageOutput &&
            (width < 100 ||
              width > 4096 ||
              (width * p.height) / p.width > 4096 ||
              (!single && !selected.length)))
        }
        onClick={() => void run()}
      >
        <Download size={17} />
        {busy ? 'Preparing…' : 'Download'}
      </button>
      {busy && format === 'webm' && (
        <button className="secondary full-width" onClick={() => abort.current?.abort()}>
          Cancel recording
        </button>
      )}
    </Modal>
  );
}
