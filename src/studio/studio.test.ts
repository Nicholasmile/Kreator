import { describe, it, expect } from 'vitest';
import { newProject, parseProject, presets, element } from '../model';
import { parseMarkdown, paginateMarkdown, markdownHTML, highlightCode, codeHTML } from './markdown';
import { defaultCode, normalizeContent } from './types';
import { markdownPages, repurpose, platformFormats, densityWarnings } from './composition';
import { importCampaign } from './campaign';
import { parseCSV, chartData, chartSVG, defaultChart, histogram } from './charts';
import { templates, templatePage } from '../templates';
import { examples } from './examples';
describe('v2 compatibility', () => {
  it('rejects incomplete imported technical elements before rendering', () => {
    const p = newProject('Malformed');
    p.pages[0].elements = [
      element('code', { code: { ...defaultCode(), highlights: undefined } as never }),
    ];
    expect(() => parseProject(JSON.stringify(p))).toThrow('Invalid code styling');
    p.pages[0].elements = [element('chart', { chart: { ...defaultChart(), title: 4 } as never })];
    expect(() => parseProject(JSON.stringify(p))).toThrow('Invalid chart data');
    p.pages[0].elements = [element('image', { crop: { x: 1, y: 0, width: 1, height: 1 } })];
    expect(() => parseProject(JSON.stringify(p))).toThrow('Invalid image crop');
  });
  it('normalizes malformed optional imported writing fields', () => {
    const result = normalizeContent({
      topic: 7,
      captions: { Instagram: { unsafe: true }, LinkedIn: 'Kept' },
      status: 'invalid',
    });
    expect(result.topic).toBe('');
    expect(result.captions.Instagram).toBe('');
    expect(result.captions.LinkedIn).toBe('Kept');
    expect(result.status).toBe('Draft');
  });
  it('migrates a legacy project without altering artwork or identity', () => {
    const p = newProject('Legacy');
    p.pages[0].elements = [element('text', { text: 'Keep this exact text', x: 63, y: 97 })];
    const legacy = { ...p, version: 1, content: undefined };
    const result = parseProject(JSON.stringify(legacy), false);
    expect(result.version).toBe(2);
    expect(result.id).toBe(p.id);
    expect(result.pages).toEqual(p.pages);
    expect(result.content.captions.LinkedIn).toBe('');
  });
  it('preserves source, captions and code indentation through JSON', () => {
    const p = newProject('Technical');
    p.sourceText = examples[0].source;
    p.content.captions.LinkedIn = 'My own caption';
    p.pages = markdownPages(p.sourceText, 1080, 1350, 5, presets[0]).pages;
    const next = parseProject(JSON.stringify(p));
    expect(next.sourceText).toBe(p.sourceText);
    expect(next.content.captions.LinkedIn).toBe('My own caption');
    expect(
      next.pages
        .flatMap((p) => p.elements)
        .filter((e) => e.kind === 'code')
        .map((e) => e.text),
    ).toEqual(
      p.pages
        .flatMap((p) => p.elements)
        .filter((e) => e.kind === 'code')
        .map((e) => e.text),
    );
  });
});
describe('semantic Markdown and safety', () => {
  it('formats callouts and local image captions without injecting HTML', () => {
    expect(markdownHTML('> [!TIP]\n> Check units.')).toContain('<strong>TIP · </strong>');
    const html = markdownHTML('![example](data:image/png;base64,AAAA "Illustrative figure")');
    expect(html).toContain('image-caption');
    expect(html).toContain('Illustrative figure');
  });
  it('recognizes headings, rich text, tables, math, code, and explicit breaks', () => {
    const parsed = parseMarkdown(
      '# Title\n\n**Bold** and *italic* and ~~old~~ and `x`.\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n$$\nx^2\n$$\n\n```python\nif ready:\n    run()\n```\n\n---\n\n# Next\n<!-- notes: Explain this. -->',
    );
    expect(parsed.explicit).toBe(true);
    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[0].blocks.map((b) => b.type)).toEqual([
      'heading',
      'paragraph',
      'table',
      'math',
      'code',
    ]);
    expect(parsed.slides[1].notes).toBe('Explain this.');
  });
  it('never splits code or equations during pagination', () => {
    const source =
      '# Lesson\n\n```python\nfor x in data:\n    print(x)\n```\n\n$$\ny=mx+b\n$$\n\nA conclusion.';
    const out = paginateMarkdown(source, 5);
    expect(out.slides.flatMap((s) => s.blocks).find((b) => b.type === 'code')?.value).toBe(
      'for x in data:\n    print(x)',
    );
    expect(out.slides.flatMap((s) => s.blocks).filter((b) => b.type === 'math')).toHaveLength(1);
  });
  it('does not interpret slide markers inside fenced code', () => {
    expect(parseMarkdown('```text\n---\n<!-- slide: No -->\n```').slides).toHaveLength(1);
  });
  it('renders mixed inline formatting and math', () => {
    const html = markdownHTML('**bold** *italic* ~~strike~~ `x` and $x^2$');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<del>strike</del>');
    expect(html).toContain('katex');
  });
  it('discards unsafe HTML, links and remote image fetches', () => {
    const html = markdownHTML(
      '<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n![track](https://example.com/private.png)',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('href="javascript');
    expect(html).not.toContain('src="https:');
    expect(html).toContain('Image: track');
  });
  it('highlights Python without executing or changing indentation', () => {
    const source = 'if ready:\n    print("hello")';
    expect(highlightCode(source, 'python')).toContain('hljs-keyword');
    expect(parseMarkdown('```python\n' + source + '\n```').slides[0].blocks[0].value).toBe(source);
    expect(codeHTML(source, { ...defaultCode(), lineNumbers: false })).toContain('    ');
    expect(highlightCode('<img onerror=alert(1)>', 'plaintext')).toBe(
      '&lt;img onerror=alert(1)&gt;',
    );
  });
  it('preserves reference definitions for independently rendered blocks', () => {
    const p = parseMarkdown('Read [the source][ref].\n\n[ref]: https://example.org');
    expect(markdownHTML(p.slides[0].blocks[0].source)).toContain('href="https://example.org"');
  });
});
describe('compositions and platform variants', () => {
  it('generates the complete five-slide example with source-backed code and rich objects', () => {
    const result = markdownPages(examples[0].source, 1080, 1350, 5, presets[0]);
    expect(result.pages).toHaveLength(5);
    expect(result.pages.flatMap((p) => p.elements).some((e) => e.kind === 'code')).toBe(true);
    expect(
      result.pages
        .flatMap((p) => p.elements)
        .some((e) => e.kind === 'rich' && e.text?.includes('$$')),
    ).toBe(true);
  });
  it('reflows an independent variant within safe margins', () => {
    const p = newProject('Original');
    p.pages = markdownPages(examples[0].source, p.width, p.height, 5, presets[0]).pages;
    const before = JSON.stringify(p);
    const next = repurpose(p, platformFormats[3]);
    expect(JSON.stringify(p)).toBe(before);
    expect(next.id).not.toBe(p.id);
    expect(next.parentId).toBe(p.id);
    expect(next.height).toBe(1350);
    expect(next.content.platform).toBe('LinkedIn');
    expect(
      next.pages
        .flatMap((pg) => densityWarnings(pg, next.width, next.height))
        .some((s) => s.includes('beyond')),
    ).toBe(false);
  });
  it('provides eighty unique templates from nineteen compositions', () => {
    expect(templates).toHaveLength(80);
    expect(new Set(templates.map((t) => t.id)).size).toBe(80);
    expect(new Set(templates.map((t) => t.layout)).size).toBe(19);
    for (const t of templates) {
      const p = templatePage(t);
      expect(p.elements.length).toBeGreaterThan(3);
      expect(p.elements.some((e) => e.kind === 'text')).toBe(true);
    }
  });
});
describe('campaign imports and chart accuracy', () => {
  it('parses quoted CSV including commas and multiline captions', () => {
    expect(parseCSV('title,caption\n"A, B","First\nSecond"')).toEqual([
      ['title', 'caption'],
      ['A, B', 'First\nSecond'],
    ]);
  });
  it('imports 120 explicit campaign records without inventing captions', () => {
    const records = importCampaign(
      'day,title,markdown\n' +
        Array.from({ length: 120 }, (_, i) => `${i + 1},Day ${i + 1} topic,Lesson ${i + 1}`).join(
          '\n',
        ),
      'campaign.csv',
    );
    expect(records).toHaveLength(120);
    expect(records[119].details.day).toBe(120);
    expect(records[0].details.captions.Instagram).toBe('');
  });
  it('preserves explicitly supplied slide text and platform captions', () => {
    const records = importCampaign(
      JSON.stringify([
        {
          day: 31,
          title: 'Python',
          slides: ['First', 'Second'],
          captions: { Instagram: 'IG draft', LinkedIn: 'LI draft' },
          script: 'My narration',
        },
      ]),
      'campaign.json',
    );
    expect(records[0].markdown).toBe('First\n\n---\n\nSecond');
    expect(records[0].details.captions.LinkedIn).toBe('LI draft');
    expect(records[0].details.narration).toBe('My narration');
  });
  it('does not split Markdown campaign headings within code', () => {
    const records = importCampaign(
      '# Day 1: First\n\n```python\n# Day 2: This is code\n```\n\n# Day 3: Next',
      'campaign.md',
    );
    expect(records).toHaveLength(2);
    expect(records[0].markdown).toContain('# Day 2');
  });
  it('rejects malformed numeric data and counts every histogram observation', () => {
    expect(() => chartData('label,value\nA,missing')).toThrow();
    const data = chartData('label,value\nA,-3\nB,0\nC,4');
    expect(histogram(data, 3).reduce((s, b) => s + b.y, 0)).toBe(3);
    expect(chartSVG({ ...defaultChart(), data })).not.toMatch(/NaN|Infinity/);
    expect(() => chartSVG({ ...defaultChart(), type: 'pie', data })).toThrow('negative');
  });
});

it('keeps adjacent numeric years distinguishable on chart axes', () => {
  const svg = chartSVG({
    ...defaultChart(),
    type: 'line',
    data: [
      { label: '2021', x: 2021, y: 100 },
      { label: '2022', x: 2022, y: 108 },
    ],
  });
  expect(svg).toContain('>2021</text>');
  expect(svg).toContain('>2022</text>');
});
