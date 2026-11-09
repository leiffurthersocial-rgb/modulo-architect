import { AppWindow } from 'lucide-react';
import { defineOpening } from '../define';
import { frame } from './frame';
import { slab } from '../parts';

export default defineOpening({
  id: 'window-casement',
  name: 'Window',
  kind: 'window',
  icon: AppWindow,
  defaults: { width: 1.2, height: 1.3, sill: 0.9 },
  swing: 'none',
  params: [{ key: 'panes', label: 'Panes', type: 'number', default: 2, min: 1, max: 4, step: 1 }],
  build: ({ width, height, thickness, params }) => {
    const n = Math.max(1, Math.round(Number(params.panes ?? 2)));
    const f = 0.06;
    const parts = [...frame(width, height, thickness, { sill: true, profile: f }), slab(width - 2 * f, f, thickness * 0.6, 0, 0, 0, 'frame')];
    const inner = width - 2 * f;
    for (let i = 1; i < n; i++) parts.push(slab(0.05, height - 2 * f, 0.07, -inner / 2 + (inner * i) / n, f, 0, 'frame'));
    parts.push({ ...slab(inner, height - 2 * f, 0.012, 0, f, 0, 'glass'), noShadow: true });
    return parts;
  },
});
