import { openDB } from 'idb';
import { presets, upgradeProject, parseProject, uid, type Project, type Brand } from './model';
import { normalizeContent, type ContentItem, type Asset } from './studio/types';
const database = () =>
  openDB('kreator-studio', 3, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects'))
        db.createObjectStore('projects', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('brands'))
        db.createObjectStore('brands', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
      if (!db.objectStoreNames.contains('content'))
        db.createObjectStore('content', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('assets'))
        db.createObjectStore('assets', { keyPath: 'id' });
    },
    blocking(_current, _blocked, event) {
      (event.target as IDBDatabase).close();
    },
  });
export const listProjects = async (): Promise<Project[]> =>
  (await (await database()).getAll('projects'))
    .map(upgradeProject)
    .sort((a, b) => b.updatedAt - a.updatedAt);
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
  if (!(await tx.objectStore('settings').get('personalBrandV2'))) {
    if (!(await tx.objectStore('brands').get('malik-kolade')))
      await tx.objectStore('brands').put(presets[0]);
    await tx.objectStore('settings').put(true, 'personalBrandV2');
  }
  await tx.done;
  return db.getAll('brands');
}
export const saveBrand = async (brand: Brand) => (await database()).put('brands', brand);
export const deleteBrand = async (id: string) => (await database()).delete('brands', id);
export const listContent = async (): Promise<ContentItem[]> =>
  (await (await database()).getAll('content')).sort((a, b) => b.updatedAt - a.updatedAt);
export const saveContent = async (item: ContentItem) => (await database()).put('content', item);
export const removeContent = async (id: string) => (await database()).delete('content', id);
export const listAssets = async (): Promise<Asset[]> => (await database()).getAll('assets');
export const saveAsset = async (asset: Asset) => (await database()).put('assets', asset);
export const removeAsset = async (id: string) => (await database()).delete('assets', id);
export const getSetting = async <T>(key: string, fallback: T): Promise<T> =>
  (await (await database()).get('settings', key)) ?? fallback;
export const putSetting = async (key: string, value: unknown) =>
  (await database()).put('settings', value, key);
export async function backupWorkspace() {
  const db = await database();
  return {
    kind: 'kreator-workspace',
    version: 2,
    createdAt: Date.now(),
    projects: await listProjects(),
    brands: await db.getAll('brands'),
    content: await db.getAll('content'),
    assets: await db.getAll('assets'),
  };
}
export async function restoreWorkspace(raw: string) {
  const data = JSON.parse(raw);
  if (
    data.kind !== 'kreator-workspace' ||
    data.version !== 2 ||
    ![data.projects, data.brands, data.content, data.assets].every(Array.isArray)
  )
    throw new Error('Unsupported workspace backup.');
  const map = new Map<string, string>();
  const projects: Project[] = data.projects.map((p: Project) => {
    const next = parseProject(JSON.stringify(p));
    map.set(p.id, next.id);
    return next;
  });
  for (const brand of data.brands)
    if (
      typeof brand.name !== 'string' ||
      !['primary', 'secondary', 'accent'].every((k) => /^#[0-9a-f]{6}$/i.test(brand[k])) ||
      [brand.logo, brand.profilePhoto].some(
        (src) => src && !/^data:image\/(png|jpeg|webp);base64,/.test(src),
      )
    )
      throw new Error('Invalid brand backup.');
  for (const item of data.content)
    if (
      typeof item.title !== 'string' ||
      typeof item.markdown !== 'string' ||
      !item.details ||
      !Array.isArray(item.projectIds)
    )
      throw new Error('Invalid content backup.');
  for (const asset of data.assets)
    if (typeof asset.name !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(asset.src))
      throw new Error('Invalid asset backup.');
  const db = await database(),
    tx = db.transaction(['projects', 'brands', 'content', 'assets'], 'readwrite');
  const brandMap = new Map<string, string>();
  for (const b of data.brands) {
    const id = uid();
    brandMap.set(b.id, id);
    await tx.objectStore('brands').put({ ...b, id });
  }
  for (const p of projects)
    await tx
      .objectStore('projects')
      .put({ ...p, brandId: brandMap.get(p.brandId || ''), parentId: map.get(p.parentId || '') });
  for (const item of data.content)
    await tx.objectStore('content').put({
      ...item,
      id: uid(),
      details: normalizeContent(item.details),
      history: Array.isArray(item.history)
        ? item.history.filter(
            (h: { at: unknown; note: unknown }) =>
              typeof h.at === 'number' && typeof h.note === 'string',
          )
        : [],
      exports: Array.isArray(item.exports)
        ? item.exports.filter(
            (e: { at: unknown; name: unknown }) =>
              typeof e.at === 'number' && typeof e.name === 'string',
          )
        : [],
      projectIds: item.projectIds.map((id: string) => map.get(id)).filter(Boolean),
    });
  for (const asset of data.assets) await tx.objectStore('assets').put({ ...asset, id: uid() });
  await tx.done;
  return projects.length;
}
