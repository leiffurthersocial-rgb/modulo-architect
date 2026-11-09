import { describe, expect, it } from 'vitest';
import { createProject } from './defaults';
import { decodeShare, encodeShare, parseProject, projectFileName, serializeProject } from './io';
import { migrateProject } from './migrations';
import { addWall, syncRooms } from '../geometry/graph';

function sample() {
  const p = createProject('Two Bed House');
  const l = p.building.levels[0]!;
  const props = { thickness: 0.2, height: null, materials: { left: 'paint-white', right: 'paint-white' } };
  addWall(l, { x: 0, y: 0 }, { x: 5, y: 0 }, props);
  addWall(l, { x: 5, y: 0 }, { x: 5, y: 4 }, props);
  addWall(l, { x: 5, y: 4 }, { x: 0, y: 4 }, props);
  addWall(l, { x: 0, y: 4 }, { x: 0, y: 0 }, props);
  syncRooms(l, { floorMaterial: 'floor-oak', ceilingMaterial: 'paint-white' });
  return p;
}

describe('project io', () => {
  it('round-trips through JSON export/import', () => {
    const p = sample();
    const res = parseProject(serializeProject(p));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.project).toEqual(p);
  });

  it('rejects invalid files with a readable error', () => {
    expect(parseProject('{nope').ok).toBe(false);
    const res = parseProject(JSON.stringify({ schemaVersion: 1, id: 'x' }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Invalid project/);
  });

  it('refuses newer schema versions', () => {
    const res = migrateProject({ schemaVersion: 999 });
    expect(res.ok).toBe(false);
  });

  it('migrates v0 documents', () => {
    const p = sample();
    const v0: Record<string, unknown> = JSON.parse(serializeProject(p));
    delete v0.schemaVersion;
    delete v0.settings;
    const ext = v0.exterior as Record<string, unknown>;
    delete ext.sun;
    const lvl = (v0.building as { levels: { rooms: Record<string, unknown>[] }[] }).levels[0]!;
    lvl.rooms = lvl.rooms.map(({ name, ...r }) => ({ ...r, label: name }));
    const res = migrateProject(v0);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.migrated).toBe(true);
      expect(res.project.settings.units).toBe('metric');
      expect(res.project.building.levels[0]!.rooms[0]!.name).toBe('Room 1');
    }
  });

  it('builds a filename', () => {
    expect(projectFileName(sample())).toBe('two-bed-house.modulo.json');
  });

  it('round-trips share tokens', async () => {
    const p = sample();
    const token = await encodeShare(p);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    const res = await decodeShare(token);
    expect(res.ok && res.project).toEqual(p);
    expect((await decodeShare('garbage!!')).ok).toBe(false);
  });
});
