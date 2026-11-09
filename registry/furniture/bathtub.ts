import { Bath } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'bathtub',
  name: 'Bathtub',
  kind: 'furniture',
  category: 'Bathroom',
  icon: Bath,
  tags: ['bath', 'tub'],
  size: { w: 1.7, d: 0.75, h: 0.58 },
  slots: {
    ceramic: { label: 'Tub', default: 'ceramic', category: 'fixture' },
    water: { label: 'Water', default: 'water', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0,
  build: ({ size: { w, d, h } }) => {
    const t = 0.07;
    return [
      slab(w, 0.12, d, 0, 0, 0, 'ceramic', 0.03),
      slab(w, h - 0.12, t, 0, 0.12, -d / 2 + t / 2, 'ceramic', 0.03),
      slab(w, h - 0.12, t, 0, 0.12, d / 2 - t / 2, 'ceramic', 0.03),
      slab(t, h - 0.12, d, -w / 2 + t / 2, 0.12, 0, 'ceramic', 0.03),
      slab(t, h - 0.12, d, w / 2 - t / 2, 0.12, 0, 'ceramic', 0.03),
      { ...slab(w - 2 * t, 0.01, d - 2 * t, 0, h * 0.62, 0, 'water'), noShadow: true },
    ];
  },
});
