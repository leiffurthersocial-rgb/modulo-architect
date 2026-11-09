import { BedDouble } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'bed-double',
  name: 'Double bed',
  kind: 'furniture',
  category: 'Bedroom',
  icon: BedDouble,
  tags: ['queen', 'king'],
  size: { w: 1.7, d: 2.15, h: 1.0 },
  slots: {
    frame: { label: 'Frame', default: 'wood-oak', category: 'furniture' },
    bedding: { label: 'Bedding', default: 'mattress', category: 'furniture' },
    throw: { label: 'Throw', default: 'fabric-sage', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.02,
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.25, d - 0.06, 0, 0.1, 0.03, 'frame', 0.01),
    ...legs(w, d - 0.06, 0.1, 0.06, 'frame', 0.05).map((p) => ({ ...p, position: [p.position[0], p.position[1], p.position[2] + 0.03] as [number, number, number] })),
    slab(w, h, 0.07, 0, 0, -d / 2 + 0.035, 'frame', 0.015),
    slab(w - 0.06, 0.22, d - 0.16, 0, 0.35, 0.04, 'bedding', 0.06),
    slab(w - 0.02, 0.05, (d - 0.16) * 0.45, 0, 0.55, d / 2 - (d - 0.16) * 0.225 - 0.05, 'throw', 0.02),
    slab(w / 2 - 0.12, 0.13, 0.4, -w / 4 + 0.02, 0.57, -d / 2 + 0.33, 'bedding', 0.06),
    slab(w / 2 - 0.12, 0.13, 0.4, w / 4 - 0.02, 0.57, -d / 2 + 0.33, 'bedding', 0.06),
  ],
});
