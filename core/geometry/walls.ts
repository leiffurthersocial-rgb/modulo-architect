import type { Vec2 } from './vec2';
import { add, angleOf, dist, dot, lineIntersection, normalize, perp, scale, sub } from './vec2';
import { clipHalfPlane } from './polygon';

export interface WallInput {
  id: string;
  a: string;
  b: string;
  thickness: number;
}

export interface WallShape {
  id: string;
  a: Vec2;
  b: Vec2;
  /** Unit direction a→b. */
  dir: Vec2;
  /** Unit left normal (perp of dir). */
  normal: Vec2;
  length: number;
  thickness: number;
  startLeft: Vec2;
  startRight: Vec2;
  endLeft: Vec2;
  endRight: Vec2;
  /** Footprint quad: startRight → endRight → endLeft → startLeft. */
  polygon: Vec2[];
}

export interface JunctionShape {
  nodeId: string;
  polygon: Vec2[];
  wallIds: string[];
}

interface Spoke {
  wall: WallInput;
  /** True when the wall starts at this node. */
  outgoing: boolean;
  dir: Vec2;
  angle: number;
  half: number;
}

const MITER_LIMIT = 4;

/**
 * Compute mitered wall footprints for a wall graph. Each node sorts its incident walls by angle;
 * neighbouring walls meet where the left edge of one crosses the right edge of the next.
 */
export function computeWallShapes(
  nodes: Map<string, Vec2>,
  walls: WallInput[],
): { walls: Map<string, WallShape>; junctions: JunctionShape[] } {
  const spokes = new Map<string, Spoke[]>();
  const valid = walls.filter((w) => {
    const a = nodes.get(w.a);
    const b = nodes.get(w.b);
    return a && b && w.a !== w.b && dist(a, b) > 1e-6;
  });
  for (const w of valid) {
    const a = nodes.get(w.a)!;
    const b = nodes.get(w.b)!;
    const d = normalize(sub(b, a));
    push(spokes, w.a, { wall: w, outgoing: true, dir: d, angle: angleOf(d), half: w.thickness / 2 });
    const r = scale(d, -1);
    push(spokes, w.b, { wall: w, outgoing: false, dir: r, angle: angleOf(r), half: w.thickness / 2 });
  }

  // corner[wallId][end][side]
  const corners = new Map<string, { sL?: Vec2; sR?: Vec2; eL?: Vec2; eR?: Vec2 }>();
  const junctions: JunctionShape[] = [];

  for (const [nodeId, list] of spokes) {
    const n = nodes.get(nodeId)!;
    list.sort((p, q) => p.angle - q.angle);
    const pts: Vec2[] = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i]!;
      const next = list[(i + 1) % list.length]!;
      let p: Vec2;
      if (list.length === 1) {
        p = add(n, scale(perp(s.dir), s.half));
      } else {
        const leftOrigin = add(n, scale(perp(s.dir), s.half));
        const rightOrigin = add(n, scale(perp(next.dir), -next.half));
        const hit = lineIntersection(leftOrigin, s.dir, rightOrigin, next.dir);
        const limit = MITER_LIMIT * Math.max(s.half, next.half);
        if (!hit || dist(hit.point, n) > limit) {
          // Parallel (straight continuation) or very sharp angle: fall back to a square end.
          p = leftOrigin;
        } else p = hit.point;
      }
      pts.push(p);
      // p is on the left (outgoing frame) of s and the right (outgoing frame) of next.
      setCorner(corners, s, 'left', p);
      setCorner(corners, next, 'right', list.length === 1 ? add(n, scale(perp(s.dir), -s.half)) : p);
    }
    if (list.length >= 3) {
      junctions.push({ nodeId, polygon: pts, wallIds: list.map((s) => s.wall.id) });
    }
  }

  const out = new Map<string, WallShape>();
  for (const w of valid) {
    const a = nodes.get(w.a)!;
    const b = nodes.get(w.b)!;
    const dir = normalize(sub(b, a));
    const normal = perp(dir);
    const h = w.thickness / 2;
    const c = corners.get(w.id) ?? {};
    const startLeft = c.sL ?? add(a, scale(normal, h));
    const startRight = c.sR ?? add(a, scale(normal, -h));
    const endLeft = c.eL ?? add(b, scale(normal, h));
    const endRight = c.eR ?? add(b, scale(normal, -h));
    out.set(w.id, {
      id: w.id,
      a,
      b,
      dir,
      normal,
      length: dist(a, b),
      thickness: w.thickness,
      startLeft,
      startRight,
      endLeft,
      endRight,
      polygon: [startRight, endRight, endLeft, startLeft],
    });
  }
  return { walls: out, junctions };
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const l = m.get(k);
  if (l) l.push(v);
  else m.set(k, [v]);
}

function setCorner(
  corners: Map<string, { sL?: Vec2; sR?: Vec2; eL?: Vec2; eR?: Vec2 }>,
  s: Spoke,
  side: 'left' | 'right',
  p: Vec2,
) {
  const c = corners.get(s.wall.id) ?? {};
  // In the outgoing frame of the end node, "left" flips relative to the wall's a→b direction.
  if (s.outgoing) {
    if (side === 'left') c.sL = p;
    else c.sR = p;
  } else {
    if (side === 'left') c.eR = p;
    else c.eL = p;
  }
  corners.set(s.wall.id, c);
}

/* ------------------------------------------------------------------------------------------ */
/* Opening cuts                                                                                */
/* ------------------------------------------------------------------------------------------ */

export interface OpeningCut {
  id: string;
  /** Centre distance from wall start. */
  offset: number;
  width: number;
  sill: number;
  height: number;
}

export interface WallPiece {
  /** Footprint polygon in plan space. */
  polygon: Vec2[];
  y0: number;
  y1: number;
}

/**
 * Split a wall into solid prisms around its openings. Walls are straight, so a rectangular
 * opening cut is exact: slice the footprint along the wall axis and drop the void height ranges.
 */
export function wallPieces(shape: WallShape, height: number, openings: OpeningCut[]): WallPiece[] {
  const { a, dir } = shape;
  const cuts = openings
    .map((o) => ({
      u0: Math.max(0.0001, o.offset - o.width / 2),
      u1: Math.min(shape.length - 0.0001, o.offset + o.width / 2),
      y0: Math.max(0, o.sill),
      y1: Math.min(height, o.sill + o.height),
    }))
    .filter((c) => c.u1 > c.u0 && c.y1 > c.y0);

  const projA = dot(a, dir);
  if (cuts.length === 0) return [{ polygon: shape.polygon, y0: 0, y1: height }];

  const breaks = Array.from(new Set(cuts.flatMap((c) => [c.u0, c.u1]))).sort((p, q) => p - q);
  const intervals: [number, number][] = [];
  let prev = -Infinity;
  for (const b of breaks) {
    intervals.push([prev, b]);
    prev = b;
  }
  intervals.push([prev, Infinity]);

  const pieces: WallPiece[] = [];
  for (const [u0, u1] of intervals) {
    const midU = Number.isFinite(u0) && Number.isFinite(u1) ? (u0 + u1) / 2 : Number.isFinite(u0) ? u0 + 1e-3 : u1 - 1e-3;
    const voids = cuts
      .filter((c) => c.u0 <= midU && c.u1 >= midU)
      .map((c) => [c.y0, c.y1] as [number, number])
      .sort((p, q) => p[0] - q[0]);
    const solids: [number, number][] = [];
    let y = 0;
    for (const [v0, v1] of voids) {
      if (v0 > y + 1e-4) solids.push([y, v0]);
      y = Math.max(y, v1);
    }
    if (height > y + 1e-4) solids.push([y, height]);
    if (solids.length === 0) continue;
    let poly = shape.polygon;
    if (Number.isFinite(u0)) poly = clipHalfPlane(poly, dir, projA + u0);
    if (Number.isFinite(u1)) poly = clipHalfPlane(poly, scale(dir, -1), -(projA + u1));
    if (poly.length < 3) continue;
    for (const [s0, s1] of solids) pieces.push({ polygon: poly, y0: s0, y1: s1 });
  }
  return pieces;
}

/** World position along a wall's centre line. */
export const pointOnWall = (shape: { a: Vec2; dir: Vec2 }, offset: number): Vec2 => add(shape.a, scale(shape.dir, offset));
