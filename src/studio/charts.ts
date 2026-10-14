import type { ChartConfig, ChartPoint } from './types';
export function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (quoted && raw[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!quoted && cell.length) throw new Error('Unexpected quote in CSV field.');
      else quoted = !quoted;
    } else if ((c === ',' || c === '\t') && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && raw[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((s) => s.trim())) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  row.push(cell);
  if (row.some((s) => s.trim())) rows.push(row);
  return rows;
}
export function chartData(raw: string): ChartPoint[] {
  const rows = parseCSV(raw);
  if (!rows.length) throw new Error('Enter at least one data row.');
  const header = rows[0].map((s) => s.trim().toLowerCase());
  const hasHeader = header.includes('value') || header.includes('y');
  const yColumn = header.includes('y')
    ? header.indexOf('y')
    : header.includes('value')
      ? header.indexOf('value')
      : rows[0].length - 1;
  const xColumn = header.indexOf('x');
  const labelColumn = header.includes('label') ? header.indexOf('label') : 0;
  const values = hasHeader ? rows.slice(1) : rows;
  if (!values.length || values.length > 10000) throw new Error('Use 1–10,000 observations.');
  return values.map((row, i) => {
    const rawY = row[yColumn]?.trim();
    const y = Number(rawY),
      x = xColumn >= 0 ? Number(row[xColumn]) : i + 1;
    if (!rawY || !Number.isFinite(y) || !Number.isFinite(x))
      throw new Error(`Row ${i + 1}: enter valid numeric values.`);
    return { label: row[labelColumn] || String(i + 1), x, y };
  });
}
export const defaultChart = (): ChartConfig => ({
  type: 'bar',
  title: 'Your chart title',
  xLabel: 'Category',
  yLabel: 'Value',
  color: '#3469EF',
  highlightColor: '#8A6CF0',
  highlight: '',
  annotation: 'Add your source and interpretation.',
  legend: true,
  bins: 6,
  data: [],
});
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const color = (s: string) => (/^#[a-f\d]{6}$/i.test(s) ? s : '#3469EF');
export function histogram(data: ChartPoint[], bins: number): ChartPoint[] {
  const ys = data.map((d) => d.y),
    min = Math.min(...ys),
    max = Math.max(...ys);
  const n = Math.max(1, Math.min(30, Math.round(bins) || 6)),
    span = max - min || 1,
    step = span / n;
  const result = Array.from({ length: n }, (_, i) => ({
    label: `${(min + i * step).toFixed(1)}–${(min + (i + 1) * step).toFixed(1)}`,
    x: min + i * step,
    y: 0,
  }));
  ys.forEach((v) => result[Math.min(n - 1, Math.floor((v - min) / step))].y++);
  return result;
}
export function chartSVG(c: ChartConfig, width = 900, height = 650): string {
  if (!c.data.length) throw new Error('Add data before inserting this chart.');
  if (c.type === 'pie' && c.data.some((d) => d.y < 0))
    throw new Error('Pie charts cannot represent negative values.');
  const data = c.type === 'histogram' ? histogram(c.data, c.bins) : c.data;
  if (c.type === 'pie' && data.reduce((s, d) => s + d.y, 0) <= 0)
    throw new Error('Pie charts need a positive total.');
  const w = Math.max(300, width),
    h = Math.max(260, height),
    f = Math.max(12, Math.min(w, h) * 0.036),
    left = f * 4.5,
    right = w - f * 2,
    top = f * 4,
    bottom = h - f * 5;
  const parts: string[] = [];
  const text = (x: number, y: number, s: string, size = f, anchor = 'start', fill = '#20283C') =>
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial" font-size="${size}" text-anchor="${anchor}">${esc(s)}</text>`;
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="18" fill="#F5F7FB"/>`,
    text(f * 1.6, f * 2.3, c.title, f * 1.45),
  );
  const ink = color(c.color),
    accent = color(c.highlightColor),
    fmt = (v: number) =>
      Math.abs(v) >= 1e6
        ? `${(v / 1e6).toFixed(1)}m`
        : Math.abs(v) >= 1e3
          ? `${(v / 1e3).toFixed(1)}k`
          : Number(v.toPrecision(3)).toString();
  if (c.type === 'kpi') {
    parts.push(
      text(w / 2, h * 0.55, fmt(data[0].y), f * 5, 'middle', ink),
      text(w / 2, h * 0.67, data[0].label, f * 1.3, 'middle'),
    );
  } else if (c.type === 'pie') {
    const sum = data.reduce((s, d) => s + d.y, 0),
      cx = w * 0.38,
      cy = h * 0.5,
      r = Math.min(w * 0.25, h * 0.29);
    let a = -Math.PI / 2;
    data.forEach((d, i) => {
      const b = a + (d.y / sum) * Math.PI * 2;
      const fill = i % 2 ? accent : ink;
      if (d.y === sum) parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`);
      else if (d.y > 0)
        parts.push(
          `<path d="M${cx},${cy} L${cx + Math.cos(a) * r},${cy + Math.sin(a) * r} A${r},${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${cx + Math.cos(b) * r},${cy + Math.sin(b) * r} Z" fill="${fill}" opacity="${1 - (i / data.length) * 0.4}" stroke="white" stroke-width="2"/>`,
        );
      if (c.legend)
        parts.push(
          text(
            w * 0.68,
            top + i * f * 1.7,
            `${d.label}: ${((d.y / sum) * 100).toFixed(1)}%`,
            f * 0.9,
          ),
        );
      a = b;
    });
  } else {
    let ymin = Math.min(0, ...data.map((d) => d.y)),
      ymax = Math.max(0, ...data.map((d) => d.y));
    if (ymax === ymin) ymax = ymin + 1;
    const y = (v: number) => bottom - ((v - ymin) / (ymax - ymin)) * (bottom - top);
    for (let i = 0; i <= 4; i++) {
      const value = ymin + ((ymax - ymin) * i) / 4,
        py = y(value);
      parts.push(
        `<line x1="${left}" y1="${py}" x2="${right}" y2="${py}" stroke="#D8DFEE"/>`,
        text(left - f * 0.6, py + f * 0.3, fmt(value), f * 0.85, 'end'),
      );
    }
    const xmin = Math.min(...data.map((d) => d.x)),
      xmax = Math.max(...data.map((d) => d.x));
    const x = (v: number) => left + ((v - xmin) / (xmax - xmin || 1)) * (right - left);
    const bar = c.type === 'bar' || c.type === 'histogram',
      step = (right - left) / data.length;
    if (c.type === 'line')
      parts.push(
        `<polyline points="${data.map((d) => `${x(d.x)},${y(d.y)}`).join(' ')}" fill="none" stroke="${ink}" stroke-width="3"/>`,
      );
    data.forEach((d, i) => {
      const fill = c.highlight
        .split(',')
        .map((s) => s.trim())
        .includes(d.label)
        ? accent
        : ink;
      const px = bar ? left + step * (i + 0.5) : x(d.x);
      if (bar)
        parts.push(
          `<rect x="${px - step * 0.32}" y="${Math.min(y(d.y), y(0))}" width="${step * 0.64}" height="${Math.abs(y(d.y) - y(0))}" fill="${fill}"/>`,
        );
      else
        parts.push(
          `<circle cx="${px}" cy="${y(d.y)}" r="${Math.max(3, f * 0.22)}" fill="${fill}"/>`,
        );
      if (data.length <= 12 || i % Math.ceil(data.length / 8) === 0)
        parts.push(
          text(
            px,
            bottom + f * 1.5,
            bar ? d.label : Number(d.x.toPrecision(7)).toString(),
            f * 0.85,
            'middle',
          ),
        );
    });
    parts.push(
      text((left + right) / 2, bottom + f * 3, c.xLabel, f * 0.95, 'middle'),
      `<text transform="translate(${f * 1.3} ${(top + bottom) / 2}) rotate(-90)" text-anchor="middle" font-family="Arial" font-size="${f * 0.95}" fill="#20283C">${esc(c.type === 'histogram' ? 'Frequency' : c.yLabel)}</text>`,
    );
  }
  parts.push(text(f * 1.6, h - f, c.annotation.slice(0, 150), f * 0.8));
  parts.push('</svg>');
  return parts.join('');
}
