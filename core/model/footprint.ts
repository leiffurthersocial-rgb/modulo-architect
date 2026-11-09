import type { Item, Level, Opening, Project } from './schema';
import { getElement, getOpening } from '@/registry';
import type { Vec2 } from '../geometry/vec2';
import { add, normalize, perp, scale, sub } from '../geometry/vec2';
import { convexOverlap, isConvex, rectPolygon, centroid } from '../geometry/polygon';
import { nodePos, roomPolygon } from '../geometry/graph';
import { stairLayout } from '../geometry/stairs';
import { kindOf } from './entities';

/** Local → plan transform for items (rotation θ maps local +z "front" towards plan +y at θ = 0). */
export function itemToPlan(it: Pick<Item, 'x' | 'y' | 'rotation'>, p: Vec2): Vec2 {
  const c = Math.cos(it.rotation);
  const s = Math.sin(it.rotation);
  return { x: it.x + p.x * c - p.y * s, y: it.y + p.x * s + p.y * c };
}

export function itemFootprint(it: Item): Vec2[] {
  const def = getElement(it.type);
  if (def?.footprint) return def.footprint({ size: it.size, params: it.params }).map((p) => itemToPlan(it, p));
  return rectPolygon(it.x, it.y, it.size.w, it.size.d, it.rotation);
}

/** Bounding rectangle of the item (for collision; footprints may be concave). */
export function itemBox(it: Item): Vec2[] {
  return rectPolygon(it.x, it.y, it.size.w, it.size.d, it.rotation);
}

export function openingGeometry(level: Level, o: Opening) {
  const w = level.walls.find((x) => x.id === o.wallId);
  if (!w) return null;
  const a = nodePos(level, w.a)!;
  const b = nodePos(level, w.b)!;
  const dir = normalize(sub(b, a));
  const n = perp(dir);
  const c = add(a, scale(dir, o.offset));
  return { a, b, dir, normal: n, center: c, thickness: w.thickness };
}

/** Plan rectangle a door leaf sweeps (or a clearance zone in front of sliding doors). */
export function doorClearance(level: Level, o: Opening): Vec2[] | null {
  const def = getOpening(o.type);
  if (!def || def.kind !== 'door') return null;
  const g = openingGeometry(level, o);
  if (!g) return null;
  const side = o.flip ? -1 : 1;
  const depth = def.swing === 'double' ? o.width / 2 : def.swing === 'sliding' ? 0.6 : o.width;
  const n = scale(g.normal, side);
  const p0 = add(add(g.center, scale(g.dir, -o.width / 2)), scale(n, g.thickness / 2));
  const p1 = add(p0, scale(g.dir, o.width));
  return [p0, p1, add(p1, scale(n, depth)), add(p0, scale(n, depth))];
}

export interface PlacementIssue {
  kind: 'collision' | 'blocks-door';
  with: string;
}

function solid(it: Item) {
  const def = getElement(it.type);
  return def ? def.solid !== false && def.snap !== 'ceiling' && def.snap !== 'wall' : false;
}

/** Collision and door-blocking warnings for an item (only solid, floor-standing items). */
export function itemIssues(level: Level | null, items: Item[], it: Item): PlacementIssue[] {
  if (!solid(it)) return [];
  const issues: PlacementIssue[] = [];
  const box = itemBox(it);
  for (const other of items) {
    if (other.id === it.id || other.hidden || !solid(other)) continue;
    if (convexOverlap(shrink(box), shrink(itemBox(other)))) issues.push({ kind: 'collision', with: other.id });
  }
  if (level) {
    for (const o of level.openings) {
      const zone = doorClearance(level, o);
      if (zone && convexOverlap(shrink(box), zone)) issues.push({ kind: 'blocks-door', with: o.id });
    }
  }
  return issues;
}

/** Ignore contact closer than 1 cm so items placed flush don't warn. */
function shrink(poly: Vec2[], d = 0.01): Vec2[] {
  if (!isConvex(poly)) return poly;
  const c = centroid(poly);
  return poly.map((p) => {
    const v = sub(p, c);
    const l = Math.hypot(v.x, v.y) || 1;
    return add(c, scale(v, Math.max(0, l - d) / l));
  });
}

/** A plan-space outline + height range for any entity, used for highlights and marquee picks. */
export function entityOutline(project: Project, id: string): { polygons: Vec2[][]; y0: number; y1: number } | null {
  const kind = kindOf(id);
  const levels = project.building.levels;
  if (kind === 'item') {
    for (const l of levels) {
      const it = l.items.find((x) => x.id === id);
      if (it) return { polygons: [itemFootprint(it)], y0: l.elevation + it.z, y1: l.elevation + it.z + it.size.h };
    }
    const it = project.exterior.items.find((x) => x.id === id);
    if (it) return { polygons: [itemFootprint(it)], y0: it.z, y1: it.z + it.size.h };
    return null;
  }
  for (const l of levels) {
    if (kind === 'wall') {
      const w = l.walls.find((x) => x.id === id);
      if (!w) continue;
      const a = nodePos(l, w.a)!;
      const b = nodePos(l, w.b)!;
      const d = normalize(sub(b, a));
      const n = scale(perp(d), w.thickness / 2);
      return { polygons: [[add(a, n), add(b, n), sub(b, n), sub(a, n)]], y0: l.elevation, y1: l.elevation + (w.height ?? l.height) };
    }
    if (kind === 'room') {
      const r = l.rooms.find((x) => x.id === id);
      if (r) return { polygons: [roomPolygon(l, r)], y0: l.elevation, y1: l.elevation + 0.02 };
    }
    if (kind === 'opening') {
      const o = l.openings.find((x) => x.id === id);
      if (!o) continue;
      const g = openingGeometry(l, o);
      if (!g) return null;
      const t = scale(g.normal, g.thickness / 2 + 0.02);
      const e0 = add(g.center, scale(g.dir, -o.width / 2));
      const e1 = add(g.center, scale(g.dir, o.width / 2));
      return { polygons: [[add(e0, t), add(e1, t), sub(e1, t), sub(e0, t)]], y0: l.elevation + o.sill, y1: l.elevation + o.sill + o.height };
    }
    if (kind === 'stair') {
      const s = l.stairs.find((x) => x.id === id);
      if (s) return { polygons: stairLayout(s, s.rise ?? l.height).footprint, y0: l.elevation, y1: l.elevation + (s.rise ?? l.height) };
    }
    if (kind === 'node') {
      const n = l.nodes.find((x) => x.id === id);
      if (n) return { polygons: [rectPolygon(n.x, n.y, 0.3, 0.3, 0)], y0: l.elevation, y1: l.elevation + l.height };
    }
  }
  if (kind === 'roof') {
    const r = project.building.roofs.find((x) => x.id === id);
    const l = r && levels.find((x) => x.id === r.levelId);
    if (r && l) {
      const o = r.overhang;
      return { polygons: [rectPolygon(r.x, r.y, r.width + 2 * o, r.depth + 2 * o, r.rotation)], y0: l.elevation + l.height, y1: l.elevation + l.height + 0.3 };
    }
  }
  return null;
}
