import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Rebuild after changing template content/layout. Previews use the same renderer
// as the editor, but expensive code/math rasterization happens here, not on scroll.
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.locator('.template-gallery-v2').waitFor();
  const ids = await page.evaluate(async () => {
    const { templates } = await import('/src/templates.ts');
    return templates.map((t) => t.id);
  });
  await mkdir('src/assets/template-previews', { recursive: true });
  for (const id of ids) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error(`Invalid template id: ${id}`);
    const data = await page.evaluate(async (id) => {
      const { templates, templatePage } = await import('/src/templates.ts');
      const { renderPage } = await import('/src/render.ts');
      const template = templates.find((t) => t.id === id);
      const height = template.platform === 'WhatsApp' ? 1920 : template.layout >= 5 ? 1350 : 1080;
      const canvas = await renderPage(templatePage(template, 1080, height), 1080, height, 270);
      const data = canvas.toDataURL('image/png');
      canvas.width = canvas.height = 0;
      return data.split(',')[1];
    }, id);
    await writeFile(`src/assets/template-previews/${id}.png`, Buffer.from(data, 'base64'));
  }
  console.log(`Generated ${ids.length} template previews.`);
} finally {
  await browser?.close();
  await server.close();
}
