import { describe, expect, it } from 'vitest';
import { distributeText, generatePages, parseContent } from './layout';
import { templates } from './templates';
describe('writing and carousel layout', () => {
  it('recognizes headings, paragraphs, and bullets', () => {
    expect(
      parseContent('# A clear title\n\nFirst paragraph.\n- A useful point\n* Another point'),
    ).toEqual({
      heading: 'A clear title',
      sections: ['First paragraph.', '• A useful point', '• Another point'],
    });
  });
  it('preserves every word in order when splitting long paragraphs', () => {
    const source = Array.from({ length: 1307 }, (_, i) => `word${i}`).join(' ');
    const chunks = distributeText(source, 7);
    expect(chunks).toHaveLength(7);
    expect(chunks.join(' ')).toBe(source);
    expect(
      Math.max(...chunks.map((c) => c.split(' ').length)) -
        Math.min(...chunks.map((c) => c.split(' ').length)),
    ).toBeLessThanOrEqual(1);
  });
  it('creates the requested number of editable, uniquely identified slides', () => {
    const pages = generatePages(
      'A topic\n\nFirst concept.\n\nSecond concept.\n\nThird concept.',
      templates[0],
      1080,
      1080,
      5,
    );
    expect(pages).toHaveLength(5);
    expect(new Set(pages.map((p) => p.id)).size).toBe(5);
    expect(pages[1].elements.some((e) => e.kind === 'text' && e.text === 'First concept.')).toBe(
      true,
    );
    expect(pages[4].elements.find((e) => e.role === 'pageNumber')?.text).toBe('5 / 5');
  });
  it('does not discard overflow from an unusually long first line', () => {
    const words = Array.from({ length: 150 }, (_, i) => `unique${i}`);
    const parsed = parseContent(words.join(' '));
    expect([parsed.heading, ...parsed.sections].join(' ')).toBe(words.join(' '));
  });
  it('provides at least twenty original editable templates', () => {
    expect(templates.length).toBeGreaterThanOrEqual(20);
    expect(new Set(templates.map((t) => t.title)).size).toBe(templates.length);
  });
  it('rejects empty writing', () => {
    expect(() => parseContent(' \n ')).toThrow('Write a headline');
  });
});
