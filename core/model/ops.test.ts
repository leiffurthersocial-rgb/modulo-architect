import { describe, expect, it } from 'vitest';
import { produce } from 'immer';
import { createProject } from './defaults';
import * as ops from './ops';
import { roomArea, roomPolygon } from '../geometry/graph';
import { area } from '../geometry/polygon';

describe('ops', () => {
  it('adds a rectangular room and resizes it', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    let roomId: string | null = null;
    p = produce(p, (d) => {
      roomId = ops.addRectRoom(d, lid, 0, 0, 4, 3, 'Bedroom');
    });
    const l = p.building.levels[0]!;
    expect(l.rooms[0]!.name).toBe('Bedroom');
    p = produce(p, (d) => ops.resizeRoom(d, lid, roomId!, 'x', 5));
    expect(area(roomPolygon(p.building.levels[0]!, p.building.levels[0]!.rooms[0]!))).toBeCloseTo(15);
  });

  it('adjacent rooms share a wall and resize together', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => {
      ops.addRectRoom(d, lid, 0, 0, 4, 3, 'A');
      ops.addRectRoom(d, lid, 4, 0, 3, 3, 'B');
    });
    const l = p.building.levels[0]!;
    expect(l.rooms).toHaveLength(2);
    expect(l.walls).toHaveLength(7);
    const a = l.rooms.find((r) => r.name === 'A')!;
    p = produce(p, (d) => ops.resizeRoom(d, lid, a.id, 'x', 4.5));
    const l2 = p.building.levels[0]!;
    const areas = Object.fromEntries(l2.rooms.map((r) => [r.name, area(roomPolygon(l2, r))]));
    expect(areas.A).toBeCloseTo(13.5);
    expect(areas.B).toBeCloseTo(7.5);
    expect(roomArea(l2, l2.rooms[0]!)).toBeGreaterThan(0);
  });

  it('deleting a room keeps shared walls', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => {
      ops.addRectRoom(d, lid, 0, 0, 4, 3, 'A');
      ops.addRectRoom(d, lid, 4, 0, 3, 3, 'B');
    });
    const b = p.building.levels[0]!.rooms.find((r) => r.name === 'B')!;
    p = produce(p, (d) => ops.deleteEntities(d, [b.id], { roomWalls: true }));
    const l = p.building.levels[0]!;
    expect(l.rooms.map((r) => r.name)).toEqual(['A']);
    expect(l.walls).toHaveLength(4);
  });

  it('stacks levels and restacks when a floor height changes', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => {
      ops.addRectRoom(d, lid, 0, 0, 6, 5);
      ops.addLevel(d, { copyWalls: true });
      ops.addLevel(d);
    });
    expect(p.building.levels.map((l) => l.elevation)).toEqual([0, 2.8, 5.6]);
    expect(p.building.levels[1]!.rooms).toHaveLength(1);
    p = produce(p, (d) => ops.setLevelHeight(d, lid, 3.2));
    expect(p.building.levels.map((l) => +l.elevation.toFixed(3))).toEqual([0, 3.2, 6]);
  });

  it('fits an auto roof to the walls', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => {
      ops.addRectRoom(d, lid, 0, 0, 8, 6);
      ops.addRoof(d, lid, 'gable');
    });
    const r = p.building.roofs[0]!;
    expect(r.width).toBeCloseTo(8.2);
    expect(r.depth).toBeCloseTo(6.2);
    expect(r.x).toBeCloseTo(4);
  });

  it('sets wall length by moving the end node', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => {
      ops.addWallChain(d, lid, [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
      ]);
    });
    const w = p.building.levels[0]!.walls[0]!;
    p = produce(p, (d) => ops.setWallLength(d, w.id, 5.5));
    expect(ops.wallLength(p.building.levels[0]!, p.building.levels[0]!.walls[0]!)).toBeCloseTo(5.5);
  });

  it('Delete on a room removes only its floor', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => void ops.addRectRoom(d, lid, 0, 0, 4, 3, 'A'));
    const r = p.building.levels[0]!.rooms[0]!;
    p = produce(p, (d) => ops.deleteEntities(d, [r.id]));
    const l = p.building.levels[0]!;
    expect(l.rooms).toHaveLength(1);
    expect(l.rooms[0]!.floor).toBe(false);
    expect(l.walls).toHaveLength(4);
  });

  it('deleting a single wall keeps the other walls and the floor', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => void ops.addRectRoom(d, lid, 0, 0, 4, 3, 'A', 'floor-walnut'));
    const w = p.building.levels[0]!.walls[0]!;
    p = produce(p, (d) => ops.deleteEntities(d, [w.id]));
    const l = p.building.levels[0]!;
    expect(l.walls).toHaveLength(3);
    expect(l.rooms).toHaveLength(0);
    expect(l.slabs).toHaveLength(1);
    expect(l.slabs[0]!.material).toBe('floor-walnut');
  });

  it('removing a dividing wall merges rooms without leftover slabs', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => {
      ops.addRectRoom(d, lid, 0, 0, 4, 3, 'A');
      ops.addRectRoom(d, lid, 4, 0, 3, 3, 'B');
    });
    const l0 = p.building.levels[0]!;
    const divider = l0.walls.find((w) => {
      const a = l0.nodes.find((n) => n.id === w.a)!;
      const b = l0.nodes.find((n) => n.id === w.b)!;
      return a.x === 4 && b.x === 4;
    })!;
    p = produce(p, (d) => ops.deleteEntities(d, [divider.id]));
    const l = p.building.levels[0]!;
    expect(l.rooms).toHaveLength(1);
    expect(l.slabs).toHaveLength(0);
  });

  it('adds free-standing floor slabs', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    let id = '';
    p = produce(p, (d) => {
      id = ops.addSlab(d, lid, [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
      ]);
    });
    expect(p.building.levels[0]!.slabs.map((s) => s.id)).toEqual([id]);
    p = produce(p, (d) => ops.deleteEntities(d, [id]));
    expect(p.building.levels[0]!.slabs).toHaveLength(0);
  });
});
