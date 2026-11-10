import { TreePalm } from 'lucide-react';
import { defineElement } from '../define';
import { cyl, sphere } from '../parts';

export default defineElement({
  id: 'palm-tree',
  name: 'Palm tree',
  kind: 'outdoor',
  category: 'Planting',
  icon: TreePalm,
  tags: ['tropical', 'palm'],
  size: { w: 3.5, d: 3.5, h: 5.5 },
  slots: {
    bark: { label: 'Trunk', default: 'bark', category: 'terrain' },
    leaves: { label: 'Fronds', default: 'foliage', category: 'terrain' },
  },
  snap: 'ground',
  footprint: () =>
    Array.from({ length: 8 }, (_, i) => ({
      x: Math.cos((i / 8) * Math.PI * 2) * 0.2,
      y: Math.sin((i / 8) * Math.PI * 2) * 0.2,
    })),
  build: ({ size: { w, h } }) => {
    const parts = [cyl(0.16, h * 0.92, 0, 0, 0, 'bark', 0.11, 10)];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      parts.push(
        sphere(w * 0.22, Math.cos(a) * w * 0.25, h * 0.9, Math.sin(a) * w * 0.25, 'leaves', [1.6, 0.18, 0.5]),
      );
    }
    return parts.map((p, i) =>
      i > 0 ? { ...p, rotation: [0, -((i - 1) / 7) * Math.PI * 2, -0.25] as [number, number, number] } : p,
    );
  },
});
