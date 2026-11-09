import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createProject } from '@/core/model/defaults';
import { deleteProject, listProjects, loadProject, saveProject } from './persistence';

describe('persistence', () => {
  it('saves, lists, loads and deletes projects', async () => {
    const a = createProject('A');
    const b = { ...createProject('B'), updatedAt: a.updatedAt + 10 };
    await saveProject(a);
    await saveProject(b);
    const list = await listProjects();
    expect(list.map((m) => m.name)).toEqual(['B', 'A']);
    expect(await loadProject(a.id)).toEqual(a);
    await saveProject({ ...a, name: 'A2', updatedAt: b.updatedAt + 10 });
    expect((await listProjects()).map((m) => m.name)).toEqual(['A2', 'B']);
    await deleteProject(b.id);
    expect((await listProjects()).map((m) => m.name)).toEqual(['A2']);
    expect(await loadProject(b.id)).toBeNull();
  });
});
