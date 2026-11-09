import { BedSingle } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'bed-single',
  name: 'Single bed',
  kind: 'furniture',
  category: 'Bedroom',
  icon: BedSingle,
  tags: ['kids', 'guest'],
  size: { w: 1.0, d: 2.1, h: 0.85 },
  slots: {
    frame: { label: 'Frame', default: 'lacquer-white', category: 'furniture' },
    bedding: { label: 'Bedding', default: 'mattress', category: 'furniture' },
    throw: { label: 'Throw', default: 'fabric-ink', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.02,
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.3, d - 0.05, 0, 0.05, 0.025, 'frame', 0.01),
    slab(w, h, 0.05, 0, 0, -d / 2 + 0.025, 'frame', 0.01),
    slab(w - 0.05, 0.2, d - 0.12, 0, 0.35, 0.03, 'bedding', 0.06),
    slab(w, 0.04, d * 0.45, 0, 0.53, d / 2 - d * 0.225 - 0.03, 'throw', 0.02),
    slab(w - 0.3, 0.12, 0.38, 0, 0.55, -d / 2 + 0.3, 'bedding', 0.06),
  ],
});
