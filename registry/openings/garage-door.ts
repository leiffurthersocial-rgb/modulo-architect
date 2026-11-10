import { Warehouse } from 'lucide-react';
import { defineOpening } from '../define';
import { frame } from './frame';
import { slab } from '../parts';

export default defineOpening({
  id: 'garage-door',
  name: 'Garage door',
  kind: 'door',
  icon: Warehouse,
  defaults: { width: 2.5, height: 2.2, sill: 0 },
  swing: 'sliding',
  build: ({ width, height, thickness, params }) => {
    const open = Number(params.open ?? 0);
    const f = 0.06;
    const panelH = (height - f) * (1 - open * 0.92);
    const parts = [...frame(width, height, thickness, { profile: f })];
    const n = 5;
    for (let i = 0; i < n; i++) {
      const h = panelH / n;
      if (h > 0.01)
        parts.push(
          slab(width - 2 * f, h - 0.01, 0.04, 0, height - f - panelH + h * i, -thickness / 4, 'leaf', 0.004),
        );
    }
    return parts;
  },
});
