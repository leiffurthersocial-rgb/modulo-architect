import { slab } from '../parts';
import type { Part } from '../types';

/** Jambs + head (+ optional sill) around an opening, flush with both wall faces. */
export function frame(width: number, height: number, thickness: number, opts: { sill?: boolean; profile?: number } = {}): Part[] {
  const f = opts.profile ?? 0.05;
  const t = thickness + 0.01;
  const parts = [
    slab(f, height, t, -width / 2 + f / 2, 0, 0, 'frame'),
    slab(f, height, t, width / 2 - f / 2, 0, 0, 'frame'),
    slab(width, f, t, 0, height - f, 0, 'frame'),
  ];
  if (opts.sill) parts.push(slab(width + 0.06, 0.03, t + 0.06, 0, -0.01, 0, 'frame'));
  return parts;
}

/** A door leaf hinged at x = -w/2, swinging towards +z by `open` (0..1). */
export function leaf(x0: number, w: number, h: number, open: number, material = 'leaf'): Part {
  const a = (open * Math.PI) / 2;
  const t = 0.04;
  return {
    geom: { kind: 'box', size: [w, h, t] },
    position: [x0 + (Math.cos(a) * w) / 2, h / 2, (Math.sin(a) * w) / 2],
    rotation: [0, -a, 0],
    material,
  };
}
