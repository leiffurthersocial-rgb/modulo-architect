import type { Item, Level } from '@/core/model/schema';
import type { ElementDef } from '@/registry';
import { closestOnSegment, cross, dist, normalize, sub, type Vec2 } from '@/core/geometry/vec2';
import { nodePos } from '@/core/geometry/graph';
import { roundTo } from '@/core/snapping/snap';
import { itemToPlan } from '@/core/model/footprint';

export interface ItemPlacement {
  x: number;
  y: number;
  rotation: number;
  wallId: string | null;
  label: string | null;
}

/**
 * Where an item lands for a raw cursor position: backed against a nearby wall (facing into the
 * room, with the element's wall offset), otherwise on the grid. Alt disables snapping.
 */
export function placeItem(
  raw: Vec2,
  def: ElementDef,
  size: Item['size'],
  rotation: number,
  level: Level | null,
  opts: { step: number; disabled: boolean; others?: Item[] },
): ItemPlacement {
  if (opts.disabled) return { x: raw.x, y: raw.y, rotation, wallId: null, label: null };
  if (level && def.snap !== 'ceiling') {
    const reach = def.snap === 'wall' ? 1.2 : 0.45;
    let best: { d: number; wallId: string; p: Vec2; n: Vec2; t: number; a: Vec2; dir: Vec2; len: number } | null = null;
    for (const w of level.walls) {
      const a = nodePos(level, w.a);
      const b = nodePos(level, w.b);
      if (!a || !b) continue;
      const c = closestOnSegment(raw, a, b);
      const dir = normalize(sub(b, a));
      const side = Math.sign(cross(dir, sub(raw, a))) || 1;
      const n = { x: -dir.y * side, y: dir.x * side };
      // distance from the wall face to the item's back if it were backed against it
      const faceGap = c.distance - w.thickness / 2 - size.d / 2;
      if (faceGap < reach && c.t > 0.02 && c.t < 0.98 && (!best || c.distance < best.d)) {
        best = { d: c.distance, wallId: w.id, p: c.point, n, t: w.thickness, a, dir, len: dist(a, b) };
      }
    }
    if (best) {
      const back = best.t / 2 + (def.wallOffset ?? 0.02) + size.d / 2;
      // Slide along the wall in round steps, kept inside the wall.
      let along = roundTo(dist(best.a, best.p), opts.step);
      along = Math.min(Math.max(along, size.w / 2), best.len - size.w / 2);
      const x = best.a.x + best.dir.x * along + best.n.x * back;
      const y = best.a.y + best.dir.y * along + best.n.y * back;
      const rot = Math.atan2(-best.n.x, best.n.y);
      return { x: clean(x), y: clean(y), rotation: rot, wallId: best.wallId, label: 'Against wall' };
    }
  }
  // Align edges with nearby items, otherwise grid.
  let x = roundTo(raw.x, opts.step);
  let y = roundTo(raw.y, opts.step);
  let label: string | null = null;
  if (opts.others) {
    const tol = Math.max(opts.step, 0.08);
    for (const o of opts.others) {
      if (Math.abs(o.x - raw.x) < tol) {
        x = o.x;
        label = 'Aligned';
      }
      if (Math.abs(o.y - raw.y) < tol) {
        y = o.y;
        label = 'Aligned';
      }
    }
  }
  return { x: clean(x), y: clean(y), rotation, wallId: null, label };
}

export interface OpeningPlacement {
  wallId: string;
  offset: number;
  flip: boolean;
  length: number;
  a: Vec2;
  dir: Vec2;
  thickness: number;
}

/** Snap a door/window to the nearest wall, sliding in round steps and kept inside the wall. */
export function placeOpening(
  raw: Vec2,
  width: number,
  level: Level,
  opts: { step: number; disabled: boolean; radius: number; excludeId?: string },
): OpeningPlacement | null {
  let best: OpeningPlacement & { d: number } | null = null;
  for (const w of level.walls) {
    const a = nodePos(level, w.a);
    const b = nodePos(level, w.b);
    if (!a || !b) continue;
    const L = dist(a, b);
    if (L < width + 0.1) continue;
    const c = closestOnSegment(raw, a, b);
    if (c.distance > Math.max(opts.radius, w.thickness / 2 + 0.6)) continue;
    if (best && c.distance >= best.d) continue;
    const dir = normalize(sub(b, a));
    let offset = c.t * L;
    if (!opts.disabled) {
      offset = roundTo(offset, opts.step);
      if (Math.abs(offset - L / 2) < Math.max(opts.step, 0.15)) offset = L / 2;
    }
    offset = Math.min(Math.max(offset, width / 2 + 0.05), L - width / 2 - 0.05);
    const flip = cross(dir, sub(raw, a)) < 0;
    best = { wallId: w.id, offset: clean(offset), flip, length: L, a, dir, thickness: w.thickness, d: c.distance };
  }
  if (!best) return null;
  const { d: _d, ...rest } = best;
  return rest;
}

const clean = (n: number) => Math.round(n * 1e6) / 1e6 + 0;

/** Rotate a local offset into plan space around an item. */
export const localToPlan = itemToPlan;
