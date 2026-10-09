import { templatePage, type Template } from './templates';
import type { Page } from './model';
export interface Content {
  heading: string;
  sections: string[];
}
export function parseContent(raw: string): Content {
  const lines = raw
    .trim()
    .split(/\n+/)
    .map((s) =>
      s
        .replace(/^#{1,6}\s*/, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .trim(),
    )
    .filter(Boolean);
  if (!lines.length) throw new Error('Write a headline or paste an article to get started.');
  let heading = lines.shift()!;
  const sections = lines.map((s) => s.replace(/^[-*]\s+/, '• '));
  if (heading.length > 150) {
    const words = heading.split(/\s+/);
    let short = '';
    while (words.length && (short + ' ' + words[0]).length < 120)
      short += (short ? ' ' : '') + words.shift();
    sections.unshift(words.join(' '));
    heading = short;
  }
  return { heading, sections };
}
export function distributeText(text: string, count: number): string[] {
  const words = text.split(/\s+/).filter(Boolean),
    result: string[] = [];
  let cursor = 0;
  for (let i = 0; i < count; i++) {
    const size = Math.ceil((words.length - cursor) / (count - i));
    result.push(words.slice(cursor, cursor + size).join(' '));
    cursor += size;
  }
  return result;
}
export function generatePages(
  raw: string,
  t: Template,
  width: number,
  height: number,
  count: number,
): Page[] {
  const { heading, sections } = parseContent(raw);
  if (count === 1) return [templatePage(t, width, height, heading, sections.join('\n\n'))];
  const body = sections.join('\n\n');
  const contentCount = Math.max(1, count - 2);
  // Preserve all words, including when a source paragraph is longer than one page.
  const chunks = sections.length === contentCount ? sections : distributeText(body, contentCount);
  const pages = [
    templatePage(
      t,
      width,
      height,
      heading,
      'A closer look, one idea at a time.\nSwipe to explore →',
      `1 / ${count}`,
    ),
  ];
  for (let i = 0; i < contentCount; i++) {
    const chunk = chunks[i] || 'Add your next idea here.';
    const sentence = chunk.match(/^(.{10,75}?[.!?:])\s+([\s\S]+)$/);
    pages.push(
      templatePage(
        {
          ...t,
          layout: 3,
          label: `${t.category.toUpperCase()} / ${String(i + 1).padStart(2, '0')}`,
        },
        width,
        height,
        sentence ? sentence[1] : `Idea ${String(i + 1).padStart(2, '0')}`,
        sentence ? sentence[2] : chunk,
        `${i + 2} / ${count}`,
      ),
    );
  }
  if (count > 2)
    pages.push(
      templatePage(
        { ...t, layout: 4 },
        width,
        height,
        'Keep the ideas\ngoing.',
        'Save this guide for later.\nShare it with someone who is learning, too.',
        `${count} / ${count}`,
      ),
    );
  return pages.slice(0, count);
}
