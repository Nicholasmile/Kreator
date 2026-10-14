import { test, expect } from '@playwright/test';
import path from 'node:path';

test('representative technical slides retain their visual layout', async ({ page }) => {
  test.setTimeout(120000);
  for (const [file, index, snapshot] of [
    ['python-tutorial', 1, 'python-code.png'],
    ['statistics-spread', 2, 'standard-deviation.png'],
    ['economics-simulated-index', 1, 'economic-chart.png'],
  ] as const) {
    await page.goto('/');
    await page
      .locator('input[accept=".json,application/json"]')
      .setInputFiles(path.resolve(`examples/${file}.json`));
    await expect(page.locator('.page-thumbnail')).toHaveCount(5);
    await page.locator('.page-thumbnail').nth(index).click();
    const canvas = page.locator('.canvas-wrap .design-canvas');
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await expect(canvas).toHaveScreenshot(snapshot, { maxDiffPixelRatio: 0.005 });
  }
});

test('original and Data Science template compositions retain their appearance', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Templates', exact: true }).click();
  const gallery = page.locator('.template-gallery-v2');
  const search = page.getByLabel('Search templates');
  await search.fill('Python');
  await expect(page.locator('.gallery-thumbnail canvas').first()).toBeVisible();
  for (const canvas of await page.locator('.gallery-thumbnail .design-canvas').all())
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await expect(gallery).toHaveScreenshot('python-template-gallery.png', {
    maxDiffPixelRatio: 0.005,
  });
});
