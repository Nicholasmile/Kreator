import { element, blankPage, uid, applyBrand, type Page, type Project, type Brand } from '../model';
import { defaultCode, type BrandStyle } from './types';
import { paginateMarkdown } from './markdown';
export const layoutNames = [
  'Editorial',
  'Stacked lesson',
  'Code + explanation',
  'Comparison',
  'Notebook',
  'Focus',
];
export function styleBrand(brand: Brand, style: BrandStyle): Brand {
  if (style === 'Dark Editorial' || style === 'Code Studio')
    return { ...brand, primary: '#F5F7FB', secondary: '#101B34', accent: brand.accent, style };
  if (style === 'Academic Minimal')
    return { ...brand, primary: '#20283C', secondary: '#ffffff', headingFont: 'Georgia', style };
  if (style === 'Professional LinkedIn')
    return { ...brand, primary: '#101B34', secondary: '#ffffff', style };
  return { ...brand, style };
}
export function layoutPage(page: Page, width: number, height: number, layout: string): Page {
  const margin = width * 0.075,
    top = height * 0.09,
    footer = height * 0.91,
    unit = Math.min(width, height);
  const content = page.elements.filter(
    (e) =>
      !['watermark', 'pageNumber', 'accent'].includes(e.role || '') &&
      e.kind !== 'rect' &&
      e.kind !== 'ellipse',
  );
  const heading = content.find((e) => e.role === 'heading');
  const body = content.filter((e) => e !== heading);
  let cursor = top;
  const elements = page.elements.map((e) => ({ ...e }));
  const set = (id: string, patch: Partial<(typeof elements)[number]>) =>
    Object.assign(
      elements.find((e) => e.id === id)!,
      patch,
    );
  if (heading) {
    set(heading.id, {
      x: margin,
      y: top,
      width: width - 2 * margin,
      height: height * 0.18,
      fontSize: unit * 0.062,
    });
    cursor = height * 0.3;
  }
  const available = footer - cursor - height * 0.035;
  const split =
    (layout === 'Code + explanation' || layout === 'Comparison') &&
    width / height > 0.72 &&
    body.length >= 2;
  const weights = body.map((e) =>
    e.kind === 'code'
      ? Math.max(5, (e.text || '').split('\n').length * 1.25)
      : e.kind === 'chart' || e.kind === 'math'
        ? 7
        : Math.max(3, Math.ceil((e.text || '').length / 90)),
  );
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  body.forEach((e, i) => {
    if (split) {
      const column = i % 2,
        row = Math.floor(i / 2),
        rows = Math.ceil(body.length / 2);
      set(e.id, {
        x: margin + column * (width * 0.445),
        y: cursor + row * (available / rows),
        width: width * 0.405,
        height: available / rows - height * 0.025,
        fontSize: unit * 0.028,
      });
    } else {
      const h = (available * weights[i]) / total;
      set(e.id, {
        x: layout === 'Notebook' ? margin + width * 0.025 : margin,
        y: cursor,
        width: width - 2 * margin - (layout === 'Notebook' ? width * 0.025 : 0),
        height: Math.max(30, h - height * 0.022),
        fontSize:
          e.kind === 'code'
            ? unit * 0.03
            : e.kind === 'rich' && (e.text || '').trim().startsWith('$$')
              ? unit * 0.05
              : unit * 0.032,
      });
      cursor += h;
    }
  });
  for (const e of elements) {
    if (e.role === 'watermark') {
      e.x = margin;
      e.y = height * 0.935;
      e.width = e.kind === 'image' ? width * 0.06 : width * 0.72;
      e.height = height * 0.035;
      e.fontSize = unit * 0.018;
      if (e.kind === 'image') e.x = width * 0.85;
    }
    if (e.role === 'pageNumber') {
      e.x = width * 0.84;
      e.y = height * 0.935;
      e.width = width * 0.09;
      e.height = height * 0.035;
      e.fontSize = unit * 0.018;
    }
  }
  return { ...page, elements, layout };
}
export function markdownPages(
  source: string,
  width: number,
  height: number,
  count: number,
  brand: Brand,
  layout = 'Editorial',
) {
  const parsed = paginateMarkdown(source, count);
  const pages = parsed.slides.map((slide, i) => {
    const page = blankPage();
    page.background = brand.secondary;
    page.title = slide.title;
    page.notes = slide.notes;
    page.layout = layout;
    let firstHeading = true;
    page.elements = slide.blocks.map((block) => {
      if (block.type === 'heading' && firstHeading) {
        firstHeading = false;
        return element('text', {
          text: block.value,
          fontFamily: brand.headingFont,
          fill: brand.primary,
          role: 'heading',
        });
      }
      if (block.type === 'code')
        return element('code', {
          text: block.value,
          code: {
            ...defaultCode(),
            language: block.language || 'plaintext',
            filename: block.language === 'python' ? 'analysis.py' : block.language || 'Code',
          },
          fill: brand.primary,
          role: 'body',
        });
      return element('rich', {
        text: block.source,
        fontFamily: brand.bodyFont,
        fill: brand.primary,
        role: 'body',
      });
    });
    if (firstHeading)
      page.elements.unshift(
        element('text', {
          text: slide.title,
          role: 'heading',
          fill: brand.primary,
          fontFamily: brand.headingFont,
        }),
      );
    page.elements.push(
      element('text', {
        text: `${i + 1} / ${parsed.slides.length}`,
        role: 'pageNumber',
        fill: brand.primary,
      }),
    );
    return layoutPage(page, width, height, layout);
  });
  return {
    pages: applyBrand({ pages, width, height } as Project, brand).pages,
    warnings: parsed.warnings,
    explicit: parsed.explicit,
  };
}
export const platformFormats = [
  { platform: 'Instagram', name: 'Portrait feed', width: 1080, height: 1350 },
  { platform: 'Instagram', name: 'Square post', width: 1080, height: 1080 },
  { platform: 'Instagram', name: 'Story / Reel', width: 1080, height: 1920 },
  { platform: 'LinkedIn', name: 'Professional portrait', width: 1080, height: 1350 },
  { platform: 'LinkedIn', name: 'Profile banner', width: 1584, height: 396 },
  { platform: 'LinkedIn', name: 'Document carousel', width: 1080, height: 1350 },
  { platform: 'Facebook', name: 'Portrait graphic', width: 1080, height: 1350 },
  { platform: 'Facebook', name: 'Square graphic', width: 1080, height: 1080 },
  { platform: 'Facebook', name: 'Story / Reel', width: 1080, height: 1920 },
  { platform: 'X', name: 'Landscape graphic', width: 1600, height: 900 },
  { platform: 'X', name: 'Square graphic', width: 1080, height: 1080 },
  { platform: 'WhatsApp', name: 'Status', width: 1080, height: 1920 },
] as const;
export function repurpose(project: Project, format: (typeof platformFormats)[number]): Project {
  const clone = structuredClone(project);
  clone.id = uid();
  clone.parentId = project.id;
  clone.name = `${project.name} · ${format.platform} ${format.name}`;
  clone.width = format.width;
  clone.height = format.height;
  clone.content.platform = format.platform;
  clone.thumbnail = undefined;
  clone.updatedAt = Date.now();
  clone.pages = clone.pages.map((page) => {
    page.id = uid();
    page.elements.forEach((e) => {
      e.id = uid();
      e.groupId = undefined;
    });
    const useful = page.elements.filter((e) => e.kind !== 'rect' && e.kind !== 'ellipse');
    return layoutPage(
      { ...page, elements: useful },
      format.width,
      format.height,
      format.width / format.height > 1.4 ? 'Code + explanation' : page.layout || 'Editorial',
    );
  });
  return clone;
}
export function densityWarnings(page: Page, width: number, height: number) {
  const warnings: string[] = [];
  for (const e of page.elements) {
    if (e.x < 0 || e.y < 0 || e.x + e.width > width + 1 || e.y + e.height > height + 1)
      warnings.push('An element extends beyond the canvas.');
    if (
      (e.kind === 'rich' || e.kind === 'code' || e.kind === 'text') &&
      (e.text || '').length > (e.width * e.height) / 180
    )
      warnings.push('Dense text: consider splitting this slide.');
    if (e.rotation) warnings.push('Check rotated elements near page edges in Preview.');
  }
  return [...new Set(warnings)];
}
