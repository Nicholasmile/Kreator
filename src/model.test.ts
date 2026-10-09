import { describe, it, expect, beforeEach } from 'vitest';
import { newProject, element, parseProject, applyBrand, presets, resizeProject } from './model';
import { useEditor } from './store';
import { generatePages } from './layout';
import { templates } from './templates';
describe('project integrity', () => {
  it('round trips an editable project with a new import identity', () => {
    const p = newProject('Example');
    p.pages[0].elements = [element('text', { text: 'Hello' })];
    const copy = parseProject(JSON.stringify(p));
    expect(copy.id).not.toBe(p.id);
    expect(copy.pages[0].elements[0].text).toBe('Hello');
  });
  it('rejects oversized canvases and remote image sources', () => {
    const p = newProject('Unsafe', 100000, 1080);
    expect(() => parseProject(JSON.stringify(p))).toThrow();
    p.width = 1080;
    p.pages[0].elements = [element('image', { src: 'https://example.org/image.png' })];
    expect(() => parseProject(JSON.stringify(p))).toThrow();
  });
  it('scales geometry when converting to a reel', () => {
    const p = newProject('Post');
    p.pages[0].elements = [element('rect', { x: 108, y: 108, width: 200, height: 200 })];
    const reel = resizeProject(p, 1080, 1920);
    expect(reel.pages[0].elements[0].y).toBeCloseTo(192);
    expect(reel.pages[0].elements[0].width).toBe(200);
  });
  it('applies brands without accumulating watermarks', () => {
    const p = newProject('Brand');
    p.pages[0].elements = [element('text', { text: 'Heading', role: 'heading' })];
    const once = applyBrand(p, presets[0]),
      twice = applyBrand(once, presets[1]);
    expect(twice.pages[0].elements.filter((e) => e.role === 'watermark')).toHaveLength(1);
    expect(twice.pages[0].elements[0].fontFamily).toBe(presets[1].headingFont);
    expect(twice.pages[0].background).toBe(presets[1].secondary);
  });
});
describe('editor history and slide operations', () => {
  beforeEach(() =>
    useEditor
      .getState()
      .open(
        newProject(
          'Test',
          1080,
          1080,
          generatePages('Title\nFirst idea\nSecond idea\nThird idea', templates[0], 1080, 1080, 5),
        ),
      ),
  );
  it('supports undo and redo after text edits', () => {
    const s = useEditor.getState(),
      id = s.project!.pages[0].elements[0].id;
    s.patchElement(id, { text: 'Changed' });
    expect(useEditor.getState().project!.pages[0].elements[0].text).toBe('Changed');
    s.undo();
    expect(useEditor.getState().project!.pages[0].elements[0].text).not.toBe('Changed');
    s.redo();
    expect(useEditor.getState().project!.pages[0].elements[0].text).toBe('Changed');
  });
  it('reorders pages and updates visible numbering', () => {
    const s = useEditor.getState(),
      first = s.project!.pages[0].id;
    s.movePage(1);
    const result = useEditor.getState();
    expect(result.project!.pages[1].id).toBe(first);
    expect(result.project!.pages[1].elements.find((e) => e.role === 'pageNumber')?.text).toBe(
      '2 / 5',
    );
    expect(result.pageIndex).toBe(1);
  });
  it('duplicates without sharing element identities and never removes the final page', () => {
    const s = useEditor.getState(),
      original = s.project!.pages[0];
    s.duplicatePage();
    const copy = useEditor.getState().project!.pages[1];
    expect(copy.id).not.toBe(original.id);
    expect(copy.elements[0].id).not.toBe(original.elements[0].id);
    for (let i = 0; i < 10; i++) useEditor.getState().removePage();
    expect(useEditor.getState().project!.pages).toHaveLength(1);
  });
});
