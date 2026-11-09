import { TreeDeciduous } from 'lucide-react';
import { defineElement } from '../define';
import { cyl, sphere } from '../parts';

export default defineElement({
  id: 'tree',
  name: 'Tree',
  kind: 'outdoor',
  category: 'Planting',
  icon: TreeDeciduous,
  tags: ['oak', 'maple', 'deciduous'],
  size: { w: 4, d: 4, h: 6 },
  slots: {
    bark: { label: 'Trunk', default: 'bark', category: 'terrain' },
    leaves: { label: 'Crown', default: 'foliage', category: 'terrain' },
  },
  snap: 'ground',
  footprint: () => Array.from({ length: 8 }, (_, i) => ({ x: Math.cos((i / 8) * Math.PI * 2) * 0.25, y: Math.sin((i / 8) * Math.PI * 2) * 0.25 })),
  build: ({ size: { w, h } }) => [
    cyl(0.16, h * 0.5, 0, 0, 0, 'bark', 0.11, 12),
    sphere(w * 0.42, 0, h * 0.62, 0, 'leaves', [1, 0.85, 1]),
    sphere(w * 0.3, w * 0.18, h * 0.78, w * 0.08, 'leaves'),
    sphere(w * 0.28, -w * 0.16, h * 0.72, -w * 0.1, 'leaves'),
  ],
});
