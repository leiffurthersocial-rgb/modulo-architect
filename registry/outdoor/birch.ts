import { TreeDeciduous } from 'lucide-react';
import { defineElement } from '../define';
import { cyl, sphere } from '../parts';

export default defineElement({
  id: 'birch',
  name: 'Birch',
  kind: 'outdoor',
  category: 'Planting',
  icon: TreeDeciduous,
  tags: ['tree', 'silver birch', 'slender'],
  size: { w: 2.6, d: 2.6, h: 7 },
  slots: {
    bark: { label: 'Trunk', default: 'lacquer-white', category: 'terrain' },
    leaves: { label: 'Crown', default: 'foliage-light', category: 'terrain' },
  },
  snap: 'ground',
  footprint: () =>
    Array.from({ length: 8 }, (_, i) => ({
      x: Math.cos((i / 8) * Math.PI * 2) * 0.15,
      y: Math.sin((i / 8) * Math.PI * 2) * 0.15,
    })),
  build: ({ size: { w, h } }) => [
    cyl(0.11, h * 0.75, 0, 0, 0, 'bark', 0.06, 10),
    sphere(w * 0.32, 0, h * 0.62, 0, 'leaves', [1, 1.6, 1]),
    sphere(w * 0.24, w * 0.12, h * 0.8, -w * 0.05, 'leaves', [1, 1.4, 1]),
    sphere(w * 0.2, -w * 0.1, h * 0.5, w * 0.08, 'leaves', [1, 1.3, 1]),
  ],
});
