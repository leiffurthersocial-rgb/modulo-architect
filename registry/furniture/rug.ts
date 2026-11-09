import { RectangleHorizontal } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'rug',
  name: 'Rug',
  kind: 'furniture',
  category: 'Decor',
  icon: RectangleHorizontal,
  tags: ['carpet'],
  size: { w: 2.4, d: 1.7, h: 0.012 },
  resizable: { w: true, d: true, h: false },
  slots: { fabric: { label: 'Fabric', default: 'fabric-ink', category: 'furniture' } },
  snap: 'floor',
  solid: false,
  build: ({ size: { w, d, h } }) => [{ ...slab(w, h, d, 0, 0.001, 0, 'fabric', 0.004), noShadow: true }],
});
