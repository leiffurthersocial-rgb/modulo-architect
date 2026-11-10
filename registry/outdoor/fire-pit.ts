import { Flame } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'fire-pit',
  name: 'Fire pit',
  kind: 'outdoor',
  category: 'Furniture',
  icon: Flame,
  tags: ['campfire', 'fire bowl'],
  size: { w: 1.0, d: 1.0, h: 0.4 },
  slots: {
    stone: { label: 'Stone', default: 'stone', category: 'terrain' },
    glow: { label: 'Fire', default: 'lamp-glow', category: 'fixture' },
  },
  snap: 'ground',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 12 }, (_, i) => ({
      x: (Math.cos((i / 12) * Math.PI * 2) * w) / 2,
      y: (Math.sin((i / 12) * Math.PI * 2) * w) / 2,
    })),
  build: ({ size: { w, h } }) => [
    {
      geom: { kind: 'torus', radius: w * 0.4, tube: w * 0.1 },
      position: [0, h * 0.5, 0],
      rotation: [Math.PI / 2, 0, 0],
      material: 'stone',
    },
    cyl(w * 0.32, h * 0.4, 0, 0, 0, 'stone', w * 0.32, 24),
    cyl(w * 0.18, h * 0.5, 0, h * 0.4, 0, 'glow', 0.02, 12),
  ],
});
