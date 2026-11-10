import { Wheat } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'ornamental-grass',
  name: 'Ornamental grass',
  kind: 'outdoor',
  category: 'Planting',
  icon: Wheat,
  tags: ['pampas', 'reeds', 'tall grass', 'dune grass'],
  size: { w: 0.9, d: 0.9, h: 1.0 },
  slots: { blades: { label: 'Blades', default: 'foliage-light', category: 'terrain' } },
  snap: 'ground',
  solid: false,
  build: ({ size: { w, h } }) => {
    const parts = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const lean = 0.18 + (i % 3) * 0.08;
      parts.push({
        ...cyl(
          0.06,
          h * (0.75 + (i % 4) * 0.08),
          Math.cos(a) * w * 0.12,
          0,
          Math.sin(a) * w * 0.12,
          'blades',
          0.004,
          5,
        ),
        rotation: [Math.sin(a) * lean, 0, -Math.cos(a) * lean] as [number, number, number],
      });
    }
    return parts;
  },
});
