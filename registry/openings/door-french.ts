import { DoorOpen } from 'lucide-react';
import { defineOpening } from '../define';
import { frame, leaf } from './frame';
import type { Part } from '../types';

/** Double glazed doors: each leaf is a thin frame around a glass pane. */
export default defineOpening({
  id: 'door-french',
  name: 'French doors',
  kind: 'door',
  icon: DoorOpen,
  defaults: { width: 1.5, height: 2.2, sill: 0 },
  swing: 'double',
  build: ({ width, height, thickness, params }) => {
    const open = Number(params.open ?? 0);
    const f = 0.05;
    const lw = (width - 2 * f) / 2;
    const lh = height - f - 0.01;
    const mk = (mirror: boolean): Part[] => {
      const solid = leaf(-width / 2 + f, lw, lh, open);
      const glass = { ...leaf(-width / 2 + f, lw, lh, open, 'glass'), noShadow: true };
      glass.geom = { kind: 'box', size: [lw - 0.12, lh - 0.12, 0.012] };
      glass.position = [glass.position[0], glass.position[1], glass.position[2]];
      solid.geom = { kind: 'box', size: [lw, lh, 0.045] };
      const parts = [
        glass,
        {
          ...solid,
          geom: { kind: 'box' as const, size: [lw, 0.08, 0.045] as [number, number, number] },
          position: [solid.position[0], 0.04, solid.position[2]] as [number, number, number],
        },
        {
          ...solid,
          geom: { kind: 'box' as const, size: [lw, 0.08, 0.045] as [number, number, number] },
          position: [solid.position[0], lh - 0.04, solid.position[2]] as [number, number, number],
        },
      ];
      return mirror
        ? parts.map((p) => ({
            ...p,
            position: [-p.position[0], p.position[1], p.position[2]] as [number, number, number],
            rotation: [0, -(p.rotation?.[1] ?? 0), 0] as [number, number, number],
          }))
        : parts;
    };
    return [...frame(width, height, thickness, { profile: f }), ...mk(false), ...mk(true)];
  },
});
