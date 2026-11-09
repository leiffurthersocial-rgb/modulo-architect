import { PanelsLeftRight } from 'lucide-react';
import { defineOpening } from '../define';
import { frame } from './frame';
import { slab } from '../parts';
import type { Part } from '../types';

/** A sash: thin perimeter frame plus a glass pane, bottom-centred at (x, 0, z). */
function sash(x: number, z: number, w: number, h: number): Part[] {
  const b = 0.05;
  const t = 0.04;
  return [
    slab(b, h, t, x - w / 2 + b / 2, 0, z, 'frame'),
    slab(b, h, t, x + w / 2 - b / 2, 0, z, 'frame'),
    slab(w, b, t, x, 0, z, 'frame'),
    slab(w, b, t, x, h - b, z, 'frame'),
    { ...slab(w - 2 * b, h - 2 * b, 0.012, x, b, z, 'glass'), noShadow: true },
  ];
}

export default defineOpening({
  id: 'door-sliding',
  name: 'Sliding glass door',
  kind: 'door',
  icon: PanelsLeftRight,
  defaults: { width: 2.4, height: 2.2, sill: 0 },
  swing: 'sliding',
  build: ({ width, height, thickness, params }) => {
    const open = Number(params.open ?? 0);
    const f = 0.05;
    const pw = (width - 2 * f) / 2 + 0.03;
    const ph = height - f;
    const shift = open * (pw - 0.06);
    return [
      ...frame(width, height, thickness, { profile: f }),
      ...sash(-width / 2 + f + pw / 2, -0.03, pw, ph),
      ...sash(width / 2 - f - pw / 2 - shift, 0.03, pw, ph),
    ];
  },
});
