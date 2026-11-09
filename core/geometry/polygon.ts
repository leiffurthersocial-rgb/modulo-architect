import { type Vec2, cross, sub, closestOnSegment, EPS } from './vec2';

/** Signed area (positive = counter-clockwise in a y-up frame). */
export function signedArea(poly: Vec2[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export const area = (poly: Vec2[]): number => Math.abs(signedArea(poly));

export function centroid(poly: Vec2[]): Vec2 {
  const a = signedArea(poly);
  if (Math.abs(a) < EPS) {
    const n = poly.length || 1;
    return { x: poly.reduce((s, p) => s + p.x, 0) / n, y: poly.reduce((s, p) => s + p.y, 0) / n };
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const f = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function perimeter(poly: Vec2[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    s += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return s;
}

export function bounds(points: Vec2[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/** Distance from p to polygon boundary. */
export function distanceToPolygon(p: Vec2, poly: Vec2[]): number {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    d = Math.min(d, closestOnSegment(p, poly[i]!, poly[(i + 1) % poly.length]!).distance);
  }
  return d;
}

/** Convex polygon overlap via the separating axis theorem. Touching edges do not count. */
export function convexOverlap(a: Vec2[], b: Vec2[], tolerance = 1e-4): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!;
      const q = poly[(i + 1) % poly.length]!;
      const axis = { x: -(q.y - p.y), y: q.x - p.x };
      let minA = Infinity;
      let maxA = -Infinity;
      let minB = Infinity;
      let maxB = -Infinity;
      for (const v of a) {
        const d = v.x * axis.x + v.y * axis.y;
        minA = Math.min(minA, d);
        maxA = Math.max(maxA, d);
      }
      for (const v of b) {
        const d = v.x * axis.x + v.y * axis.y;
        minB = Math.min(minB, d);
        maxB = Math.max(maxB, d);
      }
      const l = Math.hypot(axis.x, axis.y) || 1;
      if (maxA - minB <= tolerance * l || maxB - minA <= tolerance * l) return false;
    }
  }
  return true;
}

/** Clip a convex polygon by the half-plane where dot(n, p) >= c (Sutherland–Hodgman). */
export function clipHalfPlane(poly: Vec2[], n: Vec2, c: number): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i]!;
    const prev = poly[(i + poly.length - 1) % poly.length]!;
    const dc = cur.x * n.x + cur.y * n.y - c;
    const dp = prev.x * n.x + prev.y * n.y - c;
    if (dc >= 0) {
      if (dp < 0) out.push(intersectAt(prev, cur, dp, dc));
      out.push(cur);
    } else if (dp >= 0) {
      out.push(intersectAt(prev, cur, dp, dc));
    }
  }
  return out;
}

function intersectAt(a: Vec2, b: Vec2, da: number, db: number): Vec2 {
  const t = da / (da - db);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Oriented rectangle corners, centred at (cx, cy), rotated by `rotation` radians. */
export function rectPolygon(cx: number, cy: number, w: number, d: number, rotation: number): Vec2[] {
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  const hw = w / 2;
  const hd = d / 2;
  return [
    { x: -hw, y: -hd },
    { x: hw, y: -hd },
    { x: hw, y: hd },
    { x: -hw, y: hd },
  ].map((p) => ({ x: cx + p.x * c - p.y * s, y: cy + p.x * s + p.y * c }));
}

export function isConvex(poly: Vec2[]): boolean {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const c = poly[(i + 2) % poly.length]!;
    const z = cross(sub(b, a), sub(c, b));
    if (Math.abs(z) < EPS) continue;
    const s = Math.sign(z);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/** Shrink/grow a simple polygon by offsetting each edge (miter joins). Positive = outward for CCW. */
export function offsetPolygon(poly: Vec2[], d: number): Vec2[] {
  const ccw = signedArea(poly) > 0;
  const k = ccw ? 1 : -1;
  const n = poly.length;
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const prev = poly[(i + n - 1) % n]!;
    const cur = poly[i]!;
    const next = poly[(i + 1) % n]!;
    const e1 = normalizeSafe(sub(cur, prev));
    const e2 = normalizeSafe(sub(next, cur));
    const n1 = { x: e1.y * k, y: -e1.x * k };
    const n2 = { x: e2.y * k, y: -e2.x * k };
    const bis = { x: n1.x + n2.x, y: n1.y + n2.y };
    const bl = Math.hypot(bis.x, bis.y);
    if (bl < 1e-6) {
      out.push({ x: cur.x + n1.x * d, y: cur.y + n1.y * d });
      continue;
    }
    const cosHalf = (bis.x * n1.x + bis.y * n1.y) / bl;
    const m = d / Math.max(cosHalf, 0.2);
    out.push({ x: cur.x + (bis.x / bl) * m, y: cur.y + (bis.y / bl) * m });
  }
  return out;
}

function normalizeSafe(a: Vec2): Vec2 {
  const l = Math.hypot(a.x, a.y);
  return l < EPS ? { x: 1, y: 0 } : { x: a.x / l, y: a.y / l };
}
