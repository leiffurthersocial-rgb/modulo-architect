import { Refrigerator } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'fridge',
  name: 'Fridge',
  kind: 'furniture',
  category: 'Kitchen',
  icon: Refrigerator,
  tags: ['refrigerator', 'freezer', 'appliance'],
  size: { w: 0.7, d: 0.68, h: 2.0 },
  slots: {
    body: { label: 'Finish', default: 'metal-steel', category: 'fixture' },
    handles: { label: 'Handles', default: 'metal-black', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0.03,
  build: ({ size: { w, d, h } }) => [
    slab(w, h, d - 0.04, 0, 0, -0.02, 'body', 0.02),
    slab(w - 0.01, h * 0.62, 0.04, 0, h * 0.37, d / 2 - 0.02, 'body', 0.01),
    slab(w - 0.01, h * 0.35, 0.04, 0, 0.01, d / 2 - 0.02, 'body', 0.01),
    slab(0.02, 0.5, 0.03, w / 2 - 0.06, h * 0.45, d / 2 + 0.015, 'handles'),
    slab(0.02, 0.25, 0.03, w / 2 - 0.06, h * 0.12, d / 2 + 0.015, 'handles'),
  ],
});
