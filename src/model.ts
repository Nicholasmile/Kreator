export type ElementKind = 'text' | 'rect' | 'ellipse' | 'image' | 'math';
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
}
export interface Page {
  id: string;
  background: string;
  elements: DesignElement[];
  duration: number;
  transition: 'fade' | 'slide' | 'none';
}
export interface Project {
  version: 1;
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
    version: 1,
    id: uid(),
    name,
    width,
    height,
    pages,
    updatedAt: Date.now(),
    sourceText: '',
    volume: 0.5,
  };
}
export function applyBrand(project: Project, brand: Brand): Project {
  return {
    ...project,
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
          })),
        element('text', {
          x: project.width * 0.07,
          y: project.height * 0.92,
          width: project.width * 0.72,
          height: project.height * 0.045,
          text: [brand.watermark, brand.handle].filter(Boolean).join('  ·  '),
          fontSize: project.width * 0.017,
          fill: brand.primary,
          role: 'watermark',
        }),
        ...(brand.logo
          ? [
              element('image', {
                x: project.width * 0.84,
                y: project.height * 0.88,
                width: project.width * 0.09,
                height: project.height * 0.07,
                src: brand.logo,
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
export function parseProject(raw: string): Project {
  const p = JSON.parse(raw) as Project;
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  if (
    p.version !== 1 ||
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
    page.id = uid();
    for (const e of page.elements) {
      if (
        !['text', 'rect', 'ellipse', 'image', 'math'].includes(e.kind) ||
        ![e.x, e.y, e.width, e.height, e.rotation, e.opacity].every(finite) ||
        e.width <= 0 ||
        e.height <= 0 ||
        typeof e.fill !== 'string' ||
        (e.text !== undefined && typeof e.text !== 'string') ||
        (e.src && !/^data:image\/(png|jpeg|webp);base64,/.test(e.src))
      )
        throw new Error('Invalid element data or unsupported image.');
      e.id = uid();
    }
  }
  if (p.audio && !/^data:audio\/[\w.+-]+;base64,/.test(p.audio))
    throw new Error('Invalid audio data.');
  return {
    ...p,
    id: uid(),
    sourceText: typeof p.sourceText === 'string' ? p.sourceText : '',
    volume: finite(p.volume) ? Math.max(0, Math.min(1, p.volume)) : 0.5,
    updatedAt: Date.now(),
  };
}
