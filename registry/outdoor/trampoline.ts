import { CircleDot } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'trampoline',
  name: 'Trampoline',
  kind: 'outdoor',
  category: 'Play',
  icon: CircleDot,
  tags: ['kids', 'play', 'garden toy'],
  size: { w: 3.0, d: 3.0, h: 0.8 },
  slots: {
    frame: { label: 'Frame', default: 'metal-steel', category: 'fixture' },
    mat: { label: 'Mat', default: 'rubber', category: 'fixture' },
    pad: { label: 'Padding', default: 'fabric-sage', category: 'furniture' },
  },
  snap: 'ground',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 16 }, (_, i) => ({
      x: (Math.cos((i / 16) * Math.PI * 2) * w) / 2,
      y: (Math.sin((i / 16) * Math.PI * 2) * w) / 2,
    })),
  build: ({ size: { w, h } }) => {
    const parts = [
      cyl(w / 2 - 0.15, 0.01, 0, h - 0.02, 0, 'mat', w / 2 - 0.15, 48),
      {
        geom: { kind: 'torus' as const, radius: w / 2 - 0.08, tube: 0.07 },
        position: [0, h - 0.02, 0] as [number, number, number],
        rotation: [Math.PI / 2, 0, 0] as [number, number, number],
        material: 'pad',
      },
    ];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      parts.push(
        cyl(
          0.025,
          h - 0.02,
          Math.cos(a) * (w / 2 - 0.08),
          0,
          Math.sin(a) * (w / 2 - 0.08),
          'frame',
          0.025,
          8,
        ),
      );
    }
    return parts;
  },
});
