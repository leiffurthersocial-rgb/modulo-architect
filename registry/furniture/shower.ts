import { ShowerHead } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl } from '../parts';

export default defineElement({
  id: 'shower',
  name: 'Walk-in shower',
  kind: 'furniture',
  category: 'Bathroom',
  icon: ShowerHead,
  tags: ['shower tray', 'glass'],
  size: { w: 0.9, d: 0.9, h: 2.05 },
  slots: {
    tray: { label: 'Tray', default: 'ceramic', category: 'fixture' },
    glass: { label: 'Screen', default: 'glass', category: 'fixture' },
    metal: { label: 'Fittings', default: 'metal-steel', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0,
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.04, d, 0, 0, 0, 'tray', 0.01),
    { ...slab(0.008, h - 0.05, d * 0.9, w / 2 - 0.004, 0.04, d * 0.05, 'glass'), noShadow: true },
    cyl(0.012, h - 0.2, -w / 2 + 0.1, 0.04, -d / 2 + 0.06, 'metal', 0.012, 12),
    cyl(0.1, 0.015, -w / 2 + 0.1, h - 0.15, -d / 2 + 0.2, 'metal', 0.1, 24),
    slab(0.02, 0.02, 0.15, -w / 2 + 0.1, h - 0.15, -d / 2 + 0.12, 'metal'),
  ],
});
