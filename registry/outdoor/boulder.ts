import { Mountain } from 'lucide-react';
import { defineElement } from '../define';
import { sphere } from '../parts';

export default defineElement({
  id: 'boulder',
  name: 'Boulder',
  kind: 'outdoor',
  category: 'Planting',
  icon: Mountain,
  tags: ['rock', 'stone', 'landscaping'],
  size: { w: 1.4, d: 1.1, h: 0.8 },
  slots: { stone: { label: 'Stone', default: 'rock', category: 'terrain' } },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => [
    sphere(0.5, 0, h * 0.35, 0, 'stone', [w, h * 1.1, d]),
    sphere(0.32, w * 0.28, h * 0.22, d * 0.1, 'stone', [w * 0.9, h * 1.0, d * 0.8]),
  ],
});
