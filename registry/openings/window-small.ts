import { SquareDot } from 'lucide-react';
import { defineOpening } from '../define';
import { frame } from './frame';
import { slab } from '../parts';

export default defineOpening({
  id: 'window-small',
  name: 'Small window',
  kind: 'window',
  icon: SquareDot,
  defaults: { width: 0.6, height: 0.6, sill: 1.5 },
  swing: 'none',
  build: ({ width, height, thickness }) => {
    const f = 0.05;
    return [
      ...frame(width, height, thickness, { sill: true, profile: f }),
      slab(width - 2 * f, f, thickness * 0.6, 0, 0, 0, 'frame'),
      { ...slab(width - 2 * f, height - 2 * f, 0.012, 0, f, 0, 'glass'), noShadow: true },
    ];
  },
});
