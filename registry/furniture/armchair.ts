import { Armchair } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'armchair',
  name: 'Armchair',
  kind: 'furniture',
  category: 'Living',
  icon: Armchair,
  size: { w: 0.85, d: 0.85, h: 0.82 },
  slots: {
    fabric: { label: 'Upholstery', default: 'fabric-sage', category: 'furniture' },
    legs: { label: 'Legs', default: 'wood-oak', category: 'furniture' },
  },
  snap: 'floor',
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.2, d, 0, 0.14, 0, 'fabric', 0.04),
    slab(w - 0.24, 0.12, d - 0.2, 0, 0.34, 0.08, 'fabric', 0.05),
    slab(w, h - 0.34, 0.16, 0, 0.34, -d / 2 + 0.08, 'fabric', 0.05),
    slab(0.12, 0.26, d, -w / 2 + 0.06, 0.34, 0, 'fabric', 0.05),
    slab(0.12, 0.26, d, w / 2 - 0.06, 0.34, 0, 'fabric', 0.05),
    ...legs(w, d, 0.14, 0.07, 'legs', 0.035, true),
  ],
});
