import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
test('Markdown tutorial to charted carousel, platform variant, captions and export', async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Write', exact: true }).click();
  await page.getByLabel('Load example').selectOption('0');
  await expect(page.locator('.document-preview strong').first()).toBeVisible();
  await expect(page.locator('.document-preview .katex').first()).toBeVisible();
  await expect(page.locator('.document-preview .hljs-keyword').first()).toBeVisible();
  await page.getByRole('button', { name: 'Platform captions', exact: true }).click();
  await page
    .getByLabel('Instagram caption', { exact: true })
    .fill('My Python lesson: inspect before you calculate.');
  await page.getByLabel('Caption platform').selectOption('LinkedIn');
  await page
    .getByLabel('LinkedIn caption', { exact: true })
    .fill('A reproducible analysis begins with a clear question.');
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('writing-desk.png'), fullPage: true });
  await page.getByRole('button', { name: 'Generate Design', exact: true }).click();
  await expect(page.locator('.generation-preview .design-canvas')).toHaveAttribute(
    'data-render-ready',
    'true',
  );
  await page.getByRole('button', { name: 'Use generated slides', exact: true }).click();
  await expect(page.locator('.page-thumbnail')).toHaveCount(5);
  await page.locator('.page-thumbnail').nth(1).click();
  await expect(page.locator('.canvas-wrap .design-canvas')).toHaveAttribute(
    'data-render-ready',
    'true',
  );
  await page.screenshot({ path: testInfo.outputPath('python-code-slide.png'), fullPage: true });
  await page.getByRole('button', { name: 'Chart', exact: true }).click();
  await page.getByLabel('Chart title', { exact: true }).fill('Illustrative units by category');
  await page.getByLabel('Chart CSV data').fill('label,value\nA,12\nB,8\nC,15');
  await page
    .getByLabel('Source / annotation')
    .fill('Simulated data for teaching, not a reported finding.');
  await page.getByRole('button', { name: 'Insert chart', exact: true }).click();
  await page.getByLabel('Page layout').selectOption('Code + explanation');
  await page.getByRole('button', { name: 'Write & create', exact: true }).click();
  await expect(page.locator('.cm-content')).toContainText('import pandas as pd');
  await page.getByRole('button', { name: 'Return to canvas', exact: true }).click();
  await expect(page.locator('.layers-list')).toContainText('chart');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('File format').selectOption('zip');
  await page.getByLabel('Bundle captions and Markdown').check();
  const zipped = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const zip = await zipped;
  const zipPath = testInfo.outputPath('publishing-pack.zip');
  await zip.saveAs(zipPath);
  const pack = await JSZip.loadAsync(await readFile(zipPath));
  expect(Object.keys(pack.files).filter((f) => f.endsWith('.png'))).toHaveLength(5);
  expect(await pack.file('source.md')!.async('string')).toContain('import pandas as pd');
  expect(await pack.file('captions.txt')!.async('string')).toContain('reproducible analysis');
  await page.getByRole('button', { name: 'Repurpose for Platform', exact: true }).click();
  await page.getByLabel('Target platform').selectOption('3');
  await page.getByRole('button', { name: 'Create and open variant', exact: true }).click();
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue(/LinkedIn/);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('File format').selectOption('pdf');
  const pdfEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const pdf = await pdfEvent;
  const pdfPath = testInfo.outputPath('linkedin.pdf');
  await pdf.saveAs(pdfPath);
  expect((await readFile(pdfPath)).subarray(0, 5).toString()).toBe('%PDF-');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.page-thumbnail')).toHaveCount(5);
  await page.getByRole('button', { name: 'Write & create', exact: true }).click();
  await page.getByRole('button', { name: 'Platform captions', exact: true }).click();
  await page.getByLabel('Caption platform').selectOption('LinkedIn');
  await expect(page.getByLabel('LinkedIn caption', { exact: true })).toHaveValue(
    'A reproducible analysis begins with a clear question.',
  );
  expect(errors).toEqual([]);
});
test('campaign import preview, calendar, batch projects, and workspace backup restore', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  const csv =
    'day,title,markdown,caption,scheduledDate,campaign\n31,Python foundations,"# Python\n\nLearn `print()`.",My original caption,2026-10-20,120-day campaign\n32,Statistics,"# Spread\n\nInspect the distribution.",My next caption,2026-10-21,120-day campaign';
  await page
    .locator('input[accept=".md,.markdown,.json,.csv,.tsv"]')
    .setInputFiles({ name: 'campaign.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.getByRole('dialog', { name: 'Import preview · 2 items' })).toBeVisible();
  await expect(page.locator('.content-tile')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save imported content' }).click();
  await expect(page.locator('.content-tile')).toHaveCount(2);
  await page.getByRole('button', { name: 'Select filtered items' }).click();
  await page.getByRole('button', { name: 'Create 2 designs' }).click();
  await expect(page.getByRole('status')).toContainText('2 design projects');
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByLabel('Calendar date').fill('2026-10-20');
  await expect(
    page.locator('.calendar-day').filter({ hasText: 'Python foundations' }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('campaign-calendar.png'), fullPage: true });
  const backupEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup workspace' }).click();
  const backup = await backupEvent,
    path = testInfo.outputPath('workspace.json');
  await backup.saveAs(path);
  const payload = JSON.parse(await readFile(path, 'utf8'));
  expect(payload.projects).toHaveLength(2);
  expect(payload.content).toHaveLength(2);
  await page.locator('.library-workspace input[accept=".json"]').setInputFiles(path);
  await page.getByRole('button', { name: 'Restore copies' }).click();
  await expect(page.getByRole('status')).toContainText('restored');
  await page.getByRole('button', { name: 'list', exact: true }).click();
  await expect(page.locator('.content-tile')).toHaveCount(4);
});
test('legacy IndexedDB project and custom brands survive upgrade', async ({ page }) => {
  await page.route('**/migration-fixture', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Migration fixture</title>',
    }),
  );
  await page.goto('/migration-fixture');
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('kreator-studio', 2);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('projects', { keyPath: 'id' });
        req.result.createObjectStore('brands', { keyPath: 'id' });
        req.result.createObjectStore('settings');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction(['projects', 'brands', 'settings'], 'readwrite');
    tx.objectStore('projects').put({
      version: 1,
      id: 'legacy-id',
      name: 'My original design',
      width: 1080,
      height: 1080,
      pages: [
        {
          id: 'legacy-page',
          background: '#faf7f2',
          duration: 4,
          transition: 'fade',
          elements: [
            {
              id: 'legacy-text',
              kind: 'text',
              text: 'Keep my work',
              x: 100,
              y: 100,
              width: 700,
              height: 200,
              fill: '#101B34',
              opacity: 1,
              rotation: 0,
              fontSize: 60,
            },
          ],
        },
      ],
      sourceText: 'Original writing',
      volume: 0.5,
      updatedAt: 1,
    });
    tx.objectStore('brands').put({
      id: 'custom',
      name: 'My custom brand',
      primary: '#112233',
      secondary: '#ffffff',
      accent: '#445566',
      headingFont: 'Arial',
      bodyFont: 'Arial',
      watermark: 'Mine',
      handle: '',
    });
    tx.objectStore('settings').put(true, 'brandsInitialized');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^My original design 1080/ }).click();
  await expect(page.locator('.layers-list')).toContainText('Keep my work');
  await page.getByRole('button', { name: 'Brand kit', exact: true }).click();
  await expect(page.locator('.editor-brands')).toContainText('My custom brand');
  await expect(page.locator('.editor-brands')).toContainText('Malik Kolade');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.layers-list')).toContainText('Keep my work');
});
