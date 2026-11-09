import { DoorOpen } from 'lucide-react';
import { defineOpening } from '../define';
import { frame, leaf } from './frame';
import { slab } from '../parts';

export default defineOpening({
  id: 'door-single',
  name: 'Door',
  kind: 'door',
  icon: DoorOpen,
  defaults: { width: 0.9, height: 2.1, sill: 0 },
  swing: 'single',
  build: ({ width, height, thickness, params }) => {
    const open = Number(params.open ?? 0);
    const f = 0.05;
    const lw = width - 2 * f;
    const l = leaf(-width / 2 + f, lw, height - f - 0.01, open);
    const handleX = -width / 2 + f + lw - 0.08;
    return [
      ...frame(width, height, thickness, { profile: f }),
      l,
      ...(open === 0 ? [slab(0.12, 0.02, 0.06, handleX, 1.0, 0.03, 'handle'), slab(0.12, 0.02, 0.06, handleX, 1.0, -0.03, 'handle')] : []),
    ];
  },
});
