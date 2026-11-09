import { RectangleVertical } from 'lucide-react';
import { defineOpening } from '../define';
import { frame } from './frame';
import { slab } from '../parts';

export default defineOpening({
  id: 'window-tall',
  name: 'Floor-to-ceiling glazing',
  kind: 'window',
  icon: RectangleVertical,
  defaults: { width: 1.0, height: 2.4, sill: 0.05 },
  swing: 'none',
  build: ({ width, height, thickness }) => {
    const f = 0.045;
    return [
      ...frame(width, height, thickness, { profile: f }),
      slab(width - 2 * f, f, thickness * 0.6, 0, 0, 0, 'frame'),
      { ...slab(width - 2 * f, height - 2 * f, 0.012, 0, f, 0, 'glass'), noShadow: true },
    ];
  },
});
