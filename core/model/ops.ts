/**
 * Domain operations on a (draft) Project. Pure functions: called inside history.mutate recipes
 * so every change is undoable. Keep UI concerns (selection, toasts) out of this file.
 */
import type { Item, Level, Opening, Project, Roof, Stair, Wall } from './schema';
import { createId } from './ids';
import { createLevel, DEFAULTS, defaultWallProps } from './defaults';
import { DEFAULT_MATERIALS } from '@/registry/materials';
import {
  addWall,
  cleanupNode,
  nodePos,
  removeWall,
  roomPolygon,
  syncRooms,
  wallsAtNode,
  type WallProps,
} from '../geometry/graph';
import type { Vec2 } from '../geometry/vec2';
import { add, dist, normalize, scale, sub } from '../geometry/vec2';
import { bounds, centroid, pointInPolygon } from '../geometry/polygon';
import { kindOf } from './entities';

export const ROOM_DEFAULTS = {
  floorMaterial: DEFAULT_MATERIALS.floor,
  ceilingMaterial: DEFAULT_MATERIALS.ceiling,
};

export function getLevel(p: Project, levelId: string): Level {
  const l = p.building.levels.find((x) => x.id === levelId);
  if (!l) throw new Error(`Unknown level ${levelId}`);
  return l;
}

export function sync(level: Level) {
  return syncRooms(level, ROOM_DEFAULTS);
}

/** Add a polyline of walls; returns created wall ids. */
export function addWallChain(
  p: Project,
  levelId: string,
  points: Vec2[],
  props: WallProps = defaultWallProps(),
) {
  const level = getLevel(p, levelId);
  const created: string[] = [];
  for (let i = 0; i < points.length - 1; i++)
    created.push(...addWall(level, points[i]!, points[i + 1]!, props));
  sync(level);
  return created;
}

/** A rectangular room from its top-left corner (x, y) and size. Returns the room id. */
export function addRectRoom(
  p: Project,
  levelId: string,
  x: number,
  y: number,
  w: number,
  h: number,
  name?: string,
  floorMaterial?: string,
): string | null {
  const pts = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
    { x, y },
  ];
  addWallChain(p, levelId, pts);
  const level = getLevel(p, levelId);
  const c = { x: x + w / 2, y: y + h / 2 };
  const room = level.rooms.find((r) => pointInPolygon(c, roomPolygon(level, r)));
  if (room) {
    if (name) room.name = name;
    if (floorMaterial) room.floorMaterial = floorMaterial;
  }
  return room?.id ?? null;
}

export function moveNode(p: Project, levelId: string, nodeId: string, to: Vec2) {
  const level = getLevel(p, levelId);
  const n = level.nodes.find((x) => x.id === nodeId);
  if (!n) return;
  n.x = to.x;
  n.y = to.y;
}

/** Translate a set of nodes (by id) by delta. */
export function translateNodes(level: Level, nodeIds: Iterable<string>, delta: Vec2) {
  const set = new Set(nodeIds);
  for (const n of level.nodes)
    if (set.has(n.id)) {
      n.x += delta.x;
      n.y += delta.y;
    }
}

/** Set a wall's length by moving its end node along the wall direction. */
export function setWallLength(p: Project, wallId: string, length: number) {
  for (const level of p.building.levels) {
    const w = level.walls.find((x) => x.id === wallId);
    if (!w) continue;
    const a = nodePos(level, w.a)!;
    const b = nodePos(level, w.b)!;
    const d = normalize(sub(b, a));
    const nb = add(a, scale(d, Math.max(0.05, length)));
    const node = level.nodes.find((x) => x.id === w.b)!;
    node.x = nb.x;
    node.y = nb.y;
    clampOpenings(level, w);
    return;
  }
}

export function wallLength(level: Level, w: Wall) {
  const a = nodePos(level, w.a);
  const b = nodePos(level, w.b);
  return a && b ? dist(a, b) : 0;
}

/** Keep openings inside their wall after it shrinks. */
export function clampOpenings(level: Level, w: Wall) {
  const L = wallLength(level, w);
  for (const o of level.openings) {
    if (o.wallId !== w.id) continue;
    o.width = Math.min(o.width, Math.max(0.2, L - 0.1));
    o.offset = Math.min(Math.max(o.offset, o.width / 2 + 0.05), L - o.width / 2 - 0.05);
  }
}

/** Set width/length of a rectangular-ish room by moving the nodes on one side. */
export function resizeRoom(p: Project, levelId: string, roomId: string, axis: 'x' | 'y', size: number) {
  const level = getLevel(p, levelId);
  const room = level.rooms.find((r) => r.id === roomId);
  if (!room) return;
  const poly = roomPolygon(level, room);
  const b = bounds(poly);
  const current = axis === 'x' ? b.width : b.height;
  const delta = size - current;
  if (Math.abs(delta) < 1e-6) return;
  const edge = axis === 'x' ? b.maxX : b.maxY;
  const ids = room.nodes.filter((id) => {
    const n = level.nodes.find((x) => x.id === id)!;
    return Math.abs((axis === 'x' ? n.x : n.y) - edge) < 1e-3;
  });
  // Move every node on that edge line (including those of neighbouring rooms) so walls stay straight.
  const moving = level.nodes.filter((n) => {
    if (ids.includes(n.id)) return true;
    return false;
  });
  for (const n of moving) {
    if (axis === 'x') n.x += delta;
    else n.y += delta;
  }
  for (const w of level.walls) clampOpenings(level, w);
}

/** Remove the walls of a room that no other room uses. */
export function removeRoomWalls(level: Level, roomId: string) {
  const room = level.rooms.find((r) => r.id === roomId);
  if (!room) return;
  const others = level.rooms.filter((r) => r.id !== roomId);
  const loop = room.nodes;
  const wallIds: string[] = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i]!;
    const b = loop[(i + 1) % loop.length]!;
    const shared = others.some((r) =>
      r.nodes.some((n, j) => {
        const m = r.nodes[(j + 1) % r.nodes.length]!;
        return (n === a && m === b) || (n === b && m === a);
      }),
    );
    if (shared) continue;
    const w = level.walls.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    if (w) wallIds.push(w.id);
  }
  level.rooms = others;
  for (const wid of wallIds) removeWall(level, wid);
}

export function addSlab(
  p: Project,
  levelId: string,
  points: Vec2[],
  material = DEFAULT_MATERIALS.floor,
): string {
  const level = getLevel(p, levelId);
  const id = createId('slab');
  level.slabs.push({
    id,
    points: points.map((q) => ({ x: q.x, y: q.y })),
    material,
    thickness: level.floorThickness,
  });
  return id;
}

export interface DeleteOptions {
  /** Rooms: also remove their walls (default: only the floor). */
  roomWalls?: boolean;
}

/**
 * Delete anything by id, as granularly as possible:
 * - a wall goes on its own; floors of rooms it enclosed are kept as free slabs;
 * - a room loses only its floor (its walls stay) unless `roomWalls` is set.
 */
export function deleteEntities(p: Project, ids: string[], opts: DeleteOptions = {}) {
  const touched = new Set<Level>();
  const before = new Map<Level, { id: string; poly: Vec2[]; material: string; floor: boolean }[]>();
  const snapshot = (level: Level) => {
    if (!before.has(level))
      before.set(
        level,
        level.rooms.map((r) => ({
          id: r.id,
          poly: roomPolygon(level, r),
          material: r.floorMaterial,
          floor: r.floor !== false,
        })),
      );
  };
  const intentionallyRemoved = new Set<string>();
  for (const id of ids) {
    const kind = kindOf(id);
    if (kind === 'roof') {
      p.building.roofs = p.building.roofs.filter((r) => r.id !== id);
      continue;
    }
    if (kind === 'item' && p.exterior.items.some((x) => x.id === id)) {
      p.exterior.items = p.exterior.items.filter((x) => x.id !== id);
      continue;
    }
    for (const level of p.building.levels) {
      switch (kind) {
        case 'wall':
          if (level.walls.some((w) => w.id === id)) {
            snapshot(level);
            removeWall(level, id);
            touched.add(level);
          }
          break;
        case 'node':
          if (level.nodes.some((n) => n.id === id)) {
            snapshot(level);
            for (const w of wallsAtNode(level, id)) removeWall(level, w.id);
            level.nodes = level.nodes.filter((n) => n.id !== id);
            touched.add(level);
          }
          break;
        case 'room': {
          const room = level.rooms.find((r) => r.id === id);
          if (!room) break;
          if (!opts.roomWalls) {
            room.floor = false;
            break;
          }
          snapshot(level);
          intentionallyRemoved.add(id);
          removeRoomWalls(level, id);
          touched.add(level);
          break;
        }
        case 'slab':
          level.slabs = level.slabs.filter((s) => s.id !== id);
          break;
        case 'opening':
          level.openings = level.openings.filter((o) => o.id !== id);
          break;
        case 'stair':
          level.stairs = level.stairs.filter((s) => s.id !== id);
          break;
        case 'item':
          level.items = level.items.filter((x) => x.id !== id);
          break;
        default:
          break;
      }
    }
  }
  for (const level of touched) {
    for (const n of [...level.nodes]) cleanupNode(level, n.id);
    sync(level);
    // Keep the floor of any room whose enclosure was broken (it was not merged into another room).
    const survivors = level.rooms.map((r) => roomPolygon(level, r));
    for (const old of before.get(level) ?? []) {
      if (!old.floor || intentionallyRemoved.has(old.id) || old.poly.length < 3) continue;
      if (level.rooms.some((r) => r.id === old.id)) continue;
      const c = centroid(old.poly);
      if (survivors.some((poly) => pointInPolygon(c, poly))) continue;
      level.slabs.push({
        id: createId('slab'),
        points: old.poly,
        material: old.material,
        thickness: level.floorThickness,
      });
    }
  }
}

/* ------------------------------------------------------------------------------------------ */
/* Levels                                                                                      */
/* ------------------------------------------------------------------------------------------ */

/** Recompute elevations so levels stack (ground floor stays where it is). */
export function restack(p: Project) {
  const levels = p.building.levels;
  for (let i = 1; i < levels.length; i++) {
    const prev = levels[i - 1]!;
    levels[i]!.elevation = prev.elevation + prev.height;
  }
}

export function addLevel(p: Project, opts: { copyWalls?: boolean } = {}): string {
  const levels = p.building.levels;
  const top = levels[levels.length - 1]!;
  const level = createLevel(levels.length, top.elevation + top.height, top.height);
  if (opts.copyWalls) {
    const idMap = new Map<string, string>();
    for (const n of top.nodes) {
      const id = createId('node');
      idMap.set(n.id, id);
      level.nodes.push({ id, x: n.x, y: n.y });
    }
    for (const w of top.walls)
      level.walls.push({
        ...w,
        materials: { ...w.materials },
        id: createId('wall'),
        a: idMap.get(w.a)!,
        b: idMap.get(w.b)!,
      });
    syncRooms(level, ROOM_DEFAULTS);
    level.rooms.forEach((r, i) => {
      const src = top.rooms.find((t) => t.nodes.every((n) => r.nodes.includes(idMap.get(n)!)));
      r.name = src ? src.name : `Room ${i + 1}`;
    });
  }
  levels.push(level);
  // Roofs follow the top level.
  for (const r of p.building.roofs) if (r.levelId === top.id) r.levelId = level.id;
  return level.id;
}

export function removeLevel(p: Project, levelId: string) {
  if (p.building.levels.length <= 1) return;
  const idx = p.building.levels.findIndex((l) => l.id === levelId);
  if (idx < 0) return;
  p.building.levels.splice(idx, 1);
  const top = p.building.levels[p.building.levels.length - 1]!;
  for (const r of p.building.roofs) if (r.levelId === levelId) r.levelId = top.id;
  restack(p);
}

export function setLevelHeight(p: Project, levelId: string, height: number) {
  getLevel(p, levelId).height = Math.max(1.8, height);
  restack(p);
}

/* ------------------------------------------------------------------------------------------ */
/* Openings, items, stairs, roofs                                                              */
/* ------------------------------------------------------------------------------------------ */

export function addOpening(p: Project, levelId: string, o: Omit<Opening, 'id'>): string {
  const id = createId('opening');
  getLevel(p, levelId).openings.push({ ...o, id });
  return id;
}

export function addItem(p: Project, levelId: string | null, item: Omit<Item, 'id'>): string {
  const id = createId('item');
  if (levelId) getLevel(p, levelId).items.push({ ...item, id });
  else p.exterior.items.push({ ...item, id });
  return id;
}

export function addStair(p: Project, levelId: string, s: Omit<Stair, 'id'>): string {
  const id = createId('stair');
  getLevel(p, levelId).stairs.push({ ...s, id });
  return id;
}

/** Fit a roof rectangle to a level's wall footprint. */
export function roofFootprint(level: Level): { x: number; y: number; width: number; depth: number } | null {
  if (level.nodes.length < 2) return null;
  const b = bounds(level.nodes.map((n) => ({ x: n.x, y: n.y })));
  const t = Math.max(...level.walls.map((w) => w.thickness), 0.2);
  return { x: b.minX + b.width / 2, y: b.minY + b.height / 2, width: b.width + t, depth: b.height + t };
}

export function addRoof(p: Project, levelId: string, type: Roof['type'] = 'gable'): string | null {
  const level = getLevel(p, levelId);
  const fp = roofFootprint(level);
  if (!fp) return null;
  const id = createId('roof');
  p.building.roofs = p.building.roofs.filter((r) => r.levelId !== levelId);
  p.building.roofs.push({
    id,
    levelId,
    type,
    auto: true,
    ...fp,
    rotation: 0,
    ridge: 'auto',
    pitch: type === 'flat' ? 0 : 35,
    overhang: type === 'flat' ? 0.15 : 0.4,
    thickness: 0.25,
    material: type === 'flat' ? 'roof-gravel' : DEFAULT_MATERIALS.roof,
  });
  return id;
}

/** Keep "auto" roofs fitted to their level's walls. */
export function refitRoofs(p: Project) {
  for (const r of p.building.roofs) {
    if (!r.auto) continue;
    const level = p.building.levels.find((l) => l.id === r.levelId);
    const fp = level && roofFootprint(level);
    if (!fp) continue;
    const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
    if (!near(r.x, fp.x)) r.x = fp.x;
    if (!near(r.y, fp.y)) r.y = fp.y;
    if (!near(r.width, fp.width)) r.width = fp.width;
    if (!near(r.depth, fp.depth)) r.depth = fp.depth;
  }
}

/* ------------------------------------------------------------------------------------------ */
/* Copy / paste                                                                                */
/* ------------------------------------------------------------------------------------------ */

export interface ClipboardData {
  items: Item[];
  stairs: Stair[];
  /** Exterior items (no level). */
  outdoor: Item[];
}

export function copyEntities(p: Project, ids: string[]): ClipboardData {
  const data: ClipboardData = { items: [], stairs: [], outdoor: [] };
  for (const id of ids) {
    const kind = kindOf(id);
    if (kind === 'item') {
      const ext = p.exterior.items.find((x) => x.id === id);
      if (ext) data.outdoor.push(structuredClone(ext));
      for (const l of p.building.levels) {
        const it = l.items.find((x) => x.id === id);
        if (it) data.items.push(structuredClone(it));
      }
    } else if (kind === 'stair') {
      for (const l of p.building.levels) {
        const s = l.stairs.find((x) => x.id === id);
        if (s) data.stairs.push(structuredClone(s));
      }
    }
  }
  return data;
}

export function pasteEntities(p: Project, levelId: string, data: ClipboardData, offset: Vec2): string[] {
  const ids: string[] = [];
  const level = getLevel(p, levelId);
  for (const it of data.items) {
    const id = createId('item');
    level.items.push({ ...structuredClone(it), id, x: it.x + offset.x, y: it.y + offset.y });
    ids.push(id);
  }
  for (const s of data.stairs) {
    const id = createId('stair');
    level.stairs.push({ ...structuredClone(s), id, x: s.x + offset.x, y: s.y + offset.y });
    ids.push(id);
  }
  for (const it of data.outdoor) {
    const id = createId('item');
    p.exterior.items.push({ ...structuredClone(it), id, x: it.x + offset.x, y: it.y + offset.y });
    ids.push(id);
  }
  return ids;
}

export function roomCenter(level: Level, roomId: string): Vec2 | null {
  const r = level.rooms.find((x) => x.id === roomId);
  return r ? centroid(roomPolygon(level, r)) : null;
}

export { DEFAULTS };
