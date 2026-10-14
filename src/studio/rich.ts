import type { DesignElement } from '../model';
import { defaultCode } from './types';
import { codeHTML, markdownHTML } from './markdown';
const cache = new Map<string, Promise<string>>();
export async function richImage(e: DesignElement): Promise<string> {
  const key = JSON.stringify([
    e.kind,
    e.text,
    e.code,
    e.fontSize,
    e.fontFamily,
    e.fill,
    e.width,
    e.height,
  ]);
  const cached = cache.get(key);
  if (cached) return cached;
  const task = (async () => {
    const { toPng } = await import('html-to-image');
    const host = document.createElement('div');
    host.className = 'technical-content raster-content';
    host.style.cssText =
      'position:fixed;left:0;top:0;z-index:-1000;pointer-events:none;background:transparent;';
    host.style.width = `${Math.max(100, e.width)}px`;
    host.style.fontSize = `${e.fontSize || 32}px`;
    host.style.fontFamily = e.fontFamily || (e.kind === 'code' ? 'Consolas, monospace' : 'Arial');
    host.style.color = e.fill;
    host.innerHTML =
      e.kind === 'code'
        ? codeHTML(e.text || '', e.code || defaultCode())
        : markdownHTML(e.text || '');
    document.body.appendChild(host);
    try {
      await document.fonts.ready;
      await Promise.all(
        [...host.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)),
      );
      let size = e.fontSize || 32;
      while ((host.scrollHeight > e.height || host.scrollWidth > e.width) && size > 8) {
        size *= 0.94;
        host.style.fontSize = `${size}px`;
      }
      const naturalHeight = host.scrollHeight;
      host.style.height = `${Math.max(e.height, naturalHeight)}px`;
      return await toPng(host, { pixelRatio: 2, cacheBust: false });
    } finally {
      host.remove();
    }
  })();
  if (cache.size > 100) cache.delete(cache.keys().next().value!);
  cache.set(key, task);
  try {
    return await task;
  } catch (error) {
    cache.delete(key);
    throw error;
  }
}
