import { Armchair } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl } from '../parts';

export default defineElement({
  id: 'office-chair',
  name: 'Office chair',
  kind: 'furniture',
  category: 'Office',
  icon: Armchair,
  tags: ['task chair', 'swivel'],
  size: { w: 0.62, d: 0.62, h: 1.05 },
  slots: {
    seat: { label: 'Upholstery', default: 'fabric-charcoal', category: 'furniture' },
    base: { label: 'Base', default: 'metal-black', category: 'furniture' },
  },
  snap: 'floor',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 10 }, (_, i) => ({ x: (Math.cos((i / 10) * Math.PI * 2) * w) / 2, y: (Math.sin((i / 10) * Math.PI * 2) * w) / 2 })),
  build: ({ size: { w, h } }) => {
    const parts = [
      cyl(0.03, 0.4, 0, 0.06, 0, 'base', 0.025, 12),
      slab(0.5, 0.08, 0.48, 0, 0.46, 0.02, 'seat', 0.03),
      slab(0.46, h - 0.62, 0.06, 0, 0.6, -0.24, 'seat', 0.03),
      slab(0.04, 0.03, 0.2, -0.26, 0.48, -0.1, 'base'),
      slab(0.04, 0.03, 0.2, 0.26, 0.48, -0.1, 'base'),
    ];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      parts.push({
        geom: { kind: 'box', size: [w / 2 - 0.03, 0.025, 0.04] },
        position: [(Math.cos(a) * (w / 2 - 0.03)) / 2, 0.06, (Math.sin(a) * (w / 2 - 0.03)) / 2],
        rotation: [0, -a, 0],
        material: 'base',
      });
    }
    return parts;
  },
});
