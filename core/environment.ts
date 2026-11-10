/**
 * Pure layout of an outdoor environment preset around a plot: coastline, lake, road, neighbours
 * and scattered elements. Deterministic (seeded) so the scene is stable between renders.
 */
import type { Item, Site } from './model/schema';
import type { Vec2 } from './geometry/vec2';
import { bounds, pointInPolygon } from './geometry/polygon';
import type { EnvironmentPreset, Side } from '@/registry/environments/types';
import { getElement, defaultParams } from '@/registry';

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

export const SIDE_NORMAL: Record<Side, Vec2> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

export interface PlotFrame {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  cx: number;
  cy: number;
}

export function plotFrame(site: Site): PlotFrame {
  const b = bounds(site.plot);
  return { ...b, cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2 };
}

/** Coordinate along the side's normal of the plot edge on that side. */
export function edgeOffset(f: PlotFrame, side: Side) {
  switch (side) {
    case 'south':
      return f.maxY;
    case 'north':
      return -f.minY;
    case 'east':
      return f.maxX;
    case 'west':
      return -f.minX;
  }
}

/** Signed distance of p beyond the coastline (positive = in the water / off the cliff). */
export function beyondCoast(preset: EnvironmentPreset, f: PlotFrame, p: Vec2): number {
  if (!preset.coast) return -Infinity;
  const n = SIDE_NORMAL[preset.coast.side];
  return p.x * n.x + p.y * n.y - (edgeOffset(f, preset.coast.side) + preset.coast.distance);
}

export function lakePolygon(preset: EnvironmentPreset, f: PlotFrame, segments = 40): Vec2[] | null {
  const lake = preset.lake;
  if (!lake) return null;
  const n = SIDE_NORMAL[lake.side];
  const t = { x: -n.y, y: n.x };
  const edge = edgeOffset(f, lake.side) + lake.distance + lake.length / 2;
  const c = { x: f.cx * Math.abs(t.x) + n.x * edge, y: f.cy * Math.abs(t.y) + n.y * edge };
  const pts: Vec2[] = [];
  const rnd = mulberry32(hash(preset.id) ^ 0x51);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const wob = 1 + (rnd() - 0.5) * 0.12;
    const u = Math.cos(a) * (lake.width / 2) * wob;
    const v = Math.sin(a) * (lake.length / 2) * wob;
    pts.push({ x: c.x + t.x * u + n.x * v, y: c.y + t.y * u + n.y * v });
  }
  return pts;
}

export function roadRect(preset: EnvironmentPreset, f: PlotFrame, extent = 600): Vec2[] | null {
  const road = preset.road;
  if (!road) return null;
  const n = SIDE_NORMAL[road.side];
  const t = { x: -n.y, y: n.x };
  const d0 = edgeOffset(f, road.side) + road.distance;
  const d1 = d0 + road.width;
  const base = { x: f.cx * Math.abs(t.x), y: f.cy * Math.abs(t.y) };
  const P = (s: number, d: number) => ({ x: base.x + t.x * s + n.x * d, y: base.y + t.y * s + n.y * d });
  return [P(-extent, d0), P(extent, d0), P(extent, d1), P(-extent, d1)];
}

export interface Neighbour {
  x: number;
  y: number;
  rotation: number;
  w: number;
  d: number;
  h: number;
  facade: string;
  roof: string;
}

const NEIGHBOUR_FACADES = [
  'render-white',
  'brick-red',
  'render-sand',
  'timber-cladding',
  'brick-white',
  'timber-dark',
];
const NEIGHBOUR_ROOFS = ['roof-slate', 'roof-terracotta', 'roof-concrete-tile', 'roof-slate'];

export function neighbours(preset: EnvironmentPreset, f: PlotFrame): Neighbour[] {
  if (!preset.road || !preset.neighbours) return [];
  const n = SIDE_NORMAL[preset.road.side];
  const t = { x: -n.y, y: n.x };
  const rnd = mulberry32(hash(preset.id) ^ 0x99);
  const out: Neighbour[] = [];
  const plotHalf = Math.abs(t.x) ? (f.maxX - f.minX) / 2 : (f.maxY - f.minY) / 2;
  const roadFar = edgeOffset(f, preset.road.side) + preset.road.distance + preset.road.width;
  const base = { x: f.cx * Math.abs(t.x), y: f.cy * Math.abs(t.y) };
  const place = (s: number, d: number, facing: number) => {
    const w = 9 + rnd() * 4;
    const dd = 8 + rnd() * 3;
    out.push({
      x: base.x + t.x * s + n.x * d,
      y: base.y + t.y * s + n.y * d,
      rotation: Math.atan2(t.y, t.x) + (facing > 0 ? 0 : Math.PI),
      w,
      d: dd,
      h: 2.8 + (rnd() > 0.5 ? 2.8 : 0),
      facade: NEIGHBOUR_FACADES[Math.floor(rnd() * NEIGHBOUR_FACADES.length)]!,
      roof: NEIGHBOUR_ROOFS[Math.floor(rnd() * NEIGHBOUR_ROOFS.length)]!,
    });
  };
  const count = preset.neighbours;
  for (let i = 0; i < count; i++) {
    const k = Math.floor(i / 2) + 1;
    const dir = i % 2 === 0 ? 1 : -1;
    // Across the road, facing the plot.
    place(dir * (k - 0.5) * 24, roadFar + 14, -1);
    // Beside the plot on our side of the road.
    if (k <= 2) place(dir * (plotHalf + 12 + (k - 1) * 24), edgeOffset(f, preset.road.side) - 10, 1);
  }
  return out;
}

/** Scatter preset elements around the plot (never on it, in water, on the road or a neighbour). */
export function scatterItems(preset: EnvironmentPreset, site: Site): Item[] {
  const f = plotFrame(site);
  const rnd = mulberry32(hash(preset.id) ^ Math.round((f.maxX - f.minX) * 10 + (f.maxY - f.minY)));
  const lake = lakePolygon(preset, f);
  const road = roadRect(preset, f);
  const houses = neighbours(preset, f);
  const items: Item[] = [];
  let id = 0;
  for (const spec of preset.scatter) {
    const def = getElement(spec.element);
    if (!def) continue;
    let placed = 0;
    let tries = 0;
    while (placed < spec.count && tries++ < spec.count * 40) {
      const R = spec.band[1];
      const p = {
        x: f.minX - R + rnd() * (f.maxX - f.minX + 2 * R),
        y: f.minY - R + rnd() * (f.maxY - f.minY + 2 * R),
      };
      const dx = Math.max(f.minX - p.x, 0, p.x - f.maxX);
      const dy = Math.max(f.minY - p.y, 0, p.y - f.maxY);
      const d = Math.hypot(dx, dy);
      if (d < spec.band[0] || d > spec.band[1]) continue;
      const bc = beyondCoast(preset, f, p);
      let z = 0;
      if (preset.coast) {
        if (bc > -2 && !(preset.coast.kind === 'cliff' && spec.element === 'boulder' && bc > 1 && bc < 14))
          continue;
        if (spec.inland && bc > -15) continue;
        if (bc > 1) z = -preset.coast.drop;
      }
      if (lake && pointInPolygon(p, lake)) continue;
      if (lake && spec.inland) {
        const c = lake.reduce((a, q) => ({ x: a.x + q.x / lake.length, y: a.y + q.y / lake.length }), {
          x: 0,
          y: 0,
        });
        const rmax = Math.max(...lake.map((q) => Math.hypot(q.x - c.x, q.y - c.y)));
        if (Math.hypot(p.x - c.x, p.y - c.y) < rmax + 6) continue;
      }
      if (
        road &&
        pointInPolygon(
          p,
          road.map((q, i) => ({ x: q.x, y: q.y + (i < 2 ? -2 : 2) })),
        )
      )
        continue;
      if (houses.some((h) => Math.hypot(h.x - p.x, h.y - p.y) < Math.max(h.w, h.d) * 0.8)) continue;
      const k = spec.scale[0] + rnd() * (spec.scale[1] - spec.scale[0]);
      items.push({
        id: `env_${preset.id}_${id++}`,
        type: def.id,
        x: p.x,
        y: p.y,
        z,
        rotation: rnd() * Math.PI * 2,
        size: { w: def.size.w * k, d: def.size.d * k, h: def.size.h * k },
        params: defaultParams(def),
        materials: {},
      });
      placed++;
    }
  }
  return items;
}

/** Can a walker stand here? (not off the cliff / in the sea or lake) */
export function isWalkable(preset: EnvironmentPreset, site: Site, p: Vec2): boolean {
  const f = plotFrame(site);
  if (beyondCoast(preset, f, p) > -0.6) return false;
  const lake = lakePolygon(preset, f);
  if (lake && pointInPolygon(p, lake)) return false;
  return true;
}
