import type { Stair } from '../model/schema';
import type { Vec2 } from './vec2';
import { pointInPolygon, rectPolygon } from './polygon';

export interface StepBox {
  /** Centre in plan space. */
  x: number;
  y: number;
  w: number;
  d: number;
  rotation: number;
  /** Bottom and top heights above the stair's base floor. */
  y0: number;
  y1: number;
}

export interface StairLayout {
  steps: StepBox[];
  riser: number;
  tread: number;
  count: number;
  /** Plan footprint polygons (for floor openings / collision). */
  footprint: Vec2[][];
}

const MAX_RISER = 0.19;

/** Rotate a local stair point (x across, z along the climb) into plan space. */
function toPlan(s: Stair, lx: number, lz: number): Vec2 {
  const c = Math.cos(s.rotation);
  const sn = Math.sin(s.rotation);
  return { x: s.x + lx * c - lz * sn, y: s.y + lx * sn + lz * c };
}

/**
 * Stair layout. Local frame: origin at the footprint centre of the first flight, x across the
 * width, z along the run; you climb towards -z.
 */
export function stairLayout(s: Stair, rise: number): StairLayout {
  const count = Math.max(2, Math.ceil(rise / MAX_RISER));
  const riser = rise / count;
  const steps: StepBox[] = [];
  const footprint: Vec2[][] = [];

  if (s.type === 'straight') {
    const tread = s.length / count;
    for (let i = 0; i < count; i++) {
      const z = s.length / 2 - tread * (i + 0.5);
      const p = toPlan(s, 0, z);
      steps.push({ x: p.x, y: p.y, w: s.width, d: tread, rotation: s.rotation, y0: 0, y1: riser * (i + 1) });
    }
    footprint.push(rectPolygon(s.x, s.y, s.width, s.length, s.rotation));
    return { steps, riser, tread, count, footprint };
  }

  // L-shaped: flight 1 along -z, a square landing, flight 2 turning left or right.
  const n1 = Math.max(1, Math.round((count - 1) * (s.length / (s.length + s.length2))));
  const n2 = Math.max(1, count - 1 - n1);
  const t1 = s.length / n1;
  const t2 = s.length2 / n2;
  for (let i = 0; i < n1; i++) {
    const z = s.length / 2 - t1 * (i + 0.5);
    const p = toPlan(s, 0, z);
    steps.push({ x: p.x, y: p.y, w: s.width, d: t1, rotation: s.rotation, y0: 0, y1: riser * (i + 1) });
  }
  const landingZ = -s.length / 2 - s.width / 2;
  const lp = toPlan(s, 0, landingZ);
  steps.push({ x: lp.x, y: lp.y, w: s.width, d: s.width, rotation: s.rotation, y0: 0, y1: riser * (n1 + 1) });
  const dir = s.turn === 'left' ? -1 : 1;
  for (let i = 0; i < n2; i++) {
    const lx = dir * (s.width / 2 + t2 * (i + 0.5));
    const p = toPlan(s, lx, landingZ);
    steps.push({ x: p.x, y: p.y, w: t2, d: s.width, rotation: s.rotation, y0: 0, y1: riser * (n1 + 2 + i) });
  }
  footprint.push(rectPolygon(s.x, s.y, s.width, s.length, s.rotation));
  const lc = toPlan(s, 0, landingZ);
  footprint.push(rectPolygon(lc.x, lc.y, s.width, s.width, s.rotation));
  const f2 = toPlan(s, dir * (s.width / 2 + s.length2 / 2), landingZ);
  footprint.push(rectPolygon(f2.x, f2.y, s.length2, s.width, s.rotation));
  return { steps, riser, tread: t1, count, footprint };
}

/** Walking height on the stair at plan point p (null when not on it). */
export function stairHeightAt(layout: StairLayout, p: Vec2): number | null {
  let h: number | null = null;
  for (const st of layout.steps) {
    const poly = rectPolygon(st.x, st.y, st.w, st.d, st.rotation);
    if (pointInPolygon(p, poly)) h = Math.max(h ?? 0, st.y1);
  }
  return h;
}

/** Plan-space bounding polygon for the whole stair. */
export function stairOutline(s: Stair): Vec2[][] {
  return stairLayout(s, 2.8).footprint;
}
