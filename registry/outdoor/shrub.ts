import { Shrub } from 'lucide-react';
import { defineElement } from '../define';
import { sphere } from '../parts';

export default defineElement({
  id: 'shrub',
  name: 'Shrub',
  kind: 'outdoor',
  category: 'Planting',
  icon: Shrub,
  tags: ['bush', 'lavender'],
  size: { w: 1.0, d: 1.0, h: 0.8 },
  slots: { leaves: { label: 'Foliage', default: 'foliage', category: 'terrain' } },
  snap: 'ground',
  build: ({ size: { w, h } }) => [
    sphere(w * 0.45, 0, h * 0.45, 0, 'leaves', [1, (h / w) * 1.1, 1]),
    sphere(w * 0.3, w * 0.22, h * 0.35, w * 0.1, 'leaves', [1, (h / w) * 1.1, 1]),
  ],
});
