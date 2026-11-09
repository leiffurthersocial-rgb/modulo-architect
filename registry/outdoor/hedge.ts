import { Shrub } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'hedge',
  name: 'Hedge',
  kind: 'outdoor',
  category: 'Boundaries',
  icon: Shrub,
  tags: ['boxwood', 'privet', 'green wall'],
  size: { w: 3, d: 0.7, h: 1.4 },
  minSize: { w: 0.5 },
  slots: { leaves: { label: 'Foliage', default: 'foliage-dark', category: 'terrain' } },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => [slab(w, h, d, 0, 0, 0, 'leaves', Math.min(0.2, d / 3))],
});
