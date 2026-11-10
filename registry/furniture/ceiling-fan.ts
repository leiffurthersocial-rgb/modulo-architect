import { Fan } from 'lucide-react';
import { defineElement } from '../define';
import { cyl, slab } from '../parts';

export default defineElement({
  id: 'ceiling-fan',
  name: 'Ceiling fan',
  kind: 'furniture',
  category: 'Lighting',
  icon: Fan,
  tags: ['fan', 'cooling', 'ceiling'],
  size: { w: 1.3, d: 1.3, h: 0.45 },
  elevation: 2.35,
  slots: {
    body: { label: 'Body', default: 'metal-black', category: 'fixture' },
    blades: { label: 'Blades', default: 'wood-oak', category: 'furniture' },
  },
  snap: 'ceiling',
  solid: false,
  build: ({ size: { w, h } }) => {
    const parts = [cyl(0.02, h - 0.1, 0, 0.1, 0, 'body', 0.02, 8), cyl(0.1, 0.1, 0, 0, 0, 'body', 0.08, 24)];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const r = w * 0.27;
      parts.push({
        ...slab(w * 0.42, 0.012, 0.12, Math.cos(a) * r, 0.05, Math.sin(a) * r, 'blades', 0.004),
        rotation: [0, -a, 0] as [number, number, number],
      });
    }
    return parts;
  },
});
