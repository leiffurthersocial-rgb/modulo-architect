import { Armchair } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'dining-chair',
  name: 'Dining chair',
  kind: 'furniture',
  category: 'Dining',
  icon: Armchair,
  tags: ['chair', 'seat'],
  size: { w: 0.46, d: 0.52, h: 0.82 },
  slots: {
    frame: { label: 'Frame', default: 'wood-oak', category: 'furniture' },
    seat: { label: 'Seat', default: 'fabric-linen', category: 'furniture' },
  },
  snap: 'floor',
  build: ({ size: { w, d, h } }) => [
    ...legs(w, d, 0.44, 0.03, 'frame', 0.03),
    slab(w, 0.04, d, 0, 0.44, 0, 'seat', 0.01),
    slab(0.03, h - 0.44, 0.03, -w / 2 + 0.03, 0.44, -d / 2 + 0.03, 'frame'),
    slab(0.03, h - 0.44, 0.03, w / 2 - 0.03, 0.44, -d / 2 + 0.03, 'frame'),
    slab(w, 0.16, 0.025, 0, h - 0.18, -d / 2 + 0.03, 'frame', 0.008),
  ],
});
