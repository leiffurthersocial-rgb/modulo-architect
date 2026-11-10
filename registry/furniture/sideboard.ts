import { Archive } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'sideboard',
  name: 'Sideboard',
  kind: 'furniture',
  category: 'Dining',
  icon: Archive,
  tags: ['credenza', 'buffet', 'storage', 'cabinet'],
  size: { w: 1.8, d: 0.45, h: 0.78 },
  params: [{ key: 'doors', label: 'Doors', type: 'number', default: 4, min: 2, max: 6, step: 1 }],
  slots: {
    body: { label: 'Body', default: 'wood-walnut', category: 'furniture' },
    legs: { label: 'Legs', default: 'metal-black', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.03,
  build: ({ size: { w, d, h }, params }) => {
    const legH = 0.16;
    const n = Math.max(2, Math.round(Number(params.doors) || 4));
    const parts = [
      slab(w, h - legH, d, 0, legH, 0, 'body', 0.008),
      ...legs(w, d, legH, 0.06, 'legs', 0.025, true),
    ];
    for (let i = 1; i < n; i++)
      parts.push(slab(0.004, h - legH - 0.04, 0.006, -w / 2 + (w * i) / n, legH + 0.02, d / 2, 'legs'));
    return parts;
  },
});
