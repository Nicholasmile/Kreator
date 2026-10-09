import { create } from 'zustand';
import type { Project, Page, DesignElement } from './model';
import { uid } from './model';
interface EditorStore {
  project: Project | null;
  pageIndex: number;
  selected: string | null;
  past: Project[];
  future: Project[];
  revision: number;
  open: (project: Project) => void;
  commit: (update: (p: Project) => Project) => void;
  updatePage: (update: (page: Page) => Page) => void;
  patchElement: (id: string, patch: Partial<DesignElement>) => void;
  select: (id: string | null) => void;
  setPage: (index: number) => void;
  undo: () => void;
  redo: () => void;
  duplicatePage: () => void;
  removePage: () => void;
  movePage: (direction: number) => void;
}
export const useEditor = create<EditorStore>((set, get) => ({
  project: null,
  pageIndex: 0,
  selected: null,
  past: [],
  future: [],
  revision: 0,
  open: (project) =>
    set({ project, pageIndex: 0, selected: null, past: [], future: [], revision: 0 }),
  commit: (update) => {
    const { project, past, revision } = get();
    if (project) {
      const next = update(project);
      next.pages = next.pages.map((page, i) => ({
        ...page,
        elements: page.elements.map((e) =>
          e.role === 'pageNumber' ? { ...e, text: `${i + 1} / ${next.pages.length}` } : e,
        ),
      }));
      set({
        project: { ...next, updatedAt: Date.now() },
        past: [...past.slice(-49), project],
        future: [],
        revision: revision + 1,
      });
    }
  },
  updatePage: (update) =>
    get().commit((p) => ({
      ...p,
      pages: p.pages.map((page, i) => (i === get().pageIndex ? update(page) : page)),
    })),
  patchElement: (id, patch) =>
    get().updatePage((p) => ({
      ...p,
      elements: p.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  select: (selected) => set({ selected }),
  setPage: (pageIndex) => set({ pageIndex, selected: null }),
  undo: () => {
    const { past, project, future, pageIndex, revision } = get();
    if (past.length && project) {
      const prev = past[past.length - 1];
      set({
        project: prev,
        past: past.slice(0, -1),
        future: [project, ...future],
        pageIndex: Math.min(pageIndex, prev.pages.length - 1),
        selected: null,
        revision: revision + 1,
      });
    }
  },
  redo: () => {
    const { past, project, future, pageIndex, revision } = get();
    if (future.length && project)
      set({
        project: future[0],
        past: [...past, project],
        future: future.slice(1),
        pageIndex: Math.min(pageIndex, future[0].pages.length - 1),
        selected: null,
        revision: revision + 1,
      });
  },
  duplicatePage: () => {
    const { project, pageIndex } = get();
    if (!project) return;
    const page = structuredClone(project.pages[pageIndex]);
    page.id = uid();
    page.elements.forEach((e) => (e.id = uid()));
    get().commit((p) => ({
      ...p,
      pages: [...p.pages.slice(0, pageIndex + 1), page, ...p.pages.slice(pageIndex + 1)],
    }));
    get().setPage(pageIndex + 1);
  },
  removePage: () => {
    const { project, pageIndex } = get();
    if (!project || project.pages.length === 1) return;
    get().commit((p) => ({ ...p, pages: p.pages.filter((_, i) => i !== pageIndex) }));
    get().setPage(Math.max(0, pageIndex - 1));
  },
  movePage: (direction) => {
    const { project, pageIndex } = get();
    if (!project) return;
    const target = pageIndex + direction;
    if (target < 0 || target >= project.pages.length) return;
    get().commit((p) => {
      const pages = [...p.pages];
      [pages[pageIndex], pages[target]] = [pages[target], pages[pageIndex]];
      return { ...p, pages };
    });
    get().setPage(target);
  },
}));
