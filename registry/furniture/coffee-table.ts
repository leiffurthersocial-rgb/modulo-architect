import { Table2 } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'coffee-table',
  name: 'Coffee table',
  kind: 'furniture',
  category: 'Living',
  icon: Table2,
  size: { w: 1.1, d: 0.6, h: 0.4 },
  slots: {
    top: { label: 'Top', default: 'wood-oak', category: 'furniture' },
    frame: { label: 'Frame', default: 'metal-black', category: 'furniture' },
  },
  snap: 'floor',
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.03, d, 0, h - 0.03, 0, 'top', 0.01),
    slab(w - 0.06, 0.02, d - 0.06, 0, 0.12, 0, 'top'),
    ...legs(w, d, h - 0.03, 0.04, 'frame', 0.025),
  ],
});
