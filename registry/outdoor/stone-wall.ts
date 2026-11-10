import { BrickWall } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'garden-wall',
  name: 'Garden wall',
  kind: 'outdoor',
  category: 'Boundaries',
  icon: BrickWall,
  tags: ['stone wall', 'boundary', 'retaining'],
  size: { w: 4, d: 0.3, h: 0.9 },
  minSize: { w: 0.5 },
  slots: {
    stone: { label: 'Stone', default: 'stone', category: 'facade' },
    cap: { label: 'Coping', default: 'paving', category: 'terrain' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => [
    slab(w, h - 0.05, d, 0, 0, 0, 'stone'),
    slab(w + 0.04, 0.05, d + 0.06, 0, h - 0.05, 0, 'cap'),
  ],
});
