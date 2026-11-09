import { DoorOpen } from 'lucide-react';
import { defineOpening } from '../define';
import { frame, leaf } from './frame';

export default defineOpening({
  id: 'door-double',
  name: 'Double door',
  kind: 'door',
  icon: DoorOpen,
  defaults: { width: 1.6, height: 2.2, sill: 0 },
  swing: 'double',
  build: ({ width, height, thickness, params }) => {
    const open = Number(params.open ?? 0);
    const f = 0.05;
    const lw = (width - 2 * f) / 2;
    const left = leaf(-width / 2 + f, lw, height - f - 0.01, open);
    const right = leaf(-width / 2 + f, lw, height - f - 0.01, open);
    // Mirror the right leaf around x = 0.
    right.position = [-right.position[0], right.position[1], right.position[2]];
    right.rotation = [0, -(right.rotation?.[1] ?? 0), 0];
    return [...frame(width, height, thickness, { profile: f }), left, right];
  },
});
