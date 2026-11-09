import { describe, expect, it } from 'vitest';
import { allElements, allOpenings, defaultParams, getElement, searchElements } from './index';
import { getMaterial, MATERIALS } from './materials';

describe('element registry', () => {
  it('ships a full catalog with unique ids', () => {
    const furniture = allElements().filter((e) => e.kind === 'furniture');
    expect(furniture.length).toBeGreaterThanOrEqual(30);
    const ids = allElements().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getElement('outdoor-shower')).toBeDefined();
  });

  it('every element builds valid parts with resolvable materials', () => {
    for (const def of allElements()) {
      const parts = def.build({ size: def.size, params: defaultParams(def) });
      expect(parts.length, def.id).toBeGreaterThan(0);
      for (const p of parts) {
        expect(p.position.every(Number.isFinite), def.id).toBe(true);
        const slot = def.slots[p.material];
        const matId = slot ? slot.default : p.material;
        expect(getMaterial(matId).id, `${def.id}:${p.material}`).not.toBe('fallback');
      }
      for (const slot of Object.values(def.slots)) expect(MATERIALS.some((m) => m.id === slot.default)).toBe(true);
    }
  });

  it('every opening builds at its defaults and open', () => {
    for (const def of allOpenings()) {
      for (const open of [0, 1]) {
        const parts = def.build({ ...def.defaults, thickness: 0.2, params: { ...defaultParams(def), open } });
        expect(parts.length).toBeGreaterThan(0);
        expect(parts.every((p) => p.position.every(Number.isFinite))).toBe(true);
      }
    }
  });

  it('searches by name and tags', () => {
    expect(searchElements('couch').map((e) => e.id)).toContain('sofa');
    expect(searchElements('shower', 'outdoor').map((e) => e.id)).toEqual(['outdoor-shower']);
  });
});
