import { Circle } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'ottoman',
  name: 'Pouf',
  kind: 'furniture',
  category: 'Living',
  icon: Circle,
  tags: ['ottoman', 'footstool', 'seat'],
  size: { w: 0.55, d: 0.55, h: 0.42 },
  slots: { fabric: { label: 'Fabric', default: 'fabric-rust', category: 'furniture' } },
  snap: 'floor',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 12 }, (_, i) => ({
      x: (Math.cos((i / 12) * Math.PI * 2) * w) / 2,
      y: (Math.sin((i / 12) * Math.PI * 2) * w) / 2,
    })),
  build: ({ size: { w, h } }) => [cyl(w / 2, h, 0, 0, 0, 'fabric', w * 0.46, 32)],
});
