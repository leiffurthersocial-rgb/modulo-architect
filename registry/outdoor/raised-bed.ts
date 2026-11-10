import { Sprout } from 'lucide-react';
import { defineElement } from '../define';
import { slab, sphere } from '../parts';

export default defineElement({
  id: 'raised-bed',
  name: 'Raised bed',
  kind: 'outdoor',
  category: 'Planting',
  icon: Sprout,
  tags: ['vegetable garden', 'planter', 'herbs'],
  size: { w: 2.4, d: 1.2, h: 0.45 },
  slots: {
    wood: { label: 'Timber', default: 'timber-cladding', category: 'facade' },
    soil: { label: 'Soil', default: 'soil', category: 'terrain' },
    plants: { label: 'Plants', default: 'foliage', category: 'terrain' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => {
    const t = 0.05;
    const parts = [
      slab(w, h, t, 0, 0, -d / 2 + t / 2, 'wood'),
      slab(w, h, t, 0, 0, d / 2 - t / 2, 'wood'),
      slab(t, h, d, -w / 2 + t / 2, 0, 0, 'wood'),
      slab(t, h, d, w / 2 - t / 2, 0, 0, 'wood'),
      slab(w - 2 * t, h - 0.06, d - 2 * t, 0, 0, 0, 'soil'),
    ];
    const n = Math.max(2, Math.round(w / 0.4));
    for (let i = 0; i < n; i++)
      for (const z of [-d / 4, d / 4])
        parts.push(sphere(0.13, -w / 2 + (w / n) * (i + 0.5), h + 0.05, z, 'plants', [1, 0.8, 1]));
    return parts;
  },
});
