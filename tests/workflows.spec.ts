import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
test('create, edit, save, reopen, generate a carousel, and export real files', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Big ideas start here.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  await page.getByRole('button', { name: 'Instagram Post', exact: false }).click();
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue('Instagram Post');
  await page.getByLabel('Project name', { exact: true }).fill('Browser workflow test');
  await page.locator('.layers-list button').filter({ hasText: 'Small steps.' }).click();
  await page
    .getByLabel('Element text', { exact: true })
    .fill('A better question.\nA clearer answer.');
  await page.getByLabel('Text color', { exact: true }).fill('#423365');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue(
    'Browser workflow test',
  );
  await page.locator('.layers-list button').filter({ hasText: 'A better question.' }).click();
  await expect(page.getByLabel('Element text', { exact: true })).toContainText(
    'A better question.',
  );
  await page.screenshot({ path: testInfo.outputPath('editor.png'), fullPage: true });
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const pngPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const png = await pngPromise;
  const pngPath = testInfo.outputPath('single.png');
  await png.saveAs(pngPath);
  const bytes = await readFile(pngPath);
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1080);
  await page.getByRole('button', { name: 'Write & create' }).click();
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.getByLabel('Number of slides').selectOption('5');
  await page.getByRole('button', { name: 'Generate Design', exact: true }).click();
  await expect(page.locator('.page-thumbnail')).toHaveCount(5);
  await page.getByRole('button', { name: 'Move page right', exact: true }).click();
  await expect(page.locator('.page-thumbnail.active')).toContainText('02');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('File format').selectOption('zip');
  const zipPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const zip = await zipPromise;
  const zipPath = testInfo.outputPath('carousel.zip');
  await zip.saveAs(zipPath);
  const contents = await JSZip.loadAsync(await readFile(zipPath));
  expect(Object.keys(contents.files)).toEqual(['01.png', '02.png', '03.png', '04.png', '05.png']);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('File format').selectOption('pdf');
  const pdfPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const pdf = await pdfPromise;
  const pdfPath = testInfo.outputPath('carousel.pdf');
  await pdf.saveAs(pdfPath);
  expect((await readFile(pdfPath)).subarray(0, 5).toString()).toBe('%PDF-');
  await page.getByRole('button', { name: 'Reel studio', exact: true }).click();
  await page.getByRole('button', { name: 'Convert to vertical 9:16' }).click();
  for (let i = 0; i < 5; i++) {
    await page.locator('.page-thumbnail').nth(i).click();
    await page.getByLabel('Slide duration', { exact: true }).fill('1');
  }
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('File format').selectOption('webm');
  await page.getByLabel('Output width (px)').fill('360');
  const videoPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const video = await videoPromise;
  const videoPath = testInfo.outputPath('reel.webm');
  await video.saveAs(videoPath);
  const videoBytes = await readFile(videoPath);
  expect(videoBytes.subarray(0, 4).toString('hex')).toBe('1a45dfa3');
  expect(videoBytes.length).toBeGreaterThan(5000);
  expect(errors).toEqual([]);
});
test('editable equations render to a real PNG and brand kits apply', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Instagram Post', exact: false }).click();
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByRole('button', { name: 'Add an equation' }).click();
  await page.getByLabel('LaTeX expression').fill('\\int_0^1 x^2 \\,dx = \\frac{1}{3}');
  await page.getByRole('button', { name: 'Add to design' }).click();
  await expect(page.getByRole('button', { name: 'Edit equation' })).toBeVisible();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const pngPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const png = await pngPromise;
  await png.saveAs(testInfo.outputPath('equation.png'));
  await page.getByRole('button', { name: 'Brand kit', exact: true }).click();
  await page
    .locator('.editor-brands>div')
    .filter({ hasText: 'GUIDE' })
    .getByRole('button', { name: 'Apply Brand Kit', exact: true })
    .click();
  await expect(page.locator('.layers-list')).toContainText('RESEARCH WITH PURPOSE.');
  expect(errors).toEqual([]);
});
test('canvas dragging, undo, JSON portability, and video audio playback', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Instagram Post', exact: false }).click();
  await page.getByRole('button', { name: 'Shapes', exact: true }).click();
  await page.getByRole('button', { name: 'Rectangle', exact: true }).click();
  const canvas = page.locator('.canvas-wrap .design-canvas');
  const bounds = (await canvas.boundingBox())!;
  const scale = bounds.width / 1080;
  const before = Number(await page.getByLabel('X position', { exact: true }).inputValue());
  await page.mouse.move(bounds.x + 180 * scale, bounds.y + 180 * scale);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 300 * scale, bounds.y + 210 * scale, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => Number(await page.getByLabel('X position', { exact: true }).inputValue()))
    .toBeGreaterThan(before + 50);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.locator('.layers-list button').filter({ hasText: 'rect' }).first().click();
  await expect(page.getByLabel('X position', { exact: true })).toHaveValue(String(before));
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('File format').selectOption('json');
  const jsonPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const json = await jsonPromise;
  const jsonPath = testInfo.outputPath('backup.json');
  await json.saveAs(jsonPath);
  await page.getByRole('button', { name: 'Back to workspace' }).click();
  await page.getByRole('button', { name: 'My projects', exact: false }).click();
  await page.locator('input[type=file][accept=".json,application/json"]').setInputFiles(jsonPath);
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue('Instagram Post');
  await page.getByRole('button', { name: 'Reel studio', exact: true }).click();
  await page.getByRole('button', { name: 'Convert to vertical 9:16' }).click();
  await page.getByLabel('Slide duration', { exact: true }).fill('1');
  const samples = 8000;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + samples * 2, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    wav.writeInt16LE(Math.round(Math.sin((i * 2 * Math.PI * 440) / 8000) * 3000), 44 + i * 2);
  await page
    .locator('input[type=file][accept="audio/*"]')
    .setInputFiles({ name: 'test-tone.wav', mimeType: 'audio/wav', buffer: wav });
  await expect(page.getByRole('button', { name: 'Remove audio' })).toBeVisible();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('File format').selectOption('webm');
  await page.getByLabel('Output width (px)').fill('360');
  const videoPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const video = await videoPromise;
  const path = testInfo.outputPath('with-audio.webm');
  await video.saveAs(path);
  const encoded = (await readFile(path)).toString('base64');
  const result = await page.evaluate(async (data) => {
    const video = document.createElement('video');
    video.muted = true;
    video.src = `data:video/webm;base64,${data}`;
    document.body.appendChild(video);
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Exported WebM is not playable'));
    });
    await video.play();
    const stream = (
      video as HTMLVideoElement & { captureStream: () => MediaStream }
    ).captureStream();
    const result = {
      width: video.videoWidth,
      height: video.videoHeight,
      audioTracks: stream.getAudioTracks().length,
    };
    video.pause();
    video.remove();
    stream.getTracks().forEach((track) => track.stop());
    return result;
  }, encoded);
  expect(result).toEqual({ width: 360, height: 640, audioTracks: 1 });
});
