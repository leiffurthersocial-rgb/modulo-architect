import polygonClipping, { type Polygon as PCPolygon } from 'polygon-clipping';
import type { Vec2 } from './vec2';
import { area } from './polygon';

/** A filled region: an outer ring with optional holes. */
export interface Region {
  outer: Vec2[];
  holes: Vec2[][];
}

const toRing = (poly: Vec2[]): [number, number][] => {
  const ring = poly.map((p) => [p.x, p.y] as [number, number]);
  if (ring.length) ring.push(ring[0]!);
  return ring;
};

const fromRing = (ring: [number, number][]): Vec2[] => {
  const pts = ring.map(([x, y]) => ({ x, y }));
  // polygon-clipping closes rings by repeating the first point.
  if (pts.length > 1 && pts[0]!.x === pts[pts.length - 1]!.x && pts[0]!.y === pts[pts.length - 1]!.y)
    pts.pop();
  return pts;
};

/**
 * Boolean difference `poly − cuts`, robust to cuts that only partly overlap (e.g. a stairwell
 * crossing a wall between two rooms). Returns zero or more regions.
 */
export function subtract(poly: Vec2[], cuts: Vec2[][]): Region[] {
  if (poly.length < 3) return [];
  const relevant = cuts.filter((c) => c.length >= 3);
  if (relevant.length === 0) return [{ outer: poly, holes: [] }];
  try {
    const result = polygonClipping.difference(
      [toRing(poly)] as PCPolygon,
      ...relevant.map((c) => [toRing(c)] as PCPolygon),
    );
    return result
      .map(([outer, ...holes]) => ({ outer: fromRing(outer!), holes: holes.map(fromRing) }))
      .filter((r) => r.outer.length >= 3 && area(r.outer) > 1e-4);
  } catch {
    // Degenerate input: fall back to the uncut polygon rather than losing the floor.
    return [{ outer: poly, holes: [] }];
  }
}

export const regionArea = (r: Region) => area(r.outer) - r.holes.reduce((s, h) => s + area(h), 0);
