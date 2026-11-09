import { describe, expect, it } from 'vitest';
import { produce } from 'immer';
import { createProject } from './defaults';
import * as ops from './ops';
import { doorClearance, itemFootprint, itemIssues } from './footprint';
import type { Item } from './schema';

const item = (id: string, x: number, y: number, type = 'armchair'): Item => ({
  id,
  type,
  x,
  y,
  z: 0,
  rotation: 0,
  size: { w: 0.85, d: 0.85, h: 0.8 },
  params: {},
  materials: {},
});

describe('footprints and placement checks', () => {
  it('rotates footprints', () => {
    const fp = itemFootprint({ ...item('a', 0, 0), rotation: Math.PI / 2, size: { w: 2, d: 1, h: 1 } });
    const xs = fp.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(1);
  });

  it('detects overlapping furniture but not flush neighbours', () => {
    const a = item('a', 0, 0);
    expect(itemIssues(null, [a, item('b', 0.5, 0)], a).map((i) => i.kind)).toEqual(['collision']);
    expect(itemIssues(null, [a, item('c', 0.85, 0)], a)).toEqual([]);
    expect(itemIssues(null, [a, item('rug', 0.2, 0, 'rug')], a)).toEqual([]);
  });

  it('warns when an item blocks a door swing', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => {
      ops.addRectRoom(d, lid, 0, 0, 4, 4);
      const l = d.building.levels[0]!;
      const wall = l.walls.find((w) => {
        const a = l.nodes.find((n) => n.id === w.a)!;
        const b = l.nodes.find((n) => n.id === w.b)!;
        return a.y === 0 && b.y === 0;
      })!;
      ops.addOpening(d, lid, {
        type: 'door-single',
        wallId: wall.id,
        offset: 2,
        width: 0.9,
        height: 2.1,
        sill: 0,
        flip: false,
        mirror: false,
        params: {},
      });
    });
    const l = p.building.levels[0]!;
    const zone = doorClearance(l, l.openings[0]!)!;
    expect(zone).toHaveLength(4);
    const ys = zone.map((q) => q.y);
    const inside = Math.max(...ys) > 0.5 ? 1 : -1;
    const blocker = item('x', 2, inside * 0.6);
    expect(itemIssues(l, [blocker], blocker).some((i) => i.kind === 'blocks-door')).toBe(true);
    const fine = item('y', 1, inside * 2.5);
    expect(itemIssues(l, [fine], fine)).toEqual([]);
  });
});
