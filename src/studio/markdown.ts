import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import r from 'highlight.js/lib/languages/r';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import stata from 'highlight.js/lib/languages/stata';
import type { CodeStyle } from './types';
Object.entries({
  python,
  sql,
  r,
  javascript,
  typescript,
  html: xml,
  css,
  json,
  bash,
  stata,
}).forEach(([name, language]) => hljs.registerLanguage(name, language));
export const codeLanguages = [
  'python',
  'sql',
  'r',
  'javascript',
  'typescript',
  'html',
  'css',
  'json',
  'bash',
  'stata',
  'plaintext',
];
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const decode = (s: string) =>
  s.replace(
    /&(lt|gt|amp|quot|#39);/g,
    (_, c) => ({ lt: '<', gt: '>', amp: '&', quot: '"', '#39': "'" })[c as string] || '',
  );
export function highlightCode(source: string, language: string) {
  const alias: Record<string, string> = {
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    sh: 'bash',
    eviews: 'plaintext',
  };
  const lang = alias[language.toLowerCase()] || language.toLowerCase();
  return hljs.getLanguage(lang)
    ? hljs.highlight(source, { language: lang, ignoreIllegals: true }).value
    : escapeHtml(source);
}
type Node = {
  type: string;
  value?: string;
  depth?: number;
  lang?: string;
  children?: Node[];
  position?: { start: { offset?: number }; end: { offset?: number } };
  tagName?: string;
  properties?: Record<string, unknown>;
};
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
function safeImages() {
  return (tree: Node) => {
    const visit = (node: Node) => {
      if (node.tagName === 'blockquote') {
        const paragraph = node.children?.find((child) => child.tagName === 'p');
        const first = paragraph?.children?.[0];
        const match = first?.value?.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
        if (match && first && paragraph) {
          first.value = first.value!.slice(match[0].length);
          paragraph.children!.unshift({
            type: 'element',
            tagName: 'strong',
            children: [{ type: 'text', value: match[1].toUpperCase() + ' · ' }],
          });
        }
      }
      if (node.tagName === 'img') {
        const src = String(node.properties?.src || '');
        if (!/^data:image\/(png|jpeg|webp);base64,/.test(src)) {
          node.tagName = 'span';
          node.children = [
            {
              type: 'text',
              value: `[Image: ${node.properties?.alt || 'upload an image locally'}]`,
            },
          ];
          node.properties = {};
        } else if (node.properties?.title) {
          const img = { ...node, properties: { ...node.properties, title: undefined } };
          node.tagName = 'span';
          node.children = [
            img,
            {
              type: 'element',
              tagName: 'em',
              properties: { className: ['image-caption'] },
              children: [{ type: 'text', value: String(node.properties.title) }],
            },
          ];
          node.properties = { className: ['captioned-image'] };
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
const renderer = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(safeImages)
  .use(rehypeSanitize, {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      span: [...(defaultSchema.attributes?.span || []), ['className', 'captioned-image']],
      em: [...(defaultSchema.attributes?.em || []), ['className', 'image-caption']],
      code: [
        ...(defaultSchema.attributes?.code || []),
        ['className', /^language-./, 'math-inline', 'math-display'],
      ],
    },
    protocols: { ...defaultSchema.protocols, src: ['data'] },
  })
  .use(rehypeKatex, { trust: false, strict: 'ignore' })
  .use(rehypeStringify);
export function markdownHTML(source: string) {
  return String(renderer.processSync(source)).replace(
    /<pre><code(?: class="language-([\w-]+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_, lang, code) =>
      `<pre class="code-preview"><code>${highlightCode(decode(code), lang || 'plaintext')}</code></pre>`,
  );
}
export function codeHTML(source: string, style: CodeStyle) {
  const highlights = new Set(
    style.highlights.split(',').flatMap((part) => {
      const [a, b] = part.trim().split('-').map(Number);
      return Number.isFinite(a) && a > 0
        ? Array.from({ length: Math.min(1000, Math.max(1, (b || a) - a + 1)) }, (_, i) => a + i)
        : [];
    }),
  );
  const highlighted = highlightCode(source, style.language);
  let open: string[] = [];
  const balanced = highlighted.split('\n').map((line) => {
    const prefix = open.join('');
    for (const tag of line.match(/<\/?span\b[^>]*>/g) || [])
      if (tag.startsWith('</')) open.pop();
      else open.push(tag);
    return prefix + line + '</span>'.repeat(open.length);
  });
  return `<div class="snippet-card ${style.theme}" style="padding:${Math.max(0, Math.min(100, style.padding))}px;${style.transparent ? 'background:transparent;' : ''}">${style.filename ? `<div class="snippet-filename"><span>● ● ●</span> ${escapeHtml(style.filename)}</div>` : ''}<pre style="white-space:${style.wrap ? 'pre-wrap' : 'pre'};overflow-wrap:${style.wrap ? 'anywhere' : 'normal'}">${balanced.map((line, i) => `<div class="code-line ${highlights.has(i + 1) ? 'line-highlight' : ''}">${style.lineNumbers ? `<span class="line-number">${i + 1}</span>` : ''}<code>${line || ' '}</code></div>`).join('')}</pre></div>`;
}
export interface MarkdownBlock {
  type: string;
  source: string;
  value: string;
  language?: string;
  depth?: number;
  weight: number;
}
export interface MarkdownSlide {
  title: string;
  blocks: MarkdownBlock[];
  notes: string;
}
export function parseMarkdown(source: string): {
  slides: MarkdownSlide[];
  explicit: boolean;
  warnings: string[];
} {
  const root = parser.parse(source) as Node;
  const slides: MarkdownSlide[] = [{ title: '', blocks: [], notes: '' }];
  const warnings: string[] = [];
  let explicit = false;
  const definitions = (root.children || [])
    .filter((n) => n.type === 'definition')
    .map((n) => source.slice(n.position?.start.offset, n.position?.end.offset))
    .join('\n');
  for (const node of root.children || []) {
    const raw = source.slice(node.position?.start.offset, node.position?.end.offset);
    const slide = slides[slides.length - 1];
    const breakMatch = raw.match(/^<!--\s*slide\s*(?::\s*([\s\S]*?))?\s*-->$/i);
    if (breakMatch || (node.type === 'thematicBreak' && /^\s*-{3,}\s*$/.test(raw))) {
      explicit = true;
      if (slide.blocks.length || slide.title)
        slides.push({ title: breakMatch?.[1]?.trim() || '', blocks: [], notes: '' });
      else slide.title = breakMatch?.[1]?.trim() || '';
      continue;
    }
    const notes = raw.match(/^<!--\s*notes:\s*([\s\S]*?)\s*-->$/i);
    if (notes) {
      slide.notes += (slide.notes ? '\n' : '') + notes[1];
      continue;
    }
    if (node.type === 'html') {
      warnings.push('Raw HTML is omitted from visual output; it remains in your source.');
      continue;
    }
    if (node.type === 'definition') continue;
    const value = node.value ?? raw.replace(/^#{1,6}\s+/, '');
    if (node.type === 'heading' && !slide.title) slide.title = value;
    const weight =
      node.type === 'code'
        ? Math.max(5, value.split('\n').length * 1.5)
        : node.type === 'math'
          ? 5
          : Math.max(1, Math.ceil(raw.length / 75));
    slide.blocks.push({
      type: node.type,
      source:
        raw +
        (definitions && node.type !== 'code' && node.type !== 'math' ? `\n\n${definitions}` : ''),
      value,
      language: node.lang || undefined,
      depth: node.depth,
      weight,
    });
    if (weight > 22)
      warnings.push(
        `${node.type === 'code' ? 'Code block' : 'Content block'} may be too dense for a slide. Shorten it manually or choose a larger format.`,
      );
  }
  return {
    slides: slides.filter((s) => s.blocks.length || s.title || s.notes),
    explicit,
    warnings: [...new Set(warnings)],
  };
}
export function paginateMarkdown(source: string, count: number) {
  const parsed = parseMarkdown(source);
  if (!parsed.slides.length)
    throw new Error('Write a headline or paste a Markdown tutorial first.');
  if (parsed.explicit) return parsed;
  const all = parsed.slides.flatMap((s) => s.blocks),
    total = all.reduce((s, b) => s + b.weight, 0),
    pages: MarkdownSlide[] = Array.from({ length: Math.max(1, Math.min(30, count)) }, () => ({
      title: '',
      blocks: [],
      notes: '',
    }));
  let index = 0,
    used = 0;
  for (let i = 0; i < all.length; i++) {
    const block = all[i];
    if (
      index < pages.length - 1 &&
      pages[index].blocks.length &&
      (used + block.weight > total / pages.length || all.length - i <= pages.length - index - 1)
    ) {
      index++;
      used = 0;
    }
    pages[index].blocks.push(block);
    used += block.weight;
    if (block.type === 'heading' && !pages[index].title) pages[index].title = block.value;
  }
  pages.forEach((p, i) => {
    p.title ||=
      i === 0
        ? 'A closer look'
        : i === pages.length - 1
          ? 'Your takeaway'
          : `Continue the lesson · ${i + 1}`;
  });
  return { ...parsed, slides: pages };
}
export function plainCaption(source: string) {
  return source
    .replace(/<!--[^]*?-->/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^]*?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^---\s*$/gm, '')
    .trim();
}
