/**
 * Wall-graph topology operations. These mutate a Level in place and are meant to run inside an
 * Immer recipe (so every change is captured as patches for undo/redo).
 */
import type { Level, Room, Wall, Opening } from '../model/schema';
import { createId } from '../model/ids';
import type { Vec2 } from './vec2';
import { closestOnSegment, cross, dist, dot, normalize, segmentIntersection, sub, angleOf } from './vec2';
import { area, centroid, pointInPolygon, signedArea } from './polygon';

export const NODE_EPS = 1e-3;

export type WallProps = Pick<Wall, 'thickness' | 'height' | 'materials'>;

export function nodePos(level: Level, id: string): Vec2 | undefined {
  const n = level.nodes.find((x) => x.id === id);
  return n ? { x: n.x, y: n.y } : undefined;
}

export function nodeMap(level: Level): Map<string, Vec2> {
  return new Map(level.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}

export function wallsAtNode(level: Level, nodeId: string): Wall[] {
  return level.walls.filter((w) => w.a === nodeId || w.b === nodeId);
}

/** World-space centres of openings, used to re-home them after topology changes. */
function openingAnchors(level: Level, openings: Opening[]) {
  const nodes = nodeMap(level);
  return openings.map((o) => {
    const w = level.walls.find((x) => x.id === o.wallId);
    if (!w) return { o, p: null as Vec2 | null };
    const a = nodes.get(w.a)!;
    const b = nodes.get(w.b)!;
    const d = normalize(sub(b, a));
    return { o, p: { x: a.x + d.x * o.offset, y: a.y + d.y * o.offset } };
  });
}

function rehome(level: Level, anchors: { o: Opening; p: Vec2 | null }[], candidates: string[]) {
  const nodes = nodeMap(level);
  for (const { o, p } of anchors) {
    if (!p) continue;
    let best: { id: string; offset: number; d: number } | null = null;
    for (const wid of candidates) {
      const w = level.walls.find((x) => x.id === wid);
      if (!w) continue;
      const a = nodes.get(w.a)!;
      const b = nodes.get(w.b)!;
      const c = closestOnSegment(p, a, b);
      if (!best || c.distance < best.d) best = { id: w.id, offset: c.t * dist(a, b), d: c.distance };
    }
    const target = level.openings.find((x) => x.id === o.id);
    if (best && target) {
      target.wallId = best.id;
      target.offset = best.offset;
    }
  }
}

/** Split a wall at point p (projected onto it). Returns the new node id. */
export function splitWall(level: Level, wallId: string, p: Vec2): string {
  const wall = level.walls.find((w) => w.id === wallId);
  if (!wall) throw new Error(`Unknown wall ${wallId}`);
  const a = nodePos(level, wall.a)!;
  const b = nodePos(level, wall.b)!;
  const c = closestOnSegment(p, a, b);
  if (dist(c.point, a) < NODE_EPS) return wall.a;
  if (dist(c.point, b) < NODE_EPS) return wall.b;
  const anchors = openingAnchors(
    level,
    level.openings.filter((o) => o.wallId === wallId),
  );
  const nodeId = createId('node');
  level.nodes.push({ id: nodeId, x: c.point.x, y: c.point.y });
  const second: Wall = { ...structuredCloneWall(wall), id: createId('wall'), a: nodeId, b: wall.b };
  wall.b = nodeId;
  level.walls.push(second);
  // Rooms that ran along this wall gain the new node in their loop.
  for (const room of level.rooms) insertNodeInLoop(room, wall.a, second.b, nodeId);
  rehome(level, anchors, [wall.id, second.id]);
  return nodeId;
}

function structuredCloneWall(w: Wall): Wall {
  return { ...w, materials: { ...w.materials } };
}

function insertNodeInLoop(room: Room, u: string, v: string, n: string) {
  const L = room.nodes.length;
  for (let i = 0; i < L; i++) {
    const p = room.nodes[i]!;
    const q = room.nodes[(i + 1) % L]!;
    if ((p === u && q === v) || (p === v && q === u)) {
      room.nodes.splice(i + 1, 0, n);
      return;
    }
  }
}

/** Find a node at p, or split the wall under p, or create a free node. */
export function nodeAt(level: Level, p: Vec2, eps = NODE_EPS * 5): string {
  for (const n of level.nodes) if (Math.hypot(n.x - p.x, n.y - p.y) < eps) return n.id;
  const nodes = nodeMap(level);
  for (const w of level.walls) {
    const a = nodes.get(w.a)!;
    const b = nodes.get(w.b)!;
    const c = closestOnSegment(p, a, b);
    if (c.distance < eps && c.t > 0 && c.t < 1) return splitWall(level, w.id, c.point);
  }
  const id = createId('node');
  level.nodes.push({ id, x: p.x, y: p.y });
  return id;
}

/**
 * Add a straight wall from p to q. Existing walls it crosses (or touches) are split so the graph
 * stays planar; the new wall is split at each crossing as well. Returns the created wall ids.
 */
export function addWall(level: Level, p: Vec2, q: Vec2, props: WallProps): string[] {
  if (dist(p, q) < 0.01) return [];
  const startId = nodeAt(level, p);
  const endId = nodeAt(level, q);
  const P = nodePos(level, startId)!;
  const Q = nodePos(level, endId)!;

  // Collect interior points where the new segment meets existing geometry.
  const stops: { t: number; id: string }[] = [];
  const nodes = nodeMap(level);
  for (const n of level.nodes) {
    if (n.id === startId || n.id === endId) continue;
    const c = closestOnSegment({ x: n.x, y: n.y }, P, Q);
    if (c.distance < NODE_EPS * 5 && c.t > 1e-4 && c.t < 1 - 1e-4) stops.push({ t: c.t, id: n.id });
  }
  for (const w of [...level.walls]) {
    if ([w.a, w.b].some((x) => x === startId || x === endId)) continue;
    const a = nodes.get(w.a);
    const b = nodes.get(w.b);
    if (!a || !b) continue;
    const hit = segmentIntersection(P, Q, a, b);
    if (!hit || hit.t <= 1e-4 || hit.t >= 1 - 1e-4 || hit.u <= 1e-4 || hit.u >= 1 - 1e-4) continue;
    if (Math.abs(cross(normalize(sub(Q, P)), normalize(sub(b, a)))) < 1e-6) continue;
    const id = splitWall(level, w.id, hit.point);
    stops.push({ t: hit.t, id });
  }
  stops.sort((x, y) => x.t - y.t);
  const chain = [startId, ...stops.map((s) => s.id), endId].filter(
    (id, i, arr) => i === 0 || id !== arr[i - 1],
  );
  const created: string[] = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i]!;
    const b = chain[i + 1]!;
    const exists = level.walls.some((w) => (w.a === a && w.b === b) || (w.a === b && w.b === a));
    if (exists || a === b) continue;
    const id = createId('wall');
    level.walls.push({
      id,
      a,
      b,
      thickness: props.thickness,
      height: props.height,
      materials: { ...props.materials },
    });
    created.push(id);
  }
  return created;
}

/** Remove a wall, its openings, orphaned nodes, and heal collinear splits it leaves behind. */
export function removeWall(level: Level, wallId: string) {
  const wall = level.walls.find((w) => w.id === wallId);
  if (!wall) return;
  level.openings = level.openings.filter((o) => o.wallId !== wallId);
  level.walls = level.walls.filter((w) => w.id !== wallId);
  for (const nid of [wall.a, wall.b]) cleanupNode(level, nid);
}

/** Drop a node with no walls; merge two collinear walls meeting at a degree-2 node. */
export function cleanupNode(level: Level, nodeId: string) {
  const ws = wallsAtNode(level, nodeId);
  const usedByRoom = level.rooms.some((r) => r.nodes.includes(nodeId));
  if (ws.length === 0) {
    if (!usedByRoom) level.nodes = level.nodes.filter((n) => n.id !== nodeId);
    return;
  }
  if (ws.length !== 2) return;
  const [w1, w2] = ws as [Wall, Wall];
  if (Math.abs(w1.thickness - w2.thickness) > 1e-6 || w1.height !== w2.height) return;
  const o1 = w1.a === nodeId ? w1.b : w1.a;
  const o2 = w2.a === nodeId ? w2.b : w2.a;
  const n = nodePos(level, nodeId)!;
  const p1 = nodePos(level, o1)!;
  const p2 = nodePos(level, o2)!;
  const d1 = normalize(sub(p1, n));
  const d2 = normalize(sub(p2, n));
  if (Math.abs(cross(d1, d2)) > 1e-4 || dot(d1, d2) > 0) return;
  const anchors = openingAnchors(
    level,
    level.openings.filter((o) => o.wallId === w1.id || o.wallId === w2.id),
  );
  // Keep w1, stretch it from o1 to o2 (preserving w1's orientation where possible).
  if (w1.a === nodeId) w1.a = o2;
  else w1.b = o2;
  level.walls = level.walls.filter((w) => w.id !== w2.id);
  level.nodes = level.nodes.filter((x) => x.id !== nodeId);
  for (const r of level.rooms) r.nodes = r.nodes.filter((x) => x !== nodeId);
  rehome(level, anchors, [w1.id]);
}

/* ------------------------------------------------------------------------------------------ */
/* Room detection                                                                              */
/* ------------------------------------------------------------------------------------------ */

/**
 * Find the bounded faces of the planar wall graph. Each face is an ordered loop of node ids.
 * Uses the classic "turn most clockwise" half-edge walk.
 */
export function detectFaces(level: Level, minArea = 0.05): string[][] {
  const nodes = nodeMap(level);
  const adj = new Map<string, { to: string; angle: number }[]>();
  for (const w of level.walls) {
    const a = nodes.get(w.a);
    const b = nodes.get(w.b);
    if (!a || !b || w.a === w.b) continue;
    pushAdj(adj, w.a, { to: w.b, angle: angleOf(sub(b, a)) });
    pushAdj(adj, w.b, { to: w.a, angle: angleOf(sub(a, b)) });
  }
  for (const l of adj.values()) l.sort((p, q) => p.angle - q.angle);

  const visited = new Set<string>();
  const faces: string[][] = [];
  for (const [u, list] of adj) {
    for (const e of list) {
      const key = `${u}>${e.to}`;
      if (visited.has(key)) continue;
      const loop: string[] = [];
      let from = u;
      let to = e.to;
      let guard = 0;
      while (!visited.has(`${from}>${to}`) && guard++ < 10000) {
        visited.add(`${from}>${to}`);
        loop.push(from);
        const nbrs = adj.get(to)!;
        // Arriving at `to` from `from`; leave via the neighbour just before the reverse edge (CW turn).
        const idx = nbrs.findIndex((x) => x.to === from);
        const next = nbrs[(idx - 1 + nbrs.length) % nbrs.length]!;
        from = to;
        to = next.to;
      }
      const cleaned = removeSpikes(loop);
      if (cleaned.length < 3) continue;
      const poly = cleaned.map((id) => nodes.get(id)!);
      const a = signedArea(poly);
      if (a > minArea) faces.push(cleaned);
    }
  }
  return faces;
}

function pushAdj(
  m: Map<string, { to: string; angle: number }[]>,
  k: string,
  v: { to: string; angle: number },
) {
  const l = m.get(k);
  if (l) {
    if (!l.some((x) => x.to === v.to)) l.push(v);
  } else m.set(k, [v]);
}

/** Collapse back-and-forth excursions (dangling walls inside a face): a,b,a → a. */
function removeSpikes(loop: string[]): string[] {
  const out = [...loop];
  let changed = true;
  while (changed && out.length >= 3) {
    changed = false;
    for (let i = 0; i < out.length; i++) {
      const prev = out[(i - 1 + out.length) % out.length];
      const next = out[(i + 1) % out.length];
      if (prev === next) {
        out.splice(i, 1);
        const j = i % out.length;
        out.splice(j, 1);
        changed = true;
        break;
      }
    }
  }
  return out;
}

export function roomPolygon(level: Level, room: Room): Vec2[] {
  const nodes = nodeMap(level);
  return room.nodes.map((id) => nodes.get(id)).filter((p): p is Vec2 => !!p);
}

export interface RoomDefaults {
  floorMaterial: string;
  ceilingMaterial: string;
}

/**
 * Reconcile level.rooms with the faces of the wall graph. Existing rooms keep their id/name/
 * materials when their loop survives (or mostly survives) a change; split rooms hand their
 * properties to both halves; faces nobody claims become new rooms.
 * Returns ids of newly created rooms.
 */
export function syncRooms(level: Level, defaults: RoomDefaults): string[] {
  const faces = detectFaces(level);
  const nodes = nodeMap(level);
  const facePolys = faces.map((f) => f.map((id) => nodes.get(id)!));
  const old = level.rooms.map((r) => ({ room: r, set: new Set(r.nodes), poly: roomPolygon(level, r) }));

  type Cand = { fi: number; ri: number; score: number };
  const cands: Cand[] = [];
  faces.forEach((f, fi) => {
    const fc = centroid(facePolys[fi]!);
    old.forEach((o, ri) => {
      const shared = f.filter((id) => o.set.has(id)).length;
      const union = new Set([...f, ...o.set]).size;
      let score = shared / union;
      if (o.poly.length >= 3 && pointInPolygon(fc, o.poly)) score += 0.5;
      if (score > 0.2) cands.push({ fi, ri, score });
    });
  });
  cands.sort((x, y) => y.score - x.score);
  const faceTaken = new Map<number, number>();
  const roomTaken = new Set<number>();
  for (const c of cands) {
    if (faceTaken.has(c.fi) || roomTaken.has(c.ri)) continue;
    faceTaken.set(c.fi, c.ri);
    roomTaken.add(c.ri);
  }

  const next: Room[] = [];
  const created: string[] = [];
  let counter = level.rooms.length;
  faces.forEach((f, fi) => {
    const ri = faceTaken.get(fi);
    if (ri !== undefined) {
      const r = old[ri]!.room;
      r.nodes = f;
      next.push(r);
      return;
    }
    // Inherit from the old room that contained this face (a split), if any.
    const fc = centroid(facePolys[fi]!);
    const parent = old.find((o) => o.poly.length >= 3 && pointInPolygon(fc, o.poly))?.room;
    counter += 1;
    const id = createId('room');
    next.push({
      id,
      name: parent ? `${parent.name} 2` : `Room ${counter}`,
      nodes: f,
      floorMaterial: parent?.floorMaterial ?? defaults.floorMaterial,
      ceilingMaterial: parent?.ceilingMaterial ?? defaults.ceilingMaterial,
      floor: parent?.floor ?? true,
    });
    created.push(id);
  });
  level.rooms = next;
  return created;
}

/** Net floor area: centre-line polygon minus half the wall thickness all round (approximation). */
export function roomArea(level: Level, room: Room): number {
  const poly = roomPolygon(level, room);
  if (poly.length < 3) return 0;
  const gross = area(poly);
  const loopWalls = room.nodes.map((id, i) => {
    const nx = room.nodes[(i + 1) % room.nodes.length]!;
    return level.walls.find((w) => (w.a === id && w.b === nx) || (w.b === id && w.a === nx));
  });
  let perimeterLoss = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    perimeterLoss += dist(p, q) * ((loopWalls[i]?.thickness ?? 0) / 2);
  }
  return Math.max(0, gross - perimeterLoss);
}
