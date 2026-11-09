import { Toilet } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl, sphere } from '../parts';

export default defineElement({
  id: 'toilet',
  name: 'Toilet',
  kind: 'furniture',
  category: 'Bathroom',
  icon: Toilet,
  tags: ['wc', 'loo'],
  size: { w: 0.38, d: 0.58, h: 0.8 },
  resizable: { w: false, d: false, h: false },
  slots: { ceramic: { label: 'Ceramic', default: 'ceramic', category: 'fixture' } },
  snap: 'floor',
  wallOffset: 0,
  build: ({ size: { w, d, h } }) => [
    slab(w, h, 0.16, 0, 0, -d / 2 + 0.08, 'ceramic', 0.03),
    sphere(0.19, 0, 0.3, 0.05, 'ceramic', [1, 0.65, 1.3]),
    cyl(0.12, 0.3, 0, 0, -0.02, 'ceramic', 0.15, 24),
    slab(w - 0.02, 0.025, 0.42, 0, 0.4, 0.06, 'ceramic', 0.01),
  ],
});
