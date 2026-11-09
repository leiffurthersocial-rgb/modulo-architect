import { createStore, del, get, set, type UseStore } from 'idb-keyval';
import type { Project } from '@/core/model/schema';
import { migrateProject } from '@/core/model/migrations';

/**
 * Local-first persistence in IndexedDB. Projects are stored whole (they are small JSON);
 * a separate index keeps the project list cheap to read.
 */
export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
}

let store: UseStore | null = null;
function db(): UseStore {
  if (!store) store = createStore('modulo-architect', 'projects');
  return store;
}

const INDEX = 'index';
const key = (id: string) => `project:${id}`;

export async function listProjects(): Promise<ProjectMeta[]> {
  const index = ((await get<ProjectMeta[]>(INDEX, db())) ?? []).slice();
  return index.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadProject(id: string): Promise<Project | null> {
  const raw = await get(key(id), db());
  if (!raw) return null;
  const res = migrateProject(raw);
  return res.ok ? res.project : null;
}

export async function saveProject(project: Project): Promise<void> {
  await set(key(project.id), project, db());
  const index = (await get<ProjectMeta[]>(INDEX, db())) ?? [];
  const meta: ProjectMeta = {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
  };
  const next = [meta, ...index.filter((m) => m.id !== project.id)];
  await set(INDEX, next, db());
}

export async function deleteProject(id: string): Promise<void> {
  await del(key(id), db());
  const index = (await get<ProjectMeta[]>(INDEX, db())) ?? [];
  await set(
    INDEX,
    index.filter((m) => m.id !== id),
    db(),
  );
}

/** Test hook: reset the cached store handle (fake-indexeddb). */
export function _resetStore() {
  store = null;
}
