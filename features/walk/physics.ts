/**
 * First-person walking physics in plan space + height. Pure functions so they are testable:
 * the world is a set of prism obstacles and walkable surfaces derived from the project.
 */
import type { Project } from '@/core/model/schema';
import type { Vec2 } from '@/core/geometry/vec2';
import { closestOnSegment, sub, len, scale, add } from '@/core/geometry/vec2';
import { bounds, pointInPolygon } from '@/core/geometry/polygon';
import { computeWallShapes, wallPieces } from '@/core/geometry/walls';
import { nodeMap, roomPolygon } from '@/core/geometry/graph';
import { stairHeightAt, stairLayout, type StairLayout } from '@/core/geometry/stairs';
import { itemBox } from '@/core/model/footprint';
import { stairOpenings } from '@/core/model/voids';
import { getElement } from '@/registry';

export interface Obstacle {
  poly: Vec2[];
  y0: number;
  y1: number;
  box: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface Surface {
  poly: Vec2[];
  y: number;
  holes: Vec2[][];
}

export interface WalkWorld {
  obstacles: Obstacle[];
  surfaces: Surface[];
  stairs: { layout: StairLayout; base: number }[];
  doors: { id: string; center: Vec2; y: number }[];
  plot: Vec2[];
}

export const PLAYER_RADIUS = 0.25;
export const STEP_UP = 0.42;

export function buildWalkWorld(project: Project): WalkWorld {
  const obstacles: Obstacle[] = [];
  const surfaces: Surface[] = [];
  const stairs: WalkWorld['stairs'] = [];
  const doors: WalkWorld['doors'] = [];
  const levels = project.building.levels;
  const add = (poly: Vec2[], y0: number, y1: number) => obstacles.push({ poly, y0, y1, box: bounds(poly) });

  levels.forEach((level, i) => {
    const nodes = nodeMap(level);
    const { walls: shapes, junctions } = computeWallShapes(nodes, level.walls);
    for (const w of level.walls) {
      const shape = shapes.get(w.id);
      if (!shape || w.hidden) continue;
      const cuts = level.openings.filter((o) => o.wallId === w.id);
      for (const p of wallPieces(shape, w.height ?? level.height, cuts))
        add(p.polygon, level.elevation + p.y0, level.elevation + p.y1);
    }
    for (const j of junctions) add(j.polygon, level.elevation, level.elevation + level.height);
    for (const o of level.openings) {
      if (!o.type.startsWith('door')) continue;
      const shape = shapes.get(o.wallId);
      if (shape)
        doors.push({
          id: o.id,
          center: { x: shape.a.x + shape.dir.x * o.offset, y: shape.a.y + shape.dir.y * o.offset },
          y: level.elevation,
        });
    }
    const below = levels[i - 1];
    const holes = below ? stairOpenings(below) : [];
    for (const s of level.slabs) if (!s.hidden) surfaces.push({ poly: s.points, y: level.elevation, holes });
    for (const r of level.rooms) {
      if (r.floor === false && i > 0) continue;
      const poly = roomPolygon(level, r);
      if (poly.length >= 3) surfaces.push({ poly, y: level.elevation, holes });
    }
    for (const s of level.stairs)
      stairs.push({ layout: stairLayout(s, s.rise ?? level.height), base: level.elevation });
    for (const it of level.items) {
      const def = getElement(it.type);
      if (!def || it.hidden || def.solid === false || def.snap === 'ceiling' || def.snap === 'wall') continue;
      add(itemBox(it), level.elevation + it.z, level.elevation + it.z + it.size.h);
    }
  });
  for (const it of project.exterior.items) {
    const def = getElement(it.type);
    if (!def || it.hidden) continue;
    if (def.solid === false) {
      // Low flat elements (decks, paths) are walkable surfaces.
      if (it.size.h <= STEP_UP) surfaces.push({ poly: itemBox(it), y: it.z + it.size.h, holes: [] });
      continue;
    }
    const fp = def.footprint
      ? def.footprint({ size: it.size, params: it.params }).map((p) => ({
          x: it.x + p.x * Math.cos(it.rotation) - p.y * Math.sin(it.rotation),
          y: it.y + p.x * Math.sin(it.rotation) + p.y * Math.cos(it.rotation),
        }))
      : itemBox(it);
    add(fp, it.z, it.z + it.size.h);
  }
  return { obstacles, surfaces, stairs, doors, plot: project.site.plot };
}

/** Highest walkable height at p not more than STEP_UP above the feet. */
export function groundHeight(world: WalkWorld, p: Vec2, feet: number): number {
  let best = 0;
  const limit = feet + STEP_UP;
  for (const s of world.surfaces) {
    if (s.y > limit || s.y <= best) continue;
    if (!pointInPolygon(p, s.poly)) continue;
    if (s.holes.some((h) => pointInPolygon(p, h))) continue;
    best = s.y;
  }
  for (const st of world.stairs) {
    const h = stairHeightAt(st.layout, p);
    if (h === null) continue;
    const y = st.base + h;
    if (y <= limit && y > best) best = y;
  }
  return best;
}

/** Push a circle at p out of every obstacle overlapping the body's height span. */
export function collide(world: WalkWorld, p: Vec2, feet: number, height = 1.75, r = PLAYER_RADIUS): Vec2 {
  let q = p;
  const lo = feet + STEP_UP * 0.9;
  const hi = feet + height;
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (const o of world.obstacles) {
      if (o.y1 <= lo || o.y0 >= hi) continue;
      if (q.x < o.box.minX - r || q.x > o.box.maxX + r || q.y < o.box.minY - r || q.y > o.box.maxY + r)
        continue;
      const inside = pointInPolygon(q, o.poly);
      let best: { point: Vec2; distance: number } | null = null;
      for (let i = 0; i < o.poly.length; i++) {
        const c = closestOnSegment(q, o.poly[i]!, o.poly[(i + 1) % o.poly.length]!);
        if (!best || c.distance < best.distance) best = c;
      }
      if (!best) continue;
      if (inside) {
        const d = sub(best.point, q);
        const l = len(d) || 1e-6;
        q = add(best.point, scale(d, r / l));
        moved = true;
      } else if (best.distance < r) {
        const d = sub(q, best.point);
        const l = len(d) || 1e-6;
        q = add(best.point, scale(d, r / l));
        moved = true;
      }
    }
    if (!moved) break;
  }
  return q;
}

/** Spawn outside the front door (or at the plot's south edge) facing the house. */
export function spawnPoint(project: Project): { p: Vec2; yaw: number } {
  const pts = project.building.levels.flatMap((l) => l.nodes.map((n) => ({ x: n.x, y: n.y })));
  const g = project.building.levels[0]!;
  const c = pts.length
    ? (() => {
        const b = bounds(pts);
        return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
      })()
    : { x: 0, y: 0 };
  const nodes = nodeMap(g);
  const rooms = g.rooms.map((r) => roomPolygon(g, r));
  for (const o of g.openings) {
    if (!o.type.startsWith('door')) continue;
    const w = g.walls.find((x) => x.id === o.wallId);
    if (!w) continue;
    const a = nodes.get(w.a)!;
    const b = nodes.get(w.b)!;
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const dir = { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
    const n = { x: -dir.y, y: dir.x };
    const center = { x: a.x + dir.x * o.offset, y: a.y + dir.y * o.offset };
    for (const s of [1, -1]) {
      const probe = { x: center.x + n.x * s * 2.2, y: center.y + n.y * s * 2.2 };
      if (!rooms.some((poly) => pointInPolygon(probe, poly))) {
        return { p: probe, yaw: Math.atan2(-(center.x - probe.x), -(center.y - probe.y)) };
      }
    }
  }
  const b = pts.length ? bounds(pts) : { maxY: 0 };
  const p = { x: c.x, y: b.maxY + 6 };
  return { p, yaw: Math.atan2(-(c.x - p.x), -(c.y - p.y)) };
}
