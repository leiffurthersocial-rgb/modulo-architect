import type { Level, Project } from '@/core/model/schema';
import { computeWallShapes, wallPieces, type JunctionShape, type WallPiece, type WallShape } from '@/core/geometry/walls';
import { nodeMap, roomArea, roomPolygon } from '@/core/geometry/graph';
import { centroid, pointInPolygon } from '@/core/geometry/polygon';
import { add, scale, type Vec2 } from '@/core/geometry/vec2';
import { stairLayout, type StairLayout } from '@/core/geometry/stairs';

export interface DerivedWall {
  id: string;
  shape: WallShape;
  height: number;
  pieces: WallPiece[];
  leftExterior: boolean;
  rightExterior: boolean;
}

export interface DerivedRoom {
  id: string;
  polygon: Vec2[];
  area: number;
  center: Vec2;
}

export interface DerivedLevel {
  walls: DerivedWall[];
  wallById: Map<string, DerivedWall>;
  junctions: (JunctionShape & { height: number })[];
  rooms: DerivedRoom[];
  stairs: Map<string, StairLayout>;
}

interface CacheEntry {
  nodes: Level['nodes'];
  openings: Level['openings'];
  rooms: Level['rooms'];
  stairs: Level['stairs'];
  height: number;
  result: DerivedLevel;
}
const cache = new WeakMap<Level['walls'], CacheEntry>();

/**
 * Derived (computed) geometry for a level. Cached on the identity of the arrays it depends on,
 * so moving furniture never recomputes walls (Immer keeps untouched arrays identical).
 */
export function deriveLevel(level: Level): DerivedLevel {
  const hit = cache.get(level.walls);
  if (
    hit &&
    hit.nodes === level.nodes &&
    hit.openings === level.openings &&
    hit.rooms === level.rooms &&
    hit.stairs === level.stairs &&
    hit.height === level.height
  )
    return hit.result;
  const nodes = nodeMap(level);
  const { walls: shapes, junctions } = computeWallShapes(nodes, level.walls);
  const rooms: DerivedRoom[] = level.rooms.map((r) => {
    const polygon = roomPolygon(level, r);
    return { id: r.id, polygon, area: roomArea(level, r), center: centroid(polygon) };
  });
  const inside = (p: Vec2) => rooms.some((r) => pointInPolygon(p, r.polygon));

  const walls: DerivedWall[] = [];
  for (const w of level.walls) {
    const shape = shapes.get(w.id);
    if (!shape) continue;
    const height = w.height ?? level.height;
    const cuts = level.openings.filter((o) => o.wallId === w.id && !o.hidden);
    const mid = add(shape.a, scale(shape.dir, shape.length / 2));
    const probe = shape.thickness / 2 + 0.05;
    walls.push({
      id: w.id,
      shape,
      height,
      pieces: wallPieces(shape, height, cuts),
      leftExterior: !inside(add(mid, scale(shape.normal, probe))),
      rightExterior: !inside(add(mid, scale(shape.normal, -probe))),
    });
  }
  const stairs = new Map<string, StairLayout>();
  for (const s of level.stairs) stairs.set(s.id, stairLayout(s, s.rise ?? level.height));
  const out: DerivedLevel = {
    walls,
    wallById: new Map(walls.map((w) => [w.id, w])),
    junctions: junctions.map((j) => ({
      ...j,
      height: Math.max(...j.wallIds.map((id) => level.walls.find((w) => w.id === id)?.height ?? level.height)),
    })),
    rooms,
    stairs,
  };
  cache.set(level.walls, {
    nodes: level.nodes,
    openings: level.openings,
    rooms: level.rooms,
    stairs: level.stairs,
    height: level.height,
    result: out,
  });
  return out;
}

/** Height of the next level's floor slab above this one (for ceilings and stair holes). */
export function levelAbove(project: Project, level: Level): Level | undefined {
  const i = project.building.levels.findIndex((l) => l.id === level.id);
  return project.building.levels[i + 1];
}

export function levelBelow(project: Project, level: Level): Level | undefined {
  const i = project.building.levels.findIndex((l) => l.id === level.id);
  return i > 0 ? project.building.levels[i - 1] : undefined;
}
