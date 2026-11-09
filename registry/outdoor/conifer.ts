import { TreePine } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'conifer',
  name: 'Conifer',
  kind: 'outdoor',
  category: 'Planting',
  icon: TreePine,
  tags: ['pine', 'spruce', 'fir', 'evergreen'],
  size: { w: 2.4, d: 2.4, h: 6 },
  slots: {
    bark: { label: 'Trunk', default: 'bark', category: 'terrain' },
    leaves: { label: 'Needles', default: 'foliage-dark', category: 'terrain' },
  },
  snap: 'ground',
  footprint: () => Array.from({ length: 8 }, (_, i) => ({ x: Math.cos((i / 8) * Math.PI * 2) * 0.2, y: Math.sin((i / 8) * Math.PI * 2) * 0.2 })),
  build: ({ size: { w, h } }) => [
    cyl(0.12, h * 0.25, 0, 0, 0, 'bark', 0.1, 10),
    cyl(w / 2, h * 0.45, 0, h * 0.15, 0, 'leaves', w * 0.18, 16),
    cyl(w * 0.38, h * 0.4, 0, h * 0.42, 0, 'leaves', 0.02, 16),
  ],
});
