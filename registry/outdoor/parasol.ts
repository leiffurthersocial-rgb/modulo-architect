import { Umbrella } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'parasol',
  name: 'Parasol',
  kind: 'outdoor',
  category: 'Furniture',
  icon: Umbrella,
  tags: ['umbrella', 'shade'],
  size: { w: 2.8, d: 2.8, h: 2.5 },
  slots: {
    canopy: { label: 'Canopy', default: 'fabric-linen', category: 'furniture' },
    pole: { label: 'Pole', default: 'wood-oak', category: 'furniture' },
  },
  snap: 'ground',
  footprint: () =>
    Array.from({ length: 8 }, (_, i) => ({
      x: Math.cos((i / 8) * Math.PI * 2) * 0.25,
      y: Math.sin((i / 8) * Math.PI * 2) * 0.25,
    })),
  build: ({ size: { w, h } }) => [
    cyl(0.25, 0.08, 0, 0, 0, 'pole', 0.25, 24),
    cyl(0.025, h, 0, 0, 0, 'pole', 0.025, 12),
    cyl(w / 2, 0.45, 0, h - 0.5, 0, 'canopy', 0.03, 8),
  ],
});
