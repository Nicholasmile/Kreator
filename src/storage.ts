import { openDB } from 'idb';
import { presets, type Project, type Brand } from './model';
const database = () =>
  openDB('kreator-studio', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects'))
        db.createObjectStore('projects', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('brands'))
        db.createObjectStore('brands', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
    },
  });
export const listProjects = async (): Promise<Project[]> =>
  (await (await database()).getAll('projects')).sort((a, b) => b.updatedAt - a.updatedAt);
export const saveProject = async (project: Project) => (await database()).put('projects', project);
export const deleteProject = async (id: string) => (await database()).delete('projects', id);
export const listBrands = async (): Promise<Brand[]> => (await database()).getAll('brands');
export async function initializeBrands(): Promise<Brand[]> {
  const db = await database();
  const tx = db.transaction(['brands', 'settings'], 'readwrite');
  if (!(await tx.objectStore('settings').get('brandsInitialized'))) {
    if (!(await tx.objectStore('brands').count()))
      for (const brand of presets) await tx.objectStore('brands').put(brand);
    await tx.objectStore('settings').put(true, 'brandsInitialized');
  }
  await tx.done;
  return db.getAll('brands');
}
export const saveBrand = async (brand: Brand) => (await database()).put('brands', brand);
export const deleteBrand = async (id: string) => (await database()).delete('brands', id);
