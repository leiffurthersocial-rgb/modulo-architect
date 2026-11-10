import { BedSingle } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'bunk-bed',
  name: 'Bunk bed',
  kind: 'furniture',
  category: 'Bedroom',
  icon: BedSingle,
  tags: ['kids', 'children', 'loft'],
  size: { w: 1.0, d: 2.1, h: 1.7 },
  slots: {
    frame: { label: 'Frame', default: 'wood-oak', category: 'furniture' },
    bedding: { label: 'Bedding', default: 'mattress', category: 'furniture' },
    throw: { label: 'Throws', default: 'fabric-sage', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.02,
  build: ({ size: { w, d, h } }) => {
    const p = 0.06;
    const parts = [];
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) parts.push(slab(p, h, p, (sx * (w - p)) / 2, 0, (sz * (d - p)) / 2, 'frame'));
    for (const y of [0.2, h * 0.58]) {
      parts.push(slab(w, 0.06, d, 0, y, 0, 'frame'));
      parts.push(slab(w - 0.08, 0.16, d - 0.1, 0, y + 0.06, 0, 'bedding', 0.04));
      parts.push(slab(w - 0.06, 0.03, d * 0.4, 0, y + 0.22, d * 0.25, 'throw', 0.015));
    }
    parts.push(slab(w, 0.06, 0.03, 0, h - 0.12, -d / 2 + 0.03, 'frame'));
    parts.push(slab(w, 0.06, 0.03, 0, h - 0.12, d / 2 - 0.03, 'frame'));
    parts.push(slab(0.03, 0.06, d, -w / 2 + 0.02, h - 0.12, 0, 'frame'));
    for (let i = 1; i < 5; i++)
      parts.push(slab(0.03, 0.03, 0.35, w / 2 + 0.01, (h * 0.58 * i) / 5, d / 2 - 0.3, 'frame'));
    return parts;
  },
});
