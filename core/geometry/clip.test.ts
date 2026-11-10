import { describe, expect, it } from 'vitest';
import { produce } from 'immer';
import { regionArea, subtract } from './clip';
import { rectPolygon } from './polygon';
import { createProject } from '../model/defaults';
import * as ops from '../model/ops';
import { floorVoids, stairOpenings } from '../model/voids';
import { roomPolygon } from './graph';
import { createFromTemplate } from '../templates';

const sq = (x0: number, y0: number, x1: number, y1: number) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

describe('floor cutting', () => {
  it('cuts a hole fully inside', () => {
    const r = subtract(sq(0, 0, 4, 4), [sq(1, 1, 2, 3)]);
    expect(r).toHaveLength(1);
    expect(r[0]!.holes).toHaveLength(1);
    expect(regionArea(r[0]!)).toBeCloseTo(14);
  });

  it('cuts an opening that only partly overlaps (e.g. crossing a wall)', () => {
    const r = subtract(sq(0, 0, 4, 4), [sq(3, 1, 6, 2)]);
    expect(r.reduce((a, x) => a + regionArea(x), 0)).toBeCloseTo(15);
    expect(r[0]!.holes).toHaveLength(0);
  });

  it('leaves untouched floors whole and handles full removal', () => {
    expect(subtract(sq(0, 0, 2, 2), [sq(5, 5, 6, 6)]).reduce((a, x) => a + regionArea(x), 0)).toBeCloseTo(4);
    expect(subtract(sq(1, 1, 2, 2), [sq(0, 0, 3, 3)])).toHaveLength(0);
  });

  it('a stair straddling two upstairs rooms opens both floors', () => {
    let p = createProject();
    const lid = p.building.levels[0]!.id;
    p = produce(p, (d) => {
      ops.addRectRoom(d, lid, 0, 0, 4, 4, 'A');
      ops.addRectRoom(d, lid, 4, 0, 4, 4, 'B');
      ops.addLevel(d, { copyWalls: true });
      // Runs along x across the dividing wall at x = 4.
      ops.addStair(d, lid, {
        type: 'straight',
        x: 4,
        y: 2,
        rotation: Math.PI / 2,
        width: 1,
        length: 3,
        length2: 1.6,
        turn: 'left',
        rise: null,
        opening: true,
        material: 'floor-oak',
      });
    });
    const up = p.building.levels[1]!;
    const voids = floorVoids(p, up);
    expect(voids).toHaveLength(1);
    const cut = up.rooms.map((r) =>
      subtract(roomPolygon(up, r), voids).reduce((a, x) => a + regionArea(x), 0),
    );
    expect(cut[0]).toBeCloseTo(16 - 1.5);
    expect(cut[1]).toBeCloseTo(16 - 1.5);
  });

  it('respects the per-stair opening toggle and partial rises', () => {
    const p = createFromTemplate('two-storey');
    const g = p.building.levels[0]!;
    expect(stairOpenings(g)).toHaveLength(1);
    const closed = produce(p, (d) => void (d.building.levels[0]!.stairs[0]!.opening = false));
    expect(stairOpenings(closed.building.levels[0]!)).toHaveLength(0);
    const short = produce(p, (d) => void (d.building.levels[0]!.stairs[0]!.rise = 1.2));
    expect(stairOpenings(short.building.levels[0]!)).toHaveLength(0);
    void rectPolygon;
  });
});
