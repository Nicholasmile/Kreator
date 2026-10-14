import Konva from 'konva';
import type { DesignElement, Page, Project } from './model';
const imageCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      imageCache.delete(src);
      reject(new Error('An image could not be loaded. Try uploading it again.'));
    };
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}
export function fitTextNode(e: DesignElement): Konva.Text {
  const node = new Konva.Text({
    text: e.text || '',
    width: e.width,
    fontFamily: e.fontFamily || 'Arial',
    fontSize: e.fontSize || 48,
    fontStyle: e.fontStyle || 'normal',
    lineHeight: 1.2,
    letterSpacing: e.letterSpacing || 0,
    wrap: 'word',
    align: e.align || 'left',
    fill: e.fill,
    padding: 0,
  });
  // Measure actual browser font metrics; keep shrinking rather than clipping content.
  while (node.height() > e.height && node.fontSize() > 2)
    node.fontSize(Math.max(2, node.fontSize() * 0.94));
  node.height(e.height);
  return node;
}
export async function createNode(e: DesignElement): Promise<Konva.Shape> {
  let node: Konva.Shape;
  if (e.kind === 'rich' || e.kind === 'code') {
    const { richImage } = await import('./studio/rich');
    const image = await loadImage(await richImage(e));
    node = new Konva.Image({ image, width: e.width, height: e.height });
  } else if (e.kind === 'chart' && e.chart) {
    const { chartSVG } = await import('./studio/charts');
    const image = await loadImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(chartSVG(e.chart, e.width, e.height))}`,
    );
    node = new Konva.Image({ image, width: e.width, height: e.height });
  } else if (e.kind === 'text') node = fitTextNode(e);
  else if (e.kind === 'ellipse')
    node = new Konva.Ellipse({
      radiusX: e.width / 2,
      radiusY: e.height / 2,
      fill: e.fill,
      offsetX: -e.width / 2,
      offsetY: -e.height / 2,
    });
  else if (e.kind === 'image' || e.kind === 'math') {
    if (!e.src) node = new Konva.Rect({ width: e.width, height: e.height, fill: '#ddd' });
    else {
      const image = await loadImage(e.src);
      if (e.mask === 'circle') {
        const masked = document.createElement('canvas');
        masked.width = Math.min(2400, Math.round(e.width * 2));
        masked.height = Math.min(2400, Math.round(e.height * 2));
        const ctx = masked.getContext('2d')!;
        ctx.beginPath();
        ctx.ellipse(
          masked.width / 2,
          masked.height / 2,
          masked.width / 2,
          masked.height / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.clip();
        const c = e.crop || { x: 0, y: 0, width: 1, height: 1 };
        ctx.drawImage(
          image,
          c.x * image.width,
          c.y * image.height,
          c.width * image.width,
          c.height * image.height,
          0,
          0,
          masked.width,
          masked.height,
        );
        node = new Konva.Image({ image: masked, width: e.width, height: e.height });
      } else
        node = new Konva.Image({
          image,
          width: e.width,
          height: e.height,
          ...(e.crop
            ? {
                crop: {
                  x: e.crop.x * image.width,
                  y: e.crop.y * image.height,
                  width: e.crop.width * image.width,
                  height: e.crop.height * image.height,
                },
              }
            : {}),
        });
    }
  } else
    node = new Konva.Rect({
      width: e.width,
      height: e.height,
      fill: e.fill,
      cornerRadius: e.radius || 0,
    });
  node.setAttrs({
    id: e.id,
    x: e.x,
    y: e.y,
    rotation: e.rotation,
    opacity: e.opacity,
    name: 'design-element',
  });
  return node;
}
export async function populateLayer(layer: Konva.Layer, page: Page, width: number, height: number) {
  const nodes = await Promise.all(
    page.elements
      .filter((e) => page.brandVisible !== false || e.role !== 'watermark')
      .map(createNode),
  );
  layer.add(new Konva.Rect({ width, height, fill: page.background, name: 'page-background' }));
  nodes.forEach((node) => layer.add(node));
}
export async function renderPage(
  page: Page,
  width: number,
  height: number,
  outputWidth = width,
): Promise<HTMLCanvasElement> {
  const host = document.createElement('div');
  const stage = new Konva.Stage({ container: host, width, height });
  const layer = new Konva.Layer();
  stage.add(layer);
  try {
    await document.fonts.ready;
    await populateLayer(layer, page, width, height);
    layer.draw();
    return stage.toCanvas({ pixelRatio: outputWidth / width });
  } finally {
    stage.destroy();
  }
}
export async function thumbnail(project: Project) {
  const canvas = await renderPage(project.pages[0], project.width, project.height, 360);
  return canvas.toDataURL('image/png');
}
export async function mathImage(
  expression: string,
  color: string,
): Promise<{ src: string; width: number; height: number }> {
  const [{ default: katex }, { toPng }] = await Promise.all([
    import('katex'),
    import('html-to-image'),
  ]);
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:0;top:0;z-index:-1000;pointer-events:none;display:inline-block;width:max-content;padding:16px;font-size:64px;color:${color};background:transparent;`;
  host.innerHTML = katex.renderToString(expression, {
    throwOnError: true,
    displayMode: true,
    output: 'html',
    trust: false,
  });
  document.body.appendChild(host);
  try {
    await document.fonts.ready;
    const width = host.offsetWidth,
      height = host.offsetHeight;
    const src = await toPng(host, { pixelRatio: 2, cacheBust: false });
    return { src, width, height };
  } finally {
    host.remove();
  }
}
export async function readImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Choose a PNG, JPG, or WebP image.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Please choose an image smaller than 15 MB.');
  const data = await readFile(file);
  const img = await loadImage(data);
  const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
export const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read this file.'));
    reader.readAsDataURL(file);
  });
