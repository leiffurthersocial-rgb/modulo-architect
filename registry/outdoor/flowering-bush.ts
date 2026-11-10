import { Flower2 } from 'lucide-react';
import { defineElement } from '../define';
import { sphere } from '../parts';

export default defineElement({
  id: 'flowering-bush',
  name: 'Flowering shrub',
  kind: 'outdoor',
  category: 'Planting',
  icon: Flower2,
  tags: ['hydrangea', 'rose', 'flowers', 'bush'],
  size: { w: 1.2, d: 1.2, h: 1.1 },
  slots: {
    leaves: { label: 'Foliage', default: 'foliage', category: 'terrain' },
    flowers: { label: 'Flowers', default: 'blossom', category: 'terrain' },
  },
  snap: 'ground',
  build: ({ size: { w, h } }) => {
    const parts = [
      sphere(w * 0.45, 0, h * 0.45, 0, 'leaves', [1, h / w, 1]),
      sphere(w * 0.3, w * 0.2, h * 0.35, w * 0.12, 'leaves', [1, h / w, 1]),
    ];
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      parts.push(
        sphere(
          w * 0.09,
          Math.cos(a) * w * 0.33,
          h * (0.55 + (i % 3) * 0.13),
          Math.sin(a) * w * 0.33,
          'flowers',
        ),
      );
    }
    return parts;
  },
});
