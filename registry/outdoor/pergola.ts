import { Columns3 } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'pergola',
  name: 'Pergola',
  kind: 'outdoor',
  category: 'Structures',
  icon: Columns3,
  tags: ['arbor', 'shade', 'gazebo'],
  size: { w: 4, d: 3, h: 2.6 },
  slots: { wood: { label: 'Timber', default: 'timber-dark', category: 'facade' } },
  snap: 'ground',
  footprint: ({ size: { w, d } }) => [
    { x: -w / 2, y: -d / 2 },
    { x: -w / 2 + 0.12, y: -d / 2 },
    { x: -w / 2 + 0.12, y: -d / 2 + 0.12 },
    { x: -w / 2, y: -d / 2 + 0.12 },
  ],
  solid: false,
  build: ({ size: { w, d, h } }) => {
    const p = 0.12;
    const parts = [
      slab(p, h, p, -w / 2 + p / 2, 0, -d / 2 + p / 2, 'wood'),
      slab(p, h, p, w / 2 - p / 2, 0, -d / 2 + p / 2, 'wood'),
      slab(p, h, p, -w / 2 + p / 2, 0, d / 2 - p / 2, 'wood'),
      slab(p, h, p, w / 2 - p / 2, 0, d / 2 - p / 2, 'wood'),
      slab(w + 0.3, 0.18, 0.08, 0, h, -d / 2 + p / 2, 'wood'),
      slab(w + 0.3, 0.18, 0.08, 0, h, d / 2 - p / 2, 'wood'),
    ];
    const n = Math.max(3, Math.round(w / 0.4));
    for (let i = 0; i <= n; i++)
      parts.push(slab(0.05, 0.14, d + 0.4, -w / 2 + (w * i) / n, h + 0.18, 0, 'wood'));
    return parts;
  },
});
