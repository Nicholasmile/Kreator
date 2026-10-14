import {
  emptyContent,
  normalizeContent,
  type ContentDetails,
  type CodeStyle,
  type ChartConfig,
  type BrandStyle,
} from './studio/types';
export type ElementKind =
  'text' | 'rect' | 'ellipse' | 'image' | 'math' | 'rich' | 'code' | 'chart';
export type Role =
  'heading' | 'body' | 'accent' | 'primary' | 'secondary' | 'watermark' | 'pageNumber';
export interface DesignElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  radius?: number;
  src?: string;
  role?: Role;
  locked?: boolean;
  groupId?: string;
  code?: CodeStyle;
  chart?: ChartConfig;
  crop?: { x: number; y: number; width: number; height: number };
  mask?: 'none' | 'circle';
}
export interface Page {
  id: string;
  background: string;
  elements: DesignElement[];
  duration: number;
  transition: 'fade' | 'slide' | 'none';
  notes?: string;
  title?: string;
  layout?: string;
  brandVisible?: boolean;
  subtitle?: string;
}
export interface Project {
  version: 1 | 2;
  id: string;
  name: string;
  width: number;
  height: number;
  pages: Page[];
  updatedAt: number;
  thumbnail?: string;
  sourceText: string;
  audio?: string;
  volume: number;
  content: ContentDetails;
  brandId?: string;
  parentId?: string;
  lastGeneratedSource?: string;
}
export interface Brand {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  watermark: string;
  handle: string;
  logo?: string;
  profilePhoto?: string;
  positioning?: string;
  signature?: string;
  tone?: string;
  defaultCaption?: string;
  footerPlacement?: 'left' | 'center' | 'right';
  style?: BrandStyle;
}
export const uid = () => crypto.randomUUID();
export const fonts = ['Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Courier New'];
export const formats = [
  { name: 'Instagram Post', width: 1080, height: 1080, icon: 'square' },
  { name: 'Instagram Portrait', width: 1080, height: 1350, icon: 'portrait' },
  { name: 'Story / Reel', width: 1080, height: 1920, icon: 'reel' },
  { name: 'LinkedIn Post', width: 1200, height: 1200, icon: 'linkedin' },
  { name: 'Facebook Post', width: 1200, height: 630, icon: 'landscape' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: 'video' },
];
export const presets: Brand[] = [
  {
    id: 'malik-kolade',
    name: 'Malik Kolade',
    primary: '#101B34',
    secondary: '#F5F7FB',
    accent: '#3469EF',
    headingFont: 'Arial',
    bodyFont: 'Arial',
    watermark: 'Malik Kolade',
    handle: '',
    positioning: 'Economics Graduate | Data Science | Research | Analytics',
    signature: 'Learn. Question. Explain.',
    tone: 'Curious, analytical, approachable, professional',
    defaultCaption: '',
    style: 'Clean Light',
    footerPlacement: 'left',
  },
  {
    id: 'karlmaths',
    name: 'Karlmaths',
    primary: '#262248',
    secondary: '#f3efff',
    accent: '#9470f0',
    headingFont: 'Georgia',
    bodyFont: 'Arial',
    watermark: 'MATHEMATICS, MADE CLEAR.',
    handle: '@karlmaths',
  },
  {
    id: 'guide',
    name: 'GUIDE',
    primary: '#163d35',
    secondary: '#eef4e7',
    accent: '#a3c36e',
    headingFont: 'Georgia',
    bodyFont: 'Arial',
    watermark: 'RESEARCH WITH PURPOSE.',
    handle: '@guide.research',
  },
  {
    id: 'personal',
    name: 'Personal Brand',
    primary: '#193853',
    secondary: '#ecf3f8',
    accent: '#ffb366',
    headingFont: 'Arial',
    bodyFont: 'Arial',
    watermark: 'MAKE SENSE OF DATA.',
    handle: '@yourname',
  },
];
export function element(kind: ElementKind, attrs: Partial<DesignElement> = {}): DesignElement {
  return {
    id: uid(),
    kind,
    x: 100,
    y: 100,
    width: 400,
    height: 150,
    fill: '#28213e',
    rotation: 0,
    opacity: 1,
    ...attrs,
  };
}
export const blankPage = (): Page => ({
  id: uid(),
  background: '#faf7f2',
  elements: [],
  duration: 4,
  transition: 'fade',
});
export function newProject(
  name: string,
  width = 1080,
  height = 1080,
  pages = [blankPage()],
): Project {
  return {
    version: 2,
    id: uid(),
    name,
    width,
    height,
    pages,
    updatedAt: Date.now(),
    sourceText: '',
    volume: 0.5,
    content: emptyContent(),
  };
}
export function applyBrand(project: Project, brand: Brand): Project {
  if (brand.style === 'Dark Editorial' || brand.style === 'Code Studio')
    brand = { ...brand, primary: '#F5F7FB', secondary: '#101B34' };
  return {
    ...project,
    brandId: brand.id,
    pages: project.pages.map((page) => ({
      ...page,
      background: brand.secondary,
      elements: [
        ...page.elements
          .filter((e) => e.role !== 'watermark')
          .map((e) => ({
            ...e,
            fill:
              e.role === 'accent'
                ? brand.accent
                : e.role === 'secondary'
                  ? brand.secondary
                  : e.role
                    ? brand.primary
                    : e.fill,
            fontFamily:
              e.role === 'heading'
                ? brand.headingFont
                : e.kind === 'text'
                  ? brand.bodyFont
                  : e.fontFamily,
            chart: e.chart
              ? { ...e.chart, color: brand.accent, highlightColor: brand.primary }
              : undefined,
          })),
        ...(page.brandVisible === false
          ? []
          : [
              element('text', {
                x: project.width * 0.07,
                y: project.height * 0.92,
                width: project.width * 0.72,
                height: project.height * 0.045,
                text: [brand.watermark, brand.handle || brand.signature]
                  .filter(Boolean)
                  .join('  ·  '),
                fontSize: project.width * 0.017,
                fill: brand.primary,
                role: 'watermark',
                align: brand.footerPlacement || 'left',
              }),
            ]),
        ...((brand.logo || brand.profilePhoto) && page.brandVisible !== false
          ? [
              element('image', {
                x: project.width * 0.84,
                y: project.height * 0.88,
                width: project.width * 0.09,
                height: project.height * 0.07,
                src: brand.logo || brand.profilePhoto,
                role: 'watermark',
              }),
            ]
          : []),
      ],
    })),
  };
}
export function resizeProject(project: Project, width: number, height: number): Project {
  const sx = width / project.width,
    sy = height / project.height;
  return {
    ...project,
    width,
    height,
    pages: project.pages.map((page) => ({
      ...page,
      elements: page.elements.map((e) => ({
        ...e,
        x: e.x * sx,
        y: e.y * sy,
        width: e.width * sx,
        height: e.height * sy,
        fontSize: e.fontSize ? e.fontSize * Math.min(sx, sy) : undefined,
      })),
    })),
  };
}
export function parseProject(raw: string, freshIds = true): Project {
  const p = JSON.parse(raw) as Project;
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  if (
    ![1, 2].includes(p.version) ||
    typeof p.name !== 'string' ||
    !finite(p.width) ||
    !finite(p.height) ||
    p.width < 100 ||
    p.height < 100 ||
    p.width > 4096 ||
    p.height > 4096 ||
    !Array.isArray(p.pages) ||
    !p.pages.length ||
    p.pages.length > 100
  )
    throw new Error('This is not a supported Kreator project.');
  for (const page of p.pages) {
    if (
      typeof page.background !== 'string' ||
      !Array.isArray(page.elements) ||
      page.elements.length > 500 ||
      !finite(page.duration) ||
      page.duration < 1 ||
      page.duration > 30 ||
      !['fade', 'slide', 'none'].includes(page.transition)
    )
      throw new Error('Invalid slide data.');
    if (freshIds) page.id = uid();
    for (const e of page.elements) {
      if (
        !['text', 'rect', 'ellipse', 'image', 'math', 'rich', 'code', 'chart'].includes(e.kind) ||
        ![e.x, e.y, e.width, e.height, e.rotation, e.opacity].every(finite) ||
        e.width <= 0 ||
        e.height <= 0 ||
        typeof e.fill !== 'string' ||
        (e.text !== undefined && typeof e.text !== 'string') ||
        (e.src && !/^data:image\/(png|jpeg|webp);base64,/.test(e.src))
      )
        throw new Error('Invalid element data or unsupported image.');
      if (
        e.code &&
        (typeof e.code.language !== 'string' ||
          typeof e.code.highlights !== 'string' ||
          typeof e.code.filename !== 'string' ||
          ![e.code.lineNumbers, e.code.wrap, e.code.transparent].every(
            (v) => typeof v === 'boolean',
          ) ||
          !['dark', 'light'].includes(e.code.theme) ||
          !Number.isFinite(e.code.padding) ||
          e.code.padding < 0 ||
          e.code.padding > 100)
      )
        throw new Error('Invalid code styling.');
      if (
        e.chart &&
        (!['bar', 'line', 'scatter', 'histogram', 'pie', 'kpi'].includes(e.chart.type) ||
          ![
            e.chart.title,
            e.chart.xLabel,
            e.chart.yLabel,
            e.chart.color,
            e.chart.highlightColor,
            e.chart.highlight,
            e.chart.annotation,
          ].every((v) => typeof v === 'string') ||
          !Number.isFinite(e.chart.bins) ||
          typeof e.chart.legend !== 'boolean' ||
          !Array.isArray(e.chart.data) ||
          e.chart.data.length > 10000 ||
          e.chart.data.some(
            (d) => !Number.isFinite(d.x) || !Number.isFinite(d.y) || typeof d.label !== 'string',
          ))
      )
        throw new Error('Invalid chart data.');
      if (
        e.crop &&
        (!Object.values(e.crop).every(finite) ||
          e.crop.x < 0 ||
          e.crop.y < 0 ||
          e.crop.width <= 0 ||
          e.crop.height <= 0 ||
          e.crop.x + e.crop.width > 1.000001 ||
          e.crop.y + e.crop.height > 1.000001)
      )
        throw new Error('Invalid image crop.');
      if (freshIds) e.id = uid();
    }
  }
  if (p.audio && !/^data:audio\/[\w.+-]+;base64,/.test(p.audio))
    throw new Error('Invalid audio data.');
  return upgradeProject({
    ...p,
    id: freshIds ? uid() : p.id,
    sourceText: typeof p.sourceText === 'string' ? p.sourceText : '',
    volume: finite(p.volume) ? Math.max(0, Math.min(1, p.volume)) : 0.5,
    updatedAt: Date.now(),
  });
}
export function upgradeProject(p: Project): Project {
  return { ...p, version: 2, content: normalizeContent(p.content) };
}
