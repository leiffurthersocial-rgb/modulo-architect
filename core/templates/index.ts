import { produce, type Draft } from 'immer';
import { createProject } from '../model/defaults';
import type { Item, Level, Project } from '../model/schema';
import * as ops from '../model/ops';
import { getElement, getOpening, defaultParams } from '@/registry';
import { closestOnSegment, dist } from '../geometry/vec2';
import { nodePos } from '../geometry/graph';
import type { TemplateId } from './meta';
import { createId } from '../model/ids';

export { TEMPLATE_LIST, type TemplateId } from './meta';

type P = Draft<Project>;

function item(type: string, x: number, y: number, rotation = 0, extra: Partial<Item> = {}): Omit<Item, 'id'> {
  const def = getElement(type);
  if (!def) throw new Error(`Unknown element ${type}`);
  return {
    type,
    x,
    y,
    z: def.elevation ?? 0,
    rotation,
    size: { ...def.size },
    params: defaultParams(def),
    materials: {},
    ...extra,
  };
}

/** Place an opening on whichever wall passes closest to (x, y). */
function opening(
  level: Level,
  type: string,
  x: number,
  y: number,
  extra: { width?: number; height?: number; sill?: number; flip?: boolean; mirror?: boolean } = {},
) {
  const def = getOpening(type)!;
  let best: { id: string; offset: number; d: number } | null = null;
  for (const w of level.walls) {
    const a = nodePos(level, w.a)!;
    const b = nodePos(level, w.b)!;
    const c = closestOnSegment({ x, y }, a, b);
    if (!best || c.distance < best.d) best = { id: w.id, offset: c.t * dist(a, b), d: c.distance };
  }
  if (!best) return;
  level.openings.push({
    id: createId('opening'),
    type,
    wallId: best.id,
    offset: best.offset,
    width: extra.width ?? def.defaults.width,
    height: extra.height ?? def.defaults.height,
    sill: extra.sill ?? def.defaults.sill,
    flip: extra.flip ?? false,
    mirror: extra.mirror ?? false,
    params: defaultParams(def),
  });
}

function studio(p: P) {
  p.name = 'Studio';
  const l = p.building.levels[0]!;
  ops.addRectRoom(p, l.id, -4, -2, 8, 4, 'Studio');
  opening(l, 'door-single', -2.6, 2);
  opening(l, 'door-sliding', 1.4, 2);
  opening(l, 'window-casement', 0, -2);
  opening(l, 'window-casement', 4, 0);
  const add = (i: Omit<Item, 'id'>) => ops.addItem(p, l.id, i);
  add(item('bed-double', 2.9, -1.0, Math.PI / 2, { size: { w: 1.6, d: 2.05, h: 1 } }));
  add(item('sofa', -1.0, 0.95, Math.PI, { size: { w: 2.0, d: 0.9, h: 0.8 } }));
  add(item('coffee-table', -1.0, 0.0, 0));
  add(item('kitchen-base', -2.5, -1.58, 0, { size: { w: 2.8, d: 0.62, h: 0.9 } }));
  add(item('plant', -3.55, 1.5));
  add(item('rug', -1.0, 0.3, 0, { size: { w: 2.2, d: 1.5, h: 0.012 } }));
  ops.addRoof(p, l.id, 'flat');
  ops.addItem(p, null, item('deck', 1.2, 3.7, 0, { size: { w: 4.5, d: 3, h: 0.18 } }));
  ops.addItem(p, null, item('tree', -8, -6));
}

function twoBedroom(p: P) {
  p.name = 'Two-bedroom house';
  const l = p.building.levels[0]!;
  const ox = -5.5;
  const oy = -3.5;
  ops.addRectRoom(p, l.id, ox, oy, 6, 7, 'Living & kitchen', 'floor-oak');
  ops.addRectRoom(p, l.id, ox + 6, oy, 5, 3.6, 'Bedroom', 'floor-ash');
  ops.addRectRoom(p, l.id, ox + 6, oy + 3.6, 2.5, 3.4, 'Bathroom', 'floor-tile-white');
  ops.addRectRoom(p, l.id, ox + 8.5, oy + 3.6, 2.5, 3.4, 'Bedroom 2', 'floor-ash');
  // Doors
  opening(l, 'door-single', ox + 2.2, oy + 7);
  opening(l, 'door-single', ox + 6, oy + 2.8);
  opening(l, 'door-single', ox + 6, oy + 5.6, { flip: true });
  opening(l, 'door-single', ox + 10, oy + 3.6, { flip: true });
  opening(l, 'door-sliding', ox + 4.3, oy, { width: 2.2 });
  // Windows
  opening(l, 'window-casement', ox, oy + 2.2);
  opening(l, 'window-casement', ox, oy + 5);
  opening(l, 'window-casement', ox + 8.5, oy, { width: 1.6 });
  opening(l, 'window-casement', ox + 11, oy + 1.8);
  opening(l, 'window-fixed', ox + 11, oy + 5.3, { width: 1.4, height: 1.3, sill: 0.8 });
  opening(l, 'window-casement', ox + 7.25, oy + 7, { width: 0.8, height: 0.8, sill: 1.4 });
  const add = (i: Omit<Item, 'id'>) => ops.addItem(p, l.id, i);
  // Living
  add(item('sofa', ox + 1.0, oy + 1.8, -Math.PI / 2));
  add(item('coffee-table', ox + 2.2, oy + 1.8, Math.PI / 2));
  add(item('armchair', ox + 3.4, oy + 0.9, Math.PI / 4 + Math.PI));
  add(item('rug', ox + 2.0, oy + 1.8, Math.PI / 2, { size: { w: 2.4, d: 2.0, h: 0.012 } }));
  add(item('floor-lamp', ox + 0.45, oy + 0.45));
  add(item('plant', ox + 0.45, oy + 3.2));
  // Kitchen & dining
  add(item('kitchen-base', ox + 5.66, oy + 4.85, Math.PI / 2, { size: { w: 2.4, d: 0.62, h: 0.9 } }));
  add(item('fridge', ox + 5.6, oy + 6.4, Math.PI / 2));
  add(item('dining-table', ox + 2.9, oy + 5.0, 0, { size: { w: 1.6, d: 0.9, h: 0.75 } }));
  for (const dx of [-0.45, 0.45]) {
    add(item('dining-chair', ox + 2.9 + dx, oy + 4.3, 0 + Math.PI));
    add(item('dining-chair', ox + 2.9 + dx, oy + 5.7, 0));
  }
  add(item('pendant-lamp', ox + 2.9, oy + 5.0));
  // Bedroom
  add(item('bed-double', ox + 9.85, oy + 1.4, Math.PI / 2, { size: { w: 1.6, d: 2.05, h: 1 } }));
  add(item('nightstand', ox + 10.68, oy + 0.3, Math.PI / 2));
  add(item('nightstand', ox + 10.68, oy + 2.5, Math.PI / 2));
  add(item('wardrobe', ox + 7.0, oy + 0.4, 0, { size: { w: 1.6, d: 0.6, h: 2.2 } }));
  // Bathroom
  add(item('toilet', ox + 6.35, oy + 6.4, -Math.PI / 2));
  add(item('bathroom-sink', ox + 6.36, oy + 4.6, -Math.PI / 2));
  add(item('shower', ox + 8.0, oy + 6.45, Math.PI));
  // Bedroom 2
  add(item('bed-single', ox + 9.85, oy + 5.75, Math.PI / 2));
  add(item('desk', ox + 9.4, oy + 3.95, 0, { size: { w: 1.2, d: 0.6, h: 0.74 } }));
  ops.addRoof(p, l.id, 'gable');
  // Exterior
  const ext = (i: Omit<Item, 'id'>) => ops.addItem(p, null, i);
  ext(item('path', ox + 2.2, oy + 9.5, 0, { size: { w: 1.2, d: 4.8, h: 0.03 } }));
  ext(item('deck', ox + 4.3, oy - 1.8, 0, { size: { w: 5, d: 3.4, h: 0.18 } }));
  ext(item('fence', 0, 13.4, 0, { size: { w: 24, d: 0.06, h: 1.1 } }));
  ext(item('tree', -11, -9));
  ext(item('tree', 10, -8, 0, { size: { w: 3.4, d: 3.4, h: 5.2 } }));
  ext(item('conifer', 11, 9));
  ext(item('hedge', -12.5, 2, Math.PI / 2, { size: { w: 14, d: 0.8, h: 1.6 } }));
  ext(item('outdoor-shower', 3.8, -7.2, Math.PI));
  ext(item('lounger', 0, -7.4, Math.PI));
  ext(item('lounger', -1, -7.4, Math.PI));
  ext(item('driveway', 7.5, 9, 0, { size: { w: 3.2, d: 8, h: 0.03 } }));
  ext(item('car', 7.5, 9.5));
}

function twoStorey(p: P) {
  p.name = 'Two-storey house';
  const g = p.building.levels[0]!;
  const ox = -4.5;
  const oy = -3.5;
  ops.addRectRoom(p, g.id, ox, oy, 9, 7, 'Living', 'floor-oak');
  opening(g, 'door-single', ox + 1.6, oy + 7);
  opening(g, 'door-sliding', ox + 4.5, oy, { width: 2.4 });
  opening(g, 'window-casement', ox, oy + 3.5, { width: 1.6 });
  opening(g, 'window-casement', ox + 9, oy + 1.8);
  opening(g, 'window-casement', ox + 9, oy + 5.2);
  opening(g, 'window-casement', ox + 6.5, oy + 7);
  const add = (lid: string, i: Omit<Item, 'id'>) => ops.addItem(p, lid, i);
  add(g.id, item('sofa-corner', ox + 1.5, oy + 1.0, -Math.PI / 2, { size: { w: 2.7, d: 1.7, h: 0.8 } }));
  add(g.id, item('coffee-table', ox + 3.4, oy + 1.9, Math.PI / 2));
  add(g.id, item('kitchen-base', ox + 7.2, oy + 6.66, Math.PI, { size: { w: 3.0, d: 0.62, h: 0.9 } }));
  add(g.id, item('kitchen-island', ox + 7.2, oy + 4.9, 0, { size: { w: 2.0, d: 1.0, h: 0.92 } }));
  add(g.id, item('dining-table-round', ox + 3.3, oy + 5.2));
  add(g.id, item('fireplace', ox + 0.45, oy + 4.5, -Math.PI / 2));
  ops.addStair(p, g.id, {
    type: 'straight',
    x: ox + 7.0,
    y: oy + 0.62,
    rotation: Math.PI / 2,
    width: 1.0,
    length: 3.2,
    length2: 1.6,
    turn: 'left',
    rise: null,
    opening: true,
    material: 'floor-oak',
  });
  const upId = ops.addLevel(p, { copyWalls: false });
  const up = p.building.levels.find((l) => l.id === upId)!;
  ops.addRectRoom(p, up.id, ox, oy, 5, 3.6, 'Main bedroom', 'floor-ash');
  ops.addRectRoom(p, up.id, ox, oy + 3.6, 5, 3.4, 'Bedroom', 'floor-ash');
  ops.addRectRoom(p, up.id, ox + 5, oy + 3.6, 4, 3.4, 'Bathroom', 'floor-tile-white');
  ops.addRectRoom(p, up.id, ox + 5, oy, 4, 3.6, 'Landing', 'floor-oak');
  opening(up, 'door-single', ox + 5, oy + 2.4, { flip: true });
  opening(up, 'door-single', ox + 4.0, oy + 3.6);
  opening(up, 'door-single', ox + 5.6, oy + 3.6);
  opening(up, 'window-casement', ox, oy + 1.8, { width: 1.4 });
  opening(up, 'window-casement', ox + 2.5, oy + 7, { width: 1.4 });
  opening(up, 'window-casement', ox + 7, oy + 7, { width: 1.0 });
  opening(up, 'window-tall', ox + 2.5, oy, { width: 1.8, height: 2.3, sill: 0.05 });
  add(up.id, item('bed-double', ox + 2.5, oy + 1.25, 0 + Math.PI, { size: { w: 1.7, d: 2.1, h: 1 } }));
  add(up.id, item('bed-single', ox + 1.0, oy + 5.4, -Math.PI / 2));
  add(up.id, item('bathtub', ox + 7.9, oy + 6.55, Math.PI));
  add(up.id, item('toilet', ox + 8.65, oy + 4.3, Math.PI / 2));
  add(up.id, item('bathroom-sink', ox + 5.5, oy + 6.7, Math.PI));
  ops.addRoof(p, up.id, 'gable');
  const ext = (i: Omit<Item, 'id'>) => ops.addItem(p, null, i);
  ext(item('path', ox + 1.6, oy + 9.5, 0, { size: { w: 1.2, d: 4.8, h: 0.03 } }));
  ext(item('tree', -10, -8));
  ext(item('hedge', 0, 13, 0, { size: { w: 20, d: 0.8, h: 1.3 } }));
  ext(item('deck', ox + 4.5, oy - 2, 0, { size: { w: 6, d: 3.6, h: 0.18 } }));
}

export function createFromTemplate(id: TemplateId | string): Project {
  const base = createProject();
  switch (id) {
    case 'studio':
      return produce(base, studio);
    case 'two-bedroom':
      return produce(base, twoBedroom);
    case 'two-storey':
      return produce(base, twoStorey);
    default:
      return produce(base, (p) => {
        p.name = 'Untitled house';
      });
  }
}
