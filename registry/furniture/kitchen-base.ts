import { CookingPot } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl } from '../parts';

export default defineElement({
  id: 'kitchen-base',
  name: 'Kitchen counter',
  kind: 'furniture',
  category: 'Kitchen',
  icon: CookingPot,
  tags: ['cabinet', 'worktop', 'base unit'],
  size: { w: 2.4, d: 0.62, h: 0.9 },
  params: [
    { key: 'sink', label: 'Sink', type: 'boolean', default: true },
    { key: 'hob', label: 'Hob', type: 'boolean', default: true },
  ],
  slots: {
    fronts: { label: 'Fronts', default: 'lacquer-white', category: 'furniture' },
    top: { label: 'Worktop', default: 'floor-terrazzo', category: 'furniture' },
    metal: { label: 'Fixtures', default: 'metal-steel', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0,
  build: ({ size: { w, d, h }, params }) => {
    const parts = [
      slab(w, 0.1, d - 0.08, 0, 0, -0.04, 'metal'),
      slab(w, h - 0.14, d - 0.04, 0, 0.1, -0.02, 'fronts'),
      slab(w, 0.04, d, 0, h - 0.04, 0, 'top', 0.004),
    ];
    const n = Math.max(1, Math.round(w / 0.6));
    const fw = w / n;
    for (let i = 0; i < n; i++) parts.push(slab(fw - 0.004, h - 0.15, 0.018, -w / 2 + fw * (i + 0.5), 0.105, d / 2 - 0.03, 'fronts', 0.002));
    if (params.sink !== false) {
      parts.push(slab(0.5, 0.012, 0.4, -w / 4, h - 0.005, 0.02, 'metal', 0.02));
      parts.push(cyl(0.012, 0.25, -w / 4, h, -d / 2 + 0.08, 'metal', 0.012, 12));
      parts.push(slab(0.025, 0.025, 0.18, -w / 4, h + 0.23, -d / 2 + 0.16, 'metal'));
    }
    if (params.hob !== false) parts.push(slab(0.6, 0.008, 0.5, w / 4, h, 0.0, 'metal', 0.004));
    return parts;
  },
});
