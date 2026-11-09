import { Umbrella } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'lounger',
  name: 'Sun lounger',
  kind: 'outdoor',
  category: 'Furniture',
  icon: Umbrella,
  tags: ['deck chair', 'sunbed'],
  size: { w: 0.7, d: 1.95, h: 0.75 },
  slots: {
    frame: { label: 'Frame', default: 'timber-cladding', category: 'facade' },
    cushion: { label: 'Cushion', default: 'fabric-linen', category: 'furniture' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => [
    ...legs(w, d, 0.28, 0.06, 'frame', 0.05),
    slab(w, 0.05, d * 0.66, 0, 0.28, d * 0.17, 'frame'),
    slab(w - 0.04, 0.06, d * 0.64, 0, 0.33, d * 0.17, 'cushion', 0.02),
    {
      ...slab(w - 0.04, 0.06, d * 0.4, 0, 0, 0, 'cushion', 0.02),
      position: [0, 0.3 + (h - 0.3) / 2, -d / 2 + d * 0.15],
      rotation: [-0.85, 0, 0],
    },
  ],
});
