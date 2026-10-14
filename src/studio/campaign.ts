import { uid, newProject, type Brand, type Project } from '../model';
import {
  normalizeContent,
  emptyContent,
  platforms,
  statuses,
  type ContentItem,
  type ContentDetails,
} from './types';
import { parseCSV } from './charts';
import { markdownPages } from './composition';
const string = (value: unknown) =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
export function contentRecord(record: Record<string, unknown>, campaign = ''): ContentItem {
  const normalized = Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k.toLowerCase().replace(/[ _-]/g, ''), v]),
  );
  const field = (...keys: string[]) => keys.map((k) => string(normalized[k])).find(Boolean) || '';
  const details = normalizeContent(record.details);
  details.campaign = field('campaign') || details.campaign || campaign;
  details.topic = field('topic', 'category') || details.topic;
  details.narration = field('script', 'reelscript', 'narration') || details.narration;
  details.references = field('references', 'sources') || details.references;
  const day = field('day', 'daynumber').match(/\d+/)?.[0];
  if (day) details.day = Number(day);
  const status = field('status');
  if (statuses.includes(status as (typeof statuses)[number]))
    details.status = status as (typeof statuses)[number];
  const date = field('date', 'scheduleddate', 'publicationdate');
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) details.scheduledDate = date;
  const captionObj =
    record.captions && typeof record.captions === 'object'
      ? (record.captions as Record<string, unknown>)
      : {};
  for (const platform of platforms) {
    const value =
      field(`${platform.toLowerCase()}caption`, platform.toLowerCase()) ||
      string(captionObj[platform]) ||
      string(captionObj[platform.toLowerCase()]);
    if (value) details.captions[platform] = value;
  }
  if (field('caption')) details.captions.Instagram = field('caption');
  let markdown = field('markdown', 'sourcetext', 'source', 'content', 'explanation', 'slidetext');
  if (Array.isArray(record.slides))
    markdown = record.slides
      .map((slide: unknown) =>
        typeof slide === 'string'
          ? slide
          : slide && typeof slide === 'object'
            ? `# ${string((slide as Record<string, unknown>).title)}\n\n${string((slide as Record<string, unknown>).text)}`
            : '',
      )
      .join('\n\n---\n\n');
  const title =
    field('title', 'workingtitle', 'name') ||
    markdown
      .split('\n')
      .find((s) => s.trim())
      ?.replace(/^#+\s*/, '')
      .slice(0, 100) ||
    `Day ${details.day || '—'} · Untitled`;
  return {
    id: uid(),
    title,
    markdown,
    details,
    projectIds: [],
    format: field('format') || 'Carousel',
    updatedAt: Date.now(),
    history: [{ at: Date.now(), note: 'Imported writing; source retained.' }],
  };
}
export function importCampaign(raw: string, filename: string): ContentItem[] {
  if (raw.length > 20_000_000) throw new Error('Use an import file smaller than 20 MB.');
  let records: ContentItem[] = [];
  const campaign = filename.replace(/\.[^.]+$/, '');
  if (/\.json$/i.test(filename)) {
    const data = JSON.parse(raw);
    const rows = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [data];
    if (rows.some((r: unknown) => !r || typeof r !== 'object' || Array.isArray(r)))
      throw new Error('JSON must contain a content object or an array of content objects.');
    records = rows.map((row: Record<string, unknown>) => contentRecord(row, campaign));
  } else if (/\.(csv|tsv)$/i.test(filename)) {
    const rows = parseCSV(raw);
    if (rows.length < 2) throw new Error('CSV requires a header and at least one content row.');
    const headers = rows[0];
    records = rows
      .slice(1)
      .map((row) =>
        contentRecord(
          Object.fromEntries(headers.map((header, i) => [header, row[i] || ''])),
          campaign,
        ),
      );
  } else {
    const sections: { title: string; body: string; day?: number }[] = [];
    let current = { title: '', body: '', day: undefined as number | undefined },
      fence = '';
    for (const line of raw.split('\n')) {
      const f = line.match(/^\s*(`{3,}|~{3,})/);
      if (f) {
        if (!fence) fence = f[1][0];
        else if (f[1][0] === fence) fence = '';
      }
      const heading = !fence ? line.match(/^#{1,2}\s+Day\s+(\d+)\s*[:—–-]?\s*(.*)$/i) : null;
      if (heading) {
        if (current.body.trim()) sections.push(current);
        current = {
          title: heading[2] || `Day ${heading[1]}`,
          body: line + '\n',
          day: Number(heading[1]),
        };
      } else current.body += line + '\n';
    }
    if (current.body.trim()) sections.push(current);
    records = sections.map((section) =>
      contentRecord(
        { title: section.title, markdown: section.body.trim(), day: section.day },
        campaign,
      ),
    );
  }
  if (!records.length || records.length > 500)
    throw new Error('Import 1–500 content items at a time.');
  return records;
}
export function projectFromContent(item: ContentItem, brand: Brand): Project {
  const p = newProject(item.title, 1080, 1350);
  p.sourceText = item.markdown;
  p.content = structuredClone(item.details);
  p.brandId = brand.id;
  if (item.markdown.trim())
    p.pages = markdownPages(item.markdown, p.width, p.height, 5, brand).pages;
  return p;
}
