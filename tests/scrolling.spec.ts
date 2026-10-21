import { test, expect } from '@playwright/test';

test('template panel scrolls without accumulating live canvases or moving the design', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Instagram Post', exact: false }).click();
  const panel = page.locator('.tool-panel');
  const design = page.locator('.canvas-wrap .design-canvas');
  await expect(design).toHaveAttribute('data-render-ready', 'true');
  await expect(panel.locator('.gallery-thumbnail img').first()).toBeVisible();
  const position = await design.boundingBox();
  const height = await panel.evaluate((el) => el.scrollHeight);
  await panel.hover();
  await page.mouse.wheel(0, 650);
  await expect.poll(() => panel.evaluate((el) => el.scrollTop)).toBeGreaterThan(500);

  // Reveal each family, including expensive code and equation previews.
  for (const index of [20, 32, 48, 56, 70, 79]) {
    const card = panel.locator('.gallery-thumbnail').nth(index);
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('img')).toBeVisible({ timeout: 15000 });
    await expect
      .poll(() =>
        card
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    await expect(panel.locator('canvas')).toHaveCount(0);
    expect(await panel.evaluate((el) => el.scrollHeight)).toBe(height);
    expect(await design.boundingBox()).toEqual(position);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  }
  await panel.locator('.gallery-thumbnail').first().scrollIntoViewIfNeeded();
  await expect(panel.locator('.gallery-thumbnail img').first()).toBeVisible();
  await expect(panel.locator('canvas')).toHaveCount(0);
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue('Instagram Post');
  expect(errors).toEqual([]);
});

test('every built-in template has a loadable pre-rendered preview', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Templates', exact: true }).click();
  const previews = page.locator('.gallery-thumbnail img');
  await expect(previews).toHaveCount(80);
  const urls = await previews.evaluateAll((images) =>
    images.map((img) => (img as HTMLImageElement).src),
  );
  for (const url of urls) {
    const response = await page.request.get(url);
    expect(response.ok(), url).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
  }
});
