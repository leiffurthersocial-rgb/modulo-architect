import { describe, expect, it } from 'vitest';
import { ENVIRONMENTS, getEnvironment } from '@/registry/environments';
import { createProject } from './model/defaults';
import { isWalkable, neighbours, plotFrame, scatterItems } from './environment';
import { pointInPolygon } from './geometry/polygon';
import { getElement } from '@/registry';
import { getMaterial } from '@/registry/materials';

describe('environment presets', () => {
  const site = createProject().site;

  it('reference valid elements and materials', () => {
    for (const e of ENVIRONMENTS) {
      for (const s of e.scatter) expect(getElement(s.element), `${e.id}:${s.element}`).toBeDefined();
      for (const m of [
        e.ground,
        e.suggest.terrain,
        e.coast?.water,
        e.coast?.rock,
        e.coast?.edge,
        e.lake?.water,
        e.lake?.shore,
        ...(e.hills ?? []).map((h) => h.material),
      ])
        if (m) expect(getMaterial(m).id, `${e.id}:${m}`).not.toBe('fallback');
    }
  });

  it('scatters deterministically and never on the plot', () => {
    for (const e of ENVIRONMENTS) {
      const a = scatterItems(e, site);
      const b = scatterItems(e, site);
      expect(a).toEqual(b);
      for (const it of a)
        expect(pointInPolygon({ x: it.x, y: it.y }, site.plot), `${e.id} ${it.type}`).toBe(false);
    }
    expect(scatterItems(getEnvironment('alpine'), site).length).toBeGreaterThan(150);
  });

  it('keeps vegetation out of the sea and walkers off the cliff', () => {
    const cliff = getEnvironment('cliffside');
    const f = plotFrame(site);
    for (const it of scatterItems(cliff, site))
      if (it.type !== 'boulder') expect(it.y).toBeLessThan(f.maxY + 14);
    expect(isWalkable(cliff, site, { x: 0, y: f.maxY + 5 })).toBe(true);
    expect(isWalkable(cliff, site, { x: 0, y: f.maxY + 30 })).toBe(false);
    expect(isWalkable(getEnvironment('plain'), site, { x: 0, y: 500 })).toBe(true);
  });

  it('lines the suburban street with neighbours', () => {
    expect(neighbours(getEnvironment('suburban'), plotFrame(site)).length).toBeGreaterThanOrEqual(6);
  });
});
