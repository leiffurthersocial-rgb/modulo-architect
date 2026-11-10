import { Bike } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'bicycle',
  name: 'Bicycle',
  kind: 'outdoor',
  category: 'Vehicles',
  icon: Bike,
  tags: ['bike', 'cycle'],
  size: { w: 0.6, d: 1.75, h: 1.05 },
  resizable: { w: false, d: false, h: false },
  slots: {
    frame: { label: 'Frame', default: 'car-paint', category: 'fixture' },
    tyre: { label: 'Tyres', default: 'rubber', category: 'fixture' },
  },
  snap: 'ground',
  build: ({ size: { d, h } }) => {
    const r = 0.34;
    const wheel = (z: number) => ({
      geom: { kind: 'torus' as const, radius: r, tube: 0.025 },
      position: [0, r + 0.02, z] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
      material: 'tyre',
    });
    return [
      wheel(-d / 2 + r + 0.02),
      wheel(d / 2 - r - 0.02),
      {
        ...slab(0.03, 0.03, d * 0.55, 0, 0, 0, 'frame'),
        position: [0, r + 0.32, 0] as [number, number, number],
      },
      {
        ...slab(0.03, 0.5, 0.03, 0, 0, 0, 'frame'),
        position: [0, r + 0.12, -0.15] as [number, number, number],
        rotation: [0.35, 0, 0] as [number, number, number],
      },
      {
        ...slab(0.04, 0.03, 0.22, 0, 0, 0, 'tyre'),
        position: [0, h - 0.12, -0.25] as [number, number, number],
      },
      {
        ...slab(0.5, 0.03, 0.03, 0, 0, 0, 'tyre'),
        position: [0, h - 0.06, d / 2 - 0.4] as [number, number, number],
      },
    ];
  },
});
