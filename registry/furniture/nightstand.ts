import { Archive } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'nightstand',
  name: 'Nightstand',
  kind: 'furniture',
  category: 'Bedroom',
  icon: Archive,
  tags: ['bedside'],
  size: { w: 0.48, d: 0.4, h: 0.5 },
  slots: {
    body: { label: 'Body', default: 'wood-oak', category: 'furniture' },
    legs: { label: 'Legs', default: 'metal-black', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.02,
  build: ({ size: { w, d, h } }) => [
    slab(w, h - 0.18, d, 0, 0.18, 0, 'body', 0.01),
    slab(w - 0.04, 0.005, 0.01, 0, h - 0.17, d / 2, 'legs'),
    ...legs(w, d, 0.18, 0.03, 'legs', 0.02, true),
  ],
});
