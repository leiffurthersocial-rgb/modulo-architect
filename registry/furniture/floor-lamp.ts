import { LampFloor } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'floor-lamp',
  name: 'Floor lamp',
  kind: 'furniture',
  category: 'Lighting',
  icon: LampFloor,
  tags: ['light', 'standing lamp'],
  size: { w: 0.4, d: 0.4, h: 1.6 },
  slots: {
    metal: { label: 'Stand', default: 'brass', category: 'fixture' },
    shade: { label: 'Shade', default: 'lamp-glow', category: 'fixture' },
  },
  snap: 'floor',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 10 }, (_, i) => ({
      x: (Math.cos((i / 10) * Math.PI * 2) * w) / 2,
      y: (Math.sin((i / 10) * Math.PI * 2) * w) / 2,
    })),
  build: ({ size: { w, h } }) => [
    cyl(w * 0.4, 0.025, 0, 0, 0, 'metal', w * 0.4, 32),
    cyl(0.012, h - 0.3, 0, 0.025, 0, 'metal', 0.012, 12),
    cyl(w / 2, 0.32, 0, h - 0.32, 0, 'shade', w * 0.38, 32),
  ],
});
