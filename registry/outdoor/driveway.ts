import { Route } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'driveway',
  name: 'Driveway',
  kind: 'outdoor',
  category: 'Hardscape',
  icon: Route,
  tags: ['parking', 'asphalt', 'gravel'],
  size: { w: 3.2, d: 8, h: 0.03 },
  resizable: { w: true, d: true, h: false },
  slots: { surface: { label: 'Surface', default: 'gravel', category: 'terrain' } },
  snap: 'ground',
  solid: false,
  build: ({ size: { w, d, h } }) => [{ ...slab(w, h, d, 0, 0, 0, 'surface'), noShadow: true }],
});
