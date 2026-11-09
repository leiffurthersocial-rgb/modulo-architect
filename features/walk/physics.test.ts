import { describe, expect, it } from 'vitest';
import { createFromTemplate } from '@/core/templates';
import { buildWalkWorld, collide, groundHeight, spawnPoint } from './physics';

describe('walk physics', () => {
  const p = createFromTemplate('two-storey');
  const world = buildWalkWorld(p);

  it('builds obstacles and surfaces', () => {
    expect(world.obstacles.length).toBeGreaterThan(10);
    expect(world.surfaces.length).toBeGreaterThan(4);
    expect(world.stairs.length).toBe(1);
  });

  it('cannot walk through a wall', () => {
    // Ground-floor west wall at x = -4.5, between y = -3.5 and 3.5 (window at y = 0 is above the body).
    const q = collide(world, { x: -4.5, y: -2.5 }, 0);
    expect(Math.abs(q.x + 4.5)).toBeGreaterThan(0.3);
  });

  it('passes through a door opening', () => {
    // Front door centred at x = -2.9 on the south wall y = 3.5.
    const q = collide(world, { x: -2.9, y: 3.5 }, 0);
    expect(q.x).toBeCloseTo(-2.9, 1);
    expect(q.y).toBeCloseTo(3.5, 1);
  });

  it('climbs the stairs to the upper floor', () => {
    const s = p.building.levels[0]!.stairs[0]!;
    // Climb towards local -z, which is +x for rotation π/2.
    let feet = 0;
    for (let x = s.x - 1.55; x <= s.x + 1.55; x += 0.05) feet = groundHeight(world, { x, y: s.y }, feet);
    expect(feet).toBeCloseTo(2.8, 1);
    // Standing on the upper floor away from the stair hole.
    expect(groundHeight(world, { x: -2, y: 2 }, 2.8)).toBeCloseTo(2.8);
    // Above the stair void we drop onto the stair, not float on the slab.
    expect(groundHeight(world, { x: s.x - 1.0, y: s.y }, 2.8)).toBeLessThan(2.8);
  });

  it('spawns outside facing the house', () => {
    const sp = spawnPoint(p);
    expect(Math.hypot(sp.p.x, sp.p.y)).toBeGreaterThan(3);
  });
});
