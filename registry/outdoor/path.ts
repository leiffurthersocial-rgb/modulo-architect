import { Footprints } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'path',
  name: 'Garden path',
  kind: 'outdoor',
  category: 'Hardscape',
  icon: Footprints,
  tags: ['walkway', 'paving', 'stepping stones'],
  size: { w: 1.2, d: 6, h: 0.03 },
  resizable: { w: true, d: true, h: false },
  slots: { surface: { label: 'Surface', default: 'paving', category: 'terrain' } },
  snap: 'ground',
  solid: false,
  build: ({ size: { w, d, h } }) => [{ ...slab(w, h, d, 0, 0, 0, 'surface'), noShadow: true }],
});
