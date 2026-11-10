import { Table2 } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'console-table',
  name: 'Console table',
  kind: 'furniture',
  category: 'Decor',
  icon: Table2,
  tags: ['hallway', 'entry', 'sofa table'],
  size: { w: 1.2, d: 0.35, h: 0.78 },
  slots: {
    top: { label: 'Top', default: 'wood-oak', category: 'furniture' },
    frame: { label: 'Frame', default: 'brass', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.02,
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.03, d, 0, h - 0.03, 0, 'top', 0.006),
    slab(w - 0.1, 0.02, d - 0.06, 0, 0.18, 0, 'top'),
    ...legs(w, d, h - 0.03, 0.03, 'frame', 0.02, true),
  ],
});
