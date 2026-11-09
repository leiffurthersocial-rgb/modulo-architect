import { Sofa } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'sofa-corner',
  name: 'Corner sofa',
  kind: 'furniture',
  category: 'Living',
  icon: Sofa,
  tags: ['sectional', 'couch', 'l-shaped'],
  size: { w: 2.7, d: 1.7, h: 0.8 },
  slots: { fabric: { label: 'Upholstery', default: 'fabric-charcoal', category: 'furniture' } },
  snap: 'floor',
  wallOffset: 0.05,
  footprint: ({ size: { w, d } }) => [
    { x: -w / 2, y: -d / 2 },
    { x: w / 2, y: -d / 2 },
    { x: w / 2, y: d / 2 },
    { x: w / 2 - 0.92, y: d / 2 },
    { x: w / 2 - 0.92, y: -d / 2 + 0.92 },
    { x: -w / 2, y: -d / 2 + 0.92 },
  ],
  build: ({ size: { w, d, h } }) => {
    const D = 0.92;
    return [
      slab(w, 0.32, D, 0, 0.04, -d / 2 + D / 2, 'fabric', 0.04),
      slab(D, 0.32, d - D, w / 2 - D / 2, 0.04, D / 2, 'fabric', 0.04),
      slab(w, h - 0.36, 0.2, 0, 0.36, -d / 2 + 0.1, 'fabric', 0.05),
      slab(0.2, h - 0.36, d, w / 2 - 0.1, 0.36, 0, 'fabric', 0.05),
      slab(0.18, 0.24, D, -w / 2 + 0.09, 0.36, -d / 2 + D / 2, 'fabric', 0.05),
      slab(w - 0.4, 0.12, D - 0.25, -0.1, 0.36, -d / 2 + D / 2 + 0.1, 'fabric', 0.05),
      slab(D - 0.25, 0.12, d - D - 0.05, w / 2 - D / 2 - 0.1, 0.36, D / 2, 'fabric', 0.05),
    ];
  },
});
