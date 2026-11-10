import { Flame } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl, legs } from '../parts';

export default defineElement({
  id: 'bbq',
  name: 'Barbecue',
  kind: 'outdoor',
  category: 'Furniture',
  icon: Flame,
  tags: ['grill', 'bbq', 'outdoor kitchen'],
  size: { w: 1.3, d: 0.6, h: 1.15 },
  slots: {
    body: { label: 'Body', default: 'metal-black', category: 'fixture' },
    side: { label: 'Side tables', default: 'metal-steel', category: 'fixture' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) =>
    [
      ...legs(w * 0.55, d, 0.85, 0.04, 'body', 0.04),
      slab(w * 0.55, 0.32, d, 0, 0.75, 0, 'body', 0.04),
      cyl(d * 0.5, w * 0.55, 0, 0, 0, 'body', d * 0.5, 24, [0, 0, Math.PI / 2]),
      slab(w * 0.2, 0.03, d * 0.9, -w * 0.38, 0.88, 0, 'side'),
      slab(w * 0.2, 0.03, d * 0.9, w * 0.38, 0.88, 0, 'side'),
    ].map((p, i) => (i === 5 ? { ...p, position: [0, h - d * 0.3, 0] as [number, number, number] } : p)),
});
