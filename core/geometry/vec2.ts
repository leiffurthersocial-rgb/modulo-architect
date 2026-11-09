/** Minimal immutable 2D vector math for plan-space geometry (meters). */
export interface Vec2 {
  x: number;
  y: number;
}

export const EPS = 1e-9;

export const v = (x: number, y: number): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export const mid = (a: Vec2, b: Vec2): Vec2 => lerp(a, b, 0.5);
export const equals = (a: Vec2, b: Vec2, eps = 1e-6): boolean => Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;

export function normalize(a: Vec2): Vec2 {
  const l = len(a);
  return l < EPS ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
}

/** Left-hand perpendicular (rotate +90°). */
export const perp = (a: Vec2): Vec2 => ({ x: -a.y, y: a.x });

export function rotate(a: Vec2, angle: number, origin: Vec2 = { x: 0, y: 0 }): Vec2 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dx = a.x - origin.x;
  const dy = a.y - origin.y;
  return { x: origin.x + dx * c - dy * s, y: origin.y + dx * s + dy * c };
}

export const angleOf = (a: Vec2): number => Math.atan2(a.y, a.x);

/** Normalise an angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  let r = a % (Math.PI * 2);
  if (r <= -Math.PI) r += Math.PI * 2;
  if (r > Math.PI) r -= Math.PI * 2;
  return r;
}

/** Closest point on segment ab to p, with parameter t in [0,1]. */
export function closestOnSegment(p: Vec2, a: Vec2, b: Vec2): { point: Vec2; t: number; distance: number } {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  let t = l2 < EPS ? 0 : dot(sub(p, a), ab) / l2;
  t = Math.max(0, Math.min(1, t));
  const point = lerp(a, b, t);
  return { point, t, distance: dist(p, point) };
}

/** Intersection of infinite lines p + t*r and q + u*s. Returns null when parallel. */
export function lineIntersection(p: Vec2, r: Vec2, q: Vec2, s: Vec2): { point: Vec2; t: number; u: number } | null {
  const rxs = cross(r, s);
  if (Math.abs(rxs) < 1e-9) return null;
  const qp = sub(q, p);
  const t = cross(qp, s) / rxs;
  const u = cross(qp, r) / rxs;
  return { point: add(p, scale(r, t)), t, u };
}

/** Proper intersection of segments ab and cd (excluding shared endpoints within eps). */
export function segmentIntersection(a: Vec2, b: Vec2, c: Vec2, d: Vec2, eps = 1e-6) {
  const hit = lineIntersection(a, sub(b, a), c, sub(d, c));
  if (!hit) return null;
  if (hit.t < -eps || hit.t > 1 + eps || hit.u < -eps || hit.u > 1 + eps) return null;
  return hit;
}

export const round = (n: number, step: number): number => Math.round(n / step) * step;
/** Round away floating noise so values like 2.9999999 display/save as 3. */
export const clean = (n: number): number => Math.round(n * 1e6) / 1e6;
