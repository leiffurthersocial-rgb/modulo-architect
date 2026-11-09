import { Utensils } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'dining-table-round',
  name: 'Round table',
  kind: 'furniture',
  category: 'Dining',
  icon: Utensils,
  tags: ['bistro', 'table'],
  size: { w: 1.1, d: 1.1, h: 0.75 },
  slots: {
    top: { label: 'Top', default: 'lacquer-white', category: 'furniture' },
    base: { label: 'Base', default: 'metal-black', category: 'furniture' },
  },
  snap: 'floor',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 16 }, (_, i) => ({ x: (Math.cos((i / 16) * Math.PI * 2) * w) / 2, y: (Math.sin((i / 16) * Math.PI * 2) * w) / 2 })),
  build: ({ size: { w, h } }) => [
    cyl(w / 2, 0.03, 0, h - 0.03, 0, 'top', w / 2, 48),
    cyl(0.04, h - 0.05, 0, 0.02, 0, 'base', 0.04, 16),
    cyl(0.25, 0.02, 0, 0, 0, 'base', 0.22, 32),
  ],
});
