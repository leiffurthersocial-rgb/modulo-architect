import { describe, expect, it } from 'vitest';
import { createFromTemplate, TEMPLATE_LIST } from './index';
import { ProjectSchema } from '../model/schema';

describe('templates', () => {
  for (const t of TEMPLATE_LIST) {
    it(`${t.id} produces a valid project`, () => {
      const p = createFromTemplate(t.id);
      expect(ProjectSchema.safeParse(p).success).toBe(true);
    });
  }
  it('two-bedroom has four rooms, doors and a roof', () => {
    const p = createFromTemplate('two-bedroom');
    const l = p.building.levels[0]!;
    expect(l.rooms).toHaveLength(4);
    expect(l.openings.filter((o) => o.type.startsWith('door')).length).toBeGreaterThanOrEqual(4);
    expect(p.building.roofs).toHaveLength(1);
    expect(p.exterior.items.some((i) => i.type === 'outdoor-shower')).toBe(true);
  });
  it('two-storey has two levels and a stair', () => {
    const p = createFromTemplate('two-storey');
    expect(p.building.levels).toHaveLength(2);
    expect(p.building.levels[0]!.stairs).toHaveLength(1);
    expect(p.building.levels[1]!.rooms.length).toBeGreaterThanOrEqual(4);
  });
});

import { itemIssues } from '../model/footprint';

describe('template furniture', () => {
  for (const t of TEMPLATE_LIST) {
    it(`${t.id} has no overlapping items`, () => {
      const p = createFromTemplate(t.id);
      for (const l of p.building.levels)
        for (const it of l.items)
          expect(
            itemIssues(null, l.items, it).map((i) => `${it.type}×${i.with}`),
            it.type,
          ).toEqual([]);
    });
  }
});
