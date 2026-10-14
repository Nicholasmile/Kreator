import type { Project } from './model';
import { renderPage } from './render';
export function download(data: Blob | string, name: string) {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof data !== 'string') setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export const safeName = (name: string) =>
  name.replace(/[^a-z0-9 _-]/gi, '').trim() || 'kreator-design';
export const canvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image export failed.'))), 'image/png'),
  );
export async function exportPNG(p: Project, index: number, width: number) {
  const canvas = await renderPage(p.pages[index], p.width, p.height, width);
  download(await canvasBlob(canvas), `${safeName(p.name)}-${index + 1}.png`);
}
export async function exportZip(p: Project, width: number, onProgress: (n: number) => void) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (let i = 0; i < p.pages.length; i++) {
    zip.file(
      `${String(i + 1).padStart(2, '0')}.png`,
      await canvasBlob(await renderPage(p.pages[i], p.width, p.height, width)),
    );
    onProgress((i + 1) / p.pages.length);
  }
  download(await zip.generateAsync({ type: 'blob' }), `${safeName(p.name)}.zip`);
}
export async function exportPDF(p: Project, width: number, onProgress: (n: number) => void) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: p.width > p.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [p.width, p.height],
    hotfixes: ['px_scaling'],
  });
  for (let i = 0; i < p.pages.length; i++) {
    if (i) pdf.addPage([p.width, p.height], p.width > p.height ? 'landscape' : 'portrait');
    const canvas = await renderPage(p.pages[i], p.width, p.height, width);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, p.width, p.height);
    onProgress((i + 1) / p.pages.length);
  }
  download(pdf.output('blob'), `${safeName(p.name)}.pdf`);
}
export function videoMime() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return '';
  return (
    ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) =>
      MediaRecorder.isTypeSupported(type),
    ) || ''
  );
}
export interface VideoFrame {
  base: HTMLCanvasElement;
  text: HTMLCanvasElement;
}
export async function prepareVideo(p: Project, width: number): Promise<VideoFrame[]> {
  const frames: VideoFrame[] = [];
  for (const page of p.pages) {
    const base = await renderPage(
      {
        ...page,
        elements: page.elements.filter(
          (e) => !['text', 'math', 'rich', 'code', 'chart'].includes(e.kind),
        ),
      },
      p.width,
      p.height,
      width,
    );
    const text = await renderPage(
      {
        ...page,
        background: 'rgba(0,0,0,0)',
        elements: page.elements.filter((e) =>
          ['text', 'math', 'rich', 'code', 'chart'].includes(e.kind),
        ),
      },
      p.width,
      p.height,
      width,
    );
    frames.push({ base, text });
  }
  return frames;
}
export const durationOf = (p: Project) => p.pages.reduce((sum, page) => sum + page.duration, 0);
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  p: Project,
  frames: VideoFrame[],
  time: number,
) {
  let index = 0,
    local = time;
  while (index < p.pages.length - 1 && local >= p.pages[index].duration) {
    local -= p.pages[index].duration;
    index++;
  }
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  const paint = (i: number, elapsed: number, alpha = 1, offset = 0) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(offset, 0);
    ctx.drawImage(frames[i].base, 0, 0, w, h);
    const entrance = Math.min(1, Math.max(0, elapsed / 0.5));
    ctx.globalAlpha *= entrance;
    ctx.drawImage(frames[i].text, 0, (1 - entrance) * h * 0.035, w, h);
    if (p.pages[i].subtitle) {
      ctx.globalAlpha = alpha;
      const size = h * 0.026;
      ctx.font = `600 ${size}px Arial`;
      const lines: string[] = [];
      let line = '';
      for (const word of p.pages[i].subtitle!.split(/\s+/)) {
        if (ctx.measureText(line + ' ' + word).width > w * 0.78 && line) {
          lines.push(line);
          line = word;
        } else line += (line ? ' ' : '') + word;
      }
      if (line) lines.push(line);
      const y = h * 0.86 - lines.length * size * 0.65;
      ctx.fillStyle = 'rgba(16,27,52,.9)';
      ctx.fillRect(w * 0.08, y - size, w * 0.84, lines.length * size * 1.35 + size * 0.9);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      lines.forEach((line, j) => ctx.fillText(line, w / 2, y + j * size * 1.35, w * 0.78));
    }
    ctx.restore();
  };
  const transition = p.pages[index].transition,
    progress = Math.min(1, local / 0.45);
  if (index > 0 && progress < 1 && transition !== 'none') {
    paint(index - 1, 1);
    paint(
      index,
      local,
      transition === 'fade' ? progress : 1,
      transition === 'slide' ? w * (1 - progress) : 0,
    );
  } else paint(index, local);
}
export async function exportVideo(
  p: Project,
  width: number,
  onProgress: (n: number) => void,
  signal: AbortSignal,
) {
  const mime = videoMime();
  if (!mime) throw new Error('This browser cannot record WebM. Try Chrome or Edge on Windows.');
  const frames = await prepareVideo(p, width);
  if (signal.aborted) throw new Error('Export cancelled.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round((width * p.height) / p.width);
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(30);
  let audioContext: AudioContext | undefined, source: AudioBufferSourceNode | undefined;
  let raf = 0;
  try {
    if (p.audio) {
      audioContext = new AudioContext();
      await audioContext.resume();
      const buffer = await audioContext.decodeAudioData(await (await fetch(p.audio)).arrayBuffer());
      source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = audioContext.createGain();
      gain.gain.value = p.volume;
      const dest = audioContext.createMediaStreamDestination();
      source.connect(gain);
      gain.connect(dest);
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    const result = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onerror = () =>
        reject(new Error('The browser could not finish recording. Try a smaller output size.'));
      recorder.onstop = () =>
        signal.aborted
          ? reject(new Error('Export cancelled.'))
          : resolve(new Blob(chunks, { type: 'video/webm' }));
    });
    const cancel = () => {
      if (recorder.state !== 'inactive') recorder.stop();
    };
    signal.addEventListener('abort', cancel, { once: true });
    drawVideoFrame(ctx, p, frames, 0);
    recorder.start(200);
    source?.start();
    const start = performance.now(),
      duration = durationOf(p);
    const tick = () => {
      if (signal.aborted) return;
      const elapsed = (performance.now() - start) / 1000;
      drawVideoFrame(ctx, p, frames, Math.min(elapsed, duration - 0.001));
      onProgress(Math.min(1, elapsed / duration));
      if (elapsed < duration) raf = requestAnimationFrame(tick);
      else recorder.stop();
    };
    raf = requestAnimationFrame(tick);
    try {
      const blob = await result;
      if (!blob.size) throw new Error('The browser returned an empty video.');
      download(blob, `${safeName(p.name)}.webm`);
    } finally {
      signal.removeEventListener('abort', cancel);
    }
  } finally {
    cancelAnimationFrame(raf);
    try {
      source?.stop();
    } catch {
      /* The audio may not have started if decoding failed. */
    }
    stream.getTracks().forEach((t) => t.stop());
    await audioContext?.close();
  }
}
