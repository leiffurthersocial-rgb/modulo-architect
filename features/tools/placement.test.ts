import { describe, expect, it } from 'vitest';
import { produce } from 'immer';
import { createProject } from '@/core/model/defaults';
import * as ops from '@/core/model/ops';
import { placeOpening, pointedWall } from './placement';

describe('opening placement', () => {
  // Two parallel walls 1 m apart: y = 0 (front) and y = 1 (behind it).
  let p = createProject();
  const lid = p.building.levels[0]!.id;
  p = produce(p, (d) => {
    ops.addWallChain(d, lid, [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ]);
    ops.addWallChain(d, lid, [
      { x: 0, y: 1 },
      { x: 4, y: 1 },
    ]);
  });
  const level = p.building.levels[0]!;
  const front = level.walls.find((w) => level.nodes.find((n) => n.id === w.a)!.y === 0)!;
  const back = level.walls.find((w) => w.id !== front.id)!;
  const opts = { step: 0.1, disabled: false, radius: 0.3 };

  it('without a pointed wall, the nearest wall to the floor point wins', () => {
    // A 3D ray aimed at the front wall's face above the floor meets the floor behind it, near the back wall.
    const pl = placeOpening({ x: 2, y: 0.9 }, 0.9, level, opts)!;
    expect(pl.wallId).toBe(back.id);
  });

  it('the wall under the cursor wins over a nearer wall behind it', () => {
    const pointed = pointedWall(level, front.id, { x: 2, y: 0.1 });
    const pl = placeOpening(pointed!.point, 0.9, level, { ...opts, preferWallId: pointed!.wallId })!;
    expect(pl.wallId).toBe(front.id);
    expect(pl.offset).toBeCloseTo(2);
  });
});
