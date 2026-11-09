import { ShowerHead } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl } from '../parts';

/** The first "fun" element: proves a new outdoor item is a single file. */
export default defineElement({
  id: 'outdoor-shower',
  name: 'Outdoor shower',
  kind: 'outdoor',
  category: 'Water',
  icon: ShowerHead,
  tags: ['garden shower', 'pool shower', 'rain shower'],
  size: { w: 1.0, d: 1.0, h: 2.3 },
  params: [
    { key: 'screen', label: 'Privacy screen', type: 'boolean', default: true },
    { key: 'head', label: 'Head diameter', type: 'length', default: 0.3, min: 0.15, max: 0.5, advanced: true },
  ],
  slots: {
    base: { label: 'Base', default: 'timber-cladding', category: 'facade' },
    metal: { label: 'Fittings', default: 'metal-steel', category: 'fixture' },
    screen: { label: 'Screen', default: 'timber-dark', category: 'facade' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h }, params }) => {
    const head = Number(params.head ?? 0.3);
    const parts = [];
    // Slatted floor
    const n = Math.max(3, Math.floor(w / 0.11));
    for (let i = 0; i < n; i++) parts.push(slab(w / n - 0.015, 0.04, d, -w / 2 + (w / n) * (i + 0.5), 0, 0, 'base'));
    // Post, arm, head and mixer
    parts.push(cyl(0.025, h, 0, 0.04, -d / 2 + 0.1, 'metal', 0.025, 16));
    parts.push(slab(0.03, 0.03, d * 0.45, 0, h - 0.05, -d / 2 + 0.1 + d * 0.22, 'metal'));
    parts.push(cyl(head / 2, 0.02, 0, h - 0.1, -d / 2 + 0.1 + d * 0.42, 'metal', head / 2, 32));
    parts.push(cyl(0.035, 0.12, 0, 1.0, -d / 2 + 0.14, 'metal', 0.035, 16));
    if (params.screen !== false) {
      parts.push(slab(0.04, 1.9, d, -w / 2 - 0.02, 0.04, 0, 'screen'));
      parts.push(slab(w, 1.9, 0.04, 0, 0.04, -d / 2 - 0.02, 'screen'));
    }
    return parts;
  },
});
