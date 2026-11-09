import { RectangleHorizontal } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'bench',
  name: 'Bench',
  kind: 'furniture',
  category: 'Decor',
  icon: RectangleHorizontal,
  tags: ['hallway', 'seat'],
  size: { w: 1.2, d: 0.38, h: 0.45 },
  slots: { wood: { label: 'Wood', default: 'wood-oak', category: 'furniture' } },
  snap: 'floor',
  wallOffset: 0.03,
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.04, d, 0, h - 0.04, 0, 'wood', 0.008),
    slab(0.04, h - 0.04, d - 0.04, -w / 2 + 0.08, 0, 0, 'wood'),
    slab(0.04, h - 0.04, d - 0.04, w / 2 - 0.08, 0, 0, 'wood'),
  ],
});
