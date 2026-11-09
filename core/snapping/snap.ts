import type { Vec2 } from '../geometry/vec2';
import { add, angleOf, closestOnSegment, dist, lineIntersection, scale, sub, wrapAngle } from '../geometry/vec2';

export type SnapKind =
  | 'endpoint'
  | 'midpoint'
  | 'intersection'
  | 'edge'
  | 'angle'
  | 'perpendicular'
  | 'parallel'
  | 'align'
  | 'grid'
  | 'free';

export const SNAP_LABEL: Record<SnapKind, string> = {
  endpoint: 'Endpoint',
  midpoint: 'Midpoint',
  intersection: 'Intersection',
  edge: 'On wall',
  angle: 'Angle',
  perpendicular: 'Perpendicular',
  parallel: 'Parallel',
  align: 'Aligned',
  grid: 'Grid',
  free: '',
};

export interface SnapTarget {
  points: Vec2[];
  midpoints: Vec2[];
  segments: { a: Vec2; b: Vec2 }[];
}

export interface SnapOptions {
  /** Grid / length step in meters. */
  step: number;
  /** Capture radius in meters (derived from screen pixels). */
  radius: number;
  /** Previous point when drawing: enables angle + length snapping. */
  anchor?: Vec2;
  /** Angle increment in degrees. */
  angleStep?: number;
  /** Constrain to the nearest axis (Shift). */
  axisLock?: boolean;
  /** Snapping disabled (Alt). Axis lock still applies. */
  disabled?: boolean;
  /** Skip geometry snaps (e.g. while moving the node being snapped). */
  exclude?: (p: Vec2) => boolean;
}

export interface SnapResult {
  point: Vec2;
  kind: SnapKind;
  guides: { a: Vec2; b: Vec2 }[];
}

/** Choose a round step so one step spans at least `minPx` screen pixels. */
export function smartStep(metersPerPixel: number, minPx = 12): number {
  const steps = [0.05, 0.1, 0.25, 0.5, 1, 2, 5];
  for (const s of steps) if (s / metersPerPixel >= minPx) return s;
  return 5;
}

export const roundTo = (n: number, step: number) => Math.round(n / step) * step;

const snapGrid = (p: Vec2, step: number): Vec2 => ({ x: clean(roundTo(p.x, step)), y: clean(roundTo(p.y, step)) });
const clean = (n: number) => Math.round(n * 1e6) / 1e6 + 0;

export function snapPoint(raw: Vec2, target: SnapTarget, opts: SnapOptions): SnapResult {
  const { anchor } = opts;
  const angleStep = ((opts.angleStep ?? 15) * Math.PI) / 180;

  if (opts.disabled) {
    if (anchor && opts.axisLock) return { point: axisLocked(raw, anchor), kind: 'free', guides: [] };
    return { point: raw, kind: 'free', guides: [] };
  }

  const usable = (p: Vec2) => !opts.exclude || !opts.exclude(p);

  // 1. Endpoints and midpoints win when close enough.
  if (!opts.axisLock) {
    const ep = nearest(raw, target.points.filter(usable), opts.radius);
    if (ep) return { point: ep, kind: 'endpoint', guides: [] };
    const mp = nearest(raw, target.midpoints.filter(usable), opts.radius);
    if (mp) return { point: mp, kind: 'midpoint', guides: [] };
  }

  if (anchor) return snapFromAnchor(raw, anchor, target, opts, angleStep, usable);

  // 2. Alignment with existing points (both axes → intersection of guides).
  const ax = alignment(raw, target.points.filter(usable), opts.radius);
  // 3. On-wall projection.
  let best: { p: Vec2; d: number; seg: { a: Vec2; b: Vec2 } } | null = null;
  for (const seg of target.segments) {
    const c = closestOnSegment(raw, seg.a, seg.b);
    if (c.distance < opts.radius && (!best || c.distance < best.d)) best = { p: c.point, d: c.distance, seg };
  }
  if (best) {
    // Slide along the wall in round increments from its start.
    const len = dist(best.seg.a, best.seg.b);
    const along = roundTo(dist(best.seg.a, best.p), opts.step);
    const t = len > 0 ? Math.min(1, Math.max(0, along / len)) : 0;
    const p = add(best.seg.a, scale(sub(best.seg.b, best.seg.a), t));
    if (ax.x !== null || ax.y !== null) {
      // Prefer alignment along the wall if a guide crosses it.
      const guide = ax.x !== null ? { p: { x: ax.x, y: 0 }, d: { x: 0, y: 1 } } : { p: { x: 0, y: ax.y! }, d: { x: 1, y: 0 } };
      const hit = lineIntersection(best.seg.a, sub(best.seg.b, best.seg.a), guide.p, guide.d);
      if (hit && hit.t >= 0 && hit.t <= 1 && dist(hit.point, raw) < opts.radius * 1.5)
        return { point: hit.point, kind: 'align', guides: ax.guides };
    }
    return { point: p, kind: 'edge', guides: [] };
  }
  if (ax.x !== null || ax.y !== null) {
    const g = snapGrid(raw, opts.step);
    return { point: { x: ax.x ?? g.x, y: ax.y ?? g.y }, kind: 'align', guides: ax.guides.map((l) => fixGuide(l, ax, g)) };
  }
  return { point: snapGrid(raw, opts.step), kind: 'grid', guides: [] };
}

function fixGuide(l: { a: Vec2; b: Vec2 }, ax: { x: number | null; y: number | null }, g: Vec2) {
  // Extend the guide to the snapped point.
  return { a: l.a, b: { x: ax.x ?? g.x, y: ax.y ?? g.y } };
}

function snapFromAnchor(
  raw: Vec2,
  anchor: Vec2,
  target: SnapTarget,
  opts: SnapOptions,
  angleStep: number,
  usable: (p: Vec2) => boolean,
): SnapResult {
  const v = sub(raw, anchor);
  const length = Math.hypot(v.x, v.y);
  if (length < 1e-6) return { point: anchor, kind: 'free', guides: [] };
  const ang = angleOf(v);

  // Candidate directions: angle grid, plus walls' directions (parallel / perpendicular).
  type Cand = { a: number; kind: SnapKind; tol: number; prio: number };
  const cands: Cand[] = [];
  const steps = Math.round((Math.PI * 2) / angleStep);
  for (let i = 0; i < steps; i++) {
    const a = i * angleStep;
    const isRight = Math.abs(wrapAngle(a) % (Math.PI / 2)) < 1e-6;
    cands.push({ a, kind: 'angle', tol: isRight ? 0.12 : 0.06, prio: isRight ? 2 : 1 });
  }
  if (!opts.axisLock) {
    for (const s of target.segments) {
      const wa = angleOf(sub(s.b, s.a));
      for (const k of [0, Math.PI]) cands.push({ a: wa + k, kind: 'parallel', tol: 0.05, prio: 1.5 });
      for (const k of [Math.PI / 2, -Math.PI / 2]) cands.push({ a: wa + k, kind: 'perpendicular', tol: 0.05, prio: 1.5 });
    }
  }
  let chosen: Cand | null = null;
  if (opts.axisLock) {
    const a = Math.round(ang / (Math.PI / 2)) * (Math.PI / 2);
    chosen = { a, kind: 'angle', tol: Math.PI, prio: 3 };
  } else {
    let bestScore = Infinity;
    for (const c of cands) {
      const diff = Math.abs(wrapAngle(ang - c.a));
      if (diff > c.tol) continue;
      const score = diff / c.prio;
      if (score < bestScore) {
        bestScore = score;
        chosen = c;
      }
    }
  }

  if (!chosen) {
    // Free direction, but still round the length.
    const L = Math.max(opts.step, roundTo(length, opts.step));
    return { point: add(anchor, scale(v, L / length)), kind: 'grid', guides: [] };
  }
  const dir = { x: Math.cos(chosen.a), y: Math.sin(chosen.a) };
  const along = v.x * dir.x + v.y * dir.y;

  // Alignment: does the ray cross a guide through an existing point near the cursor?
  if (!opts.axisLock || true) {
    let bestAlign: { p: Vec2; guide: { a: Vec2; b: Vec2 }; d: number } | null = null;
    for (const p of target.points) {
      if (!usable(p) || dist(p, anchor) < 1e-6) continue;
      for (const gd of [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ]) {
        const hit = lineIntersection(anchor, dir, p, gd);
        if (!hit || hit.t <= 0) continue;
        const d = Math.abs(hit.t - along);
        if (d < opts.radius && (!bestAlign || d < bestAlign.d)) bestAlign = { p: hit.point, guide: { a: p, b: hit.point }, d };
      }
    }
    if (bestAlign) return { point: bestAlign.p, kind: 'align', guides: [bestAlign.guide] };
  }

  const L = Math.max(opts.step, roundTo(along, opts.step));
  const point = { x: clean(anchor.x + dir.x * L), y: clean(anchor.y + dir.y * L) };
  return { point, kind: chosen.kind, guides: [{ a: anchor, b: point }] };
}

function axisLocked(raw: Vec2, anchor: Vec2): Vec2 {
  const v = sub(raw, anchor);
  return Math.abs(v.x) >= Math.abs(v.y) ? { x: raw.x, y: anchor.y } : { x: anchor.x, y: raw.y };
}

function nearest(p: Vec2, list: Vec2[], radius: number): Vec2 | null {
  let best: Vec2 | null = null;
  let bd = radius;
  for (const q of list) {
    const d = dist(p, q);
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  return best;
}

function alignment(p: Vec2, points: Vec2[], radius: number) {
  let x: number | null = null;
  let y: number | null = null;
  let dx = radius * 0.6;
  let dy = radius * 0.6;
  const guides: { a: Vec2; b: Vec2 }[] = [];
  let gx: Vec2 | null = null;
  let gy: Vec2 | null = null;
  for (const q of points) {
    if (Math.abs(q.x - p.x) < dx) {
      dx = Math.abs(q.x - p.x);
      x = q.x;
      gx = q;
    }
    if (Math.abs(q.y - p.y) < dy) {
      dy = Math.abs(q.y - p.y);
      y = q.y;
      gy = q;
    }
  }
  if (gx) guides.push({ a: gx, b: { x: gx.x, y: p.y } });
  if (gy) guides.push({ a: gy, b: { x: p.x, y: gy.y } });
  return { x, y, guides };
}

/** Snap a translation delta (moving objects) to round values, honouring axis lock. */
export function snapDelta(delta: Vec2, step: number, opts: { axisLock?: boolean; disabled?: boolean } = {}): Vec2 {
  let d = delta;
  if (opts.axisLock) d = Math.abs(d.x) >= Math.abs(d.y) ? { x: d.x, y: 0 } : { x: 0, y: d.y };
  if (opts.disabled) return d;
  return { x: clean(roundTo(d.x, step)), y: clean(roundTo(d.y, step)) };
}

/** Snap an angle (radians) to the angle step unless disabled. */
export function snapAngle(a: number, stepDeg = 15, disabled = false): number {
  if (disabled) return a;
  const s = (stepDeg * Math.PI) / 180;
  return Math.round(a / s) * s;
}
