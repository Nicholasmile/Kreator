export const platforms = ['Instagram', 'LinkedIn', 'Facebook', 'X', 'WhatsApp'] as const;
export type Platform = (typeof platforms)[number];
export const statuses = ['Idea', 'Draft', 'Designing', 'Ready', 'Published'] as const;
export type Status = (typeof statuses)[number];
export interface ContentDetails {
  topic: string;
  hook: string;
  takeaway: string;
  cta: string;
  hashtags: string;
  references: string;
  narration: string;
  notes: string;
  campaign: string;
  day?: number;
  scheduledDate: string;
  status: Status;
  captions: Record<Platform, string>;
  summary: string;
  platform: Platform;
}
export const emptyContent = (): ContentDetails => ({
  topic: '',
  hook: '',
  takeaway: '',
  cta: '',
  hashtags: '',
  references: '',
  narration: '',
  notes: '',
  campaign: '',
  scheduledDate: '',
  status: 'Draft',
  summary: '',
  platform: 'Instagram',
  captions: { Instagram: '', LinkedIn: '', Facebook: '', X: '', WhatsApp: '' },
});
export function normalizeContent(value: unknown): ContentDetails {
  const result = emptyContent();
  if (!value || typeof value !== 'object') return result;
  const raw = value as Record<string, unknown>;
  for (const key of [
    'topic',
    'hook',
    'takeaway',
    'cta',
    'hashtags',
    'references',
    'narration',
    'notes',
    'campaign',
    'scheduledDate',
    'summary',
  ] as const)
    if (typeof raw[key] === 'string') result[key] = raw[key];
  if (statuses.includes(raw.status as Status)) result.status = raw.status as Status;
  if (platforms.includes(raw.platform as Platform)) result.platform = raw.platform as Platform;
  if (typeof raw.day === 'number' && Number.isInteger(raw.day) && raw.day > 0) result.day = raw.day;
  if (raw.captions && typeof raw.captions === 'object') {
    for (const platform of platforms) {
      const caption = (raw.captions as Record<string, unknown>)[platform];
      if (typeof caption === 'string') result.captions[platform] = caption;
    }
  }
  return result;
}
export interface CodeStyle {
  language: string;
  theme: 'dark' | 'light';
  lineNumbers: boolean;
  highlights: string;
  wrap: boolean;
  padding: number;
  filename: string;
  transparent: boolean;
}
export const defaultCode = (): CodeStyle => ({
  language: 'python',
  theme: 'dark',
  lineNumbers: true,
  highlights: '',
  wrap: true,
  padding: 28,
  filename: 'analysis.py',
  transparent: false,
});
export interface ChartPoint {
  label: string;
  x: number;
  y: number;
}
export interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'histogram' | 'pie' | 'kpi';
  title: string;
  xLabel: string;
  yLabel: string;
  color: string;
  highlightColor: string;
  highlight: string;
  annotation: string;
  legend: boolean;
  bins: number;
  data: ChartPoint[];
}
export interface ContentItem {
  id: string;
  title: string;
  markdown: string;
  details: ContentDetails;
  projectIds: string[];
  format: string;
  updatedAt: number;
  history: { at: number; note: string }[];
  exports?: { name: string; at: number }[];
}
export interface Asset {
  id: string;
  name: string;
  tags: string;
  src: string;
  bytes: number;
  createdAt: number;
}
export type BrandStyle =
  | 'Dark Editorial'
  | 'Clean Light'
  | 'Academic Minimal'
  | 'Code Studio'
  | 'Data Visualization'
  | 'Professional LinkedIn';
export const brandStyles: BrandStyle[] = [
  'Dark Editorial',
  'Clean Light',
  'Academic Minimal',
  'Code Studio',
  'Data Visualization',
  'Professional LinkedIn',
];
