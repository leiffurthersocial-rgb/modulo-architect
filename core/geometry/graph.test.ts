import { describe, expect, it } from 'vitest';
import { createLevel } from '@/core/model/defaults';
import { addWall, detectFaces, removeWall, roomArea, splitWall, syncRooms, roomPolygon } from './graph';
import { area } from './polygon';
import type { Level } from '@/core/model/schema';

const props = { thickness: 0.2, height: null, materials: { left: 'a', right: 'b' } };
const defaults = { floorMaterial: 'f', ceilingMaterial: 'c' };

function rect(level: Level, x: number, y: number, w: number, h: number) {
  addWall(level, { x, y }, { x: x + w, y }, props);
  addWall(level, { x: x + w, y }, { x: x + w, y: y + h }, props);
  addWall(level, { x: x + w, y: y + h }, { x, y: y + h }, props);
  addWall(level, { x, y: y + h }, { x, y }, props);
}

describe('wall graph', () => {
  it('shares nodes at coincident endpoints', () => {
    const l = createLevel(0, 0);
    rect(l, 0, 0, 4, 3);
    expect(l.nodes).toHaveLength(4);
    expect(l.walls).toHaveLength(4);
  });

  it('detects a room from a closed loop', () => {
    const l = createLevel(0, 0);
    rect(l, 0, 0, 4, 3);
    const faces = detectFaces(l);
    expect(faces).toHaveLength(1);
    syncRooms(l, defaults);
    expect(l.rooms).toHaveLength(1);
    expect(area(roomPolygon(l, l.rooms[0]!))).toBeCloseTo(12);
  });

  it('ignores open chains and dangling walls', () => {
    const l = createLevel(0, 0);
    addWall(l, { x: 0, y: 0 }, { x: 4, y: 0 }, props);
    addWall(l, { x: 4, y: 0 }, { x: 4, y: 3 }, props);
    expect(detectFaces(l)).toHaveLength(0);
    rect(l, 10, 0, 3, 3);
    addWall(l, { x: 11, y: 1 }, { x: 11.5, y: 1.5 }, props);
    expect(detectFaces(l)).toHaveLength(1);
  });

  it('splits a room when a wall crosses it, inheriting properties', () => {
    const l = createLevel(0, 0);
    rect(l, 0, 0, 6, 4);
    syncRooms(l, defaults);
    l.rooms[0]!.name = 'Living';
    addWall(l, { x: 3, y: 0 }, { x: 3, y: 4 }, props);
    expect(l.walls).toHaveLength(7);
    syncRooms(l, defaults);
    expect(l.rooms).toHaveLength(2);
    expect(l.rooms.map((r) => r.name).sort()).toEqual(['Living', 'Living 2']);
    const areas = l.rooms.map((r) => area(roomPolygon(l, r))).sort();
    expect(areas[0]).toBeCloseTo(12);
    expect(areas[1]).toBeCloseTo(12);
  });

  it('splits walls at crossings', () => {
    const l = createLevel(0, 0);
    addWall(l, { x: 0, y: 0 }, { x: 4, y: 0 }, props);
    addWall(l, { x: 2, y: -2 }, { x: 2, y: 2 }, props);
    expect(l.walls).toHaveLength(4);
    expect(l.nodes).toHaveLength(5);
  });

  it('merges rooms when the shared wall is removed and heals collinear walls', () => {
    const l = createLevel(0, 0);
    rect(l, 0, 0, 6, 4);
    addWall(l, { x: 3, y: 0 }, { x: 3, y: 4 }, props);
    syncRooms(l, defaults);
    const divider = l.walls.find((w) => {
      const a = l.nodes.find((n) => n.id === w.a)!;
      const b = l.nodes.find((n) => n.id === w.b)!;
      return a.x === 3 && b.x === 3;
    })!;
    removeWall(l, divider.id);
    syncRooms(l, defaults);
    expect(l.rooms).toHaveLength(1);
    expect(l.walls).toHaveLength(4);
    expect(area(roomPolygon(l, l.rooms[0]!))).toBeCloseTo(24);
  });

  it('keeps openings on the right piece when splitting a wall', () => {
    const l = createLevel(0, 0);
    addWall(l, { x: 0, y: 0 }, { x: 10, y: 0 }, props);
    const w = l.walls[0]!;
    l.openings.push({
      id: 'o1',
      type: 'door',
      wallId: w.id,
      offset: 8,
      width: 0.9,
      height: 2,
      sill: 0,
      flip: false,
      mirror: false,
      params: {},
    });
    splitWall(l, w.id, { x: 5, y: 0 });
    const o = l.openings[0]!;
    expect(o.wallId).not.toBe(w.id);
    expect(o.offset).toBeCloseTo(3);
  });

  it('moving a node updates room geometry', () => {
    const l = createLevel(0, 0);
    rect(l, 0, 0, 4, 3);
    syncRooms(l, defaults);
    const n = l.nodes.find((x) => x.x === 4 && x.y === 3)!;
    const n2 = l.nodes.find((x) => x.x === 4 && x.y === 0)!;
    n.x = 5;
    n2.x = 5;
    expect(area(roomPolygon(l, l.rooms[0]!))).toBeCloseTo(15);
    // Net area subtracts half the wall thickness along the perimeter.
    expect(roomArea(l, l.rooms[0]!)).toBeCloseTo(15 - 16 * 0.1);
  });
});
