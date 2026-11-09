import { Sprout } from 'lucide-react';
import { defineElement } from '../define';
import { cyl, sphere } from '../parts';

export default defineElement({
  id: 'plant',
  name: 'Potted plant',
  kind: 'furniture',
  category: 'Decor',
  icon: Sprout,
  tags: ['plant', 'green', 'fig'],
  size: { w: 0.5, d: 0.5, h: 1.3 },
  slots: {
    pot: { label: 'Pot', default: 'terracotta-pot', category: 'furniture' },
    leaves: { label: 'Leaves', default: 'foliage', category: 'furniture' },
  },
  snap: 'floor',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 10 }, (_, i) => ({
      x: (Math.cos((i / 10) * Math.PI * 2) * w) / 2,
      y: (Math.sin((i / 10) * Math.PI * 2) * w) / 2,
    })),
  build: ({ size: { w, h } }) => [
    cyl(w * 0.32, h * 0.28, 0, 0, 0, 'pot', w * 0.4, 24),
    cyl(0.02, h * 0.4, 0, h * 0.28, 0, 'bark', 0.015, 8),
    sphere(w * 0.42, 0, h * 0.7, 0, 'leaves', [1, 1.1, 1]),
    sphere(w * 0.3, w * 0.15, h * 0.88, -w * 0.08, 'leaves'),
    sphere(w * 0.28, -w * 0.16, h * 0.62, w * 0.1, 'leaves'),
  ],
});
