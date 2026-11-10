import { RectangleHorizontal } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'garden-bench',
  name: 'Garden bench',
  kind: 'outdoor',
  category: 'Furniture',
  icon: RectangleHorizontal,
  tags: ['seat', 'park bench'],
  size: { w: 1.6, d: 0.6, h: 0.85 },
  slots: {
    wood: { label: 'Slats', default: 'timber-cladding', category: 'facade' },
    frame: { label: 'Frame', default: 'metal-black', category: 'fixture' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => {
    const parts = [];
    for (const sx of [-1, 1]) {
      parts.push(slab(0.05, 0.45, d * 0.8, (sx * (w - 0.2)) / 2, 0, 0, 'frame'));
      parts.push(slab(0.05, h - 0.45, 0.05, (sx * (w - 0.2)) / 2, 0.45, -d / 2 + 0.06, 'frame'));
    }
    for (let i = 0; i < 4; i++)
      parts.push(slab(w, 0.03, d * 0.18, 0, 0.45, -d / 2 + 0.08 + i * d * 0.22, 'wood'));
    for (let i = 0; i < 3; i++) parts.push(slab(w, 0.09, 0.03, 0, 0.55 + i * 0.11, -d / 2 + 0.04, 'wood'));
    return parts;
  },
});
