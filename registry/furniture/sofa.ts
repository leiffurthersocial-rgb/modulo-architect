import { Sofa } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'sofa',
  name: 'Sofa',
  kind: 'furniture',
  category: 'Living',
  icon: Sofa,
  tags: ['couch', 'settee'],
  size: { w: 2.2, d: 0.92, h: 0.8 },
  minSize: { w: 1.2 },
  slots: {
    fabric: { label: 'Upholstery', default: 'fabric-linen', category: 'furniture' },
    legs: { label: 'Legs', default: 'wood-walnut', category: 'furniture' },
  },
  params: [{ key: 'cushions', label: 'Seat cushions', type: 'number', default: 3, min: 1, max: 5, step: 1 }],
  snap: 'floor',
  wallOffset: 0.05,
  build: ({ size: { w, d, h }, params }) => {
    const arm = 0.16;
    const legH = 0.1;
    const n = Math.max(1, Math.round(Number(params.cushions) || 3));
    const seatW = (w - arm * 2) / n;
    const parts = [
      slab(w, 0.22, d, 0, legH, 0, 'fabric', 0.03),
      slab(w - arm * 2, h - legH - 0.22, 0.2, 0, legH + 0.22, -d / 2 + 0.1, 'fabric', 0.05),
      slab(arm, 0.42, d, -w / 2 + arm / 2, legH + 0.22, 0, 'fabric', 0.05),
      slab(arm, 0.42, d, w / 2 - arm / 2, legH + 0.22, 0, 'fabric', 0.05),
      ...legs(w, d, legH, 0.08, 'legs', 0.04, true),
    ];
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + arm + seatW * (i + 0.5);
      parts.push(slab(seatW - 0.015, 0.13, d - 0.24, x, legH + 0.22, 0.1, 'fabric', 0.05));
    }
    return parts;
  },
});
