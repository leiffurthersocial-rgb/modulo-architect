import { Armchair } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'bar-stool',
  name: 'Bar stool',
  kind: 'furniture',
  category: 'Kitchen',
  icon: Armchair,
  tags: ['stool', 'counter', 'island'],
  size: { w: 0.4, d: 0.4, h: 0.76 },
  slots: {
    seat: { label: 'Seat', default: 'wood-oak', category: 'furniture' },
    frame: { label: 'Frame', default: 'metal-black', category: 'furniture' },
  },
  snap: 'floor',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 10 }, (_, i) => ({
      x: (Math.cos((i / 10) * Math.PI * 2) * w) / 2,
      y: (Math.sin((i / 10) * Math.PI * 2) * w) / 2,
    })),
  build: ({ size: { w, h } }) => [
    cyl(w / 2, 0.05, 0, h - 0.05, 0, 'seat', w / 2, 32),
    cyl(0.025, h - 0.05, 0, 0, 0, 'frame', 0.025, 12),
    cyl(w * 0.4, 0.015, 0, 0, 0, 'frame', w * 0.4, 32),
    {
      geom: { kind: 'torus', radius: w * 0.32, tube: 0.01 },
      position: [0, h * 0.35, 0],
      rotation: [Math.PI / 2, 0, 0],
      material: 'frame',
    },
  ],
});
