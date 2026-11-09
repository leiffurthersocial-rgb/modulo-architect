import { Droplet } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl } from '../parts';

export default defineElement({
  id: 'bathroom-sink',
  name: 'Vanity',
  kind: 'furniture',
  category: 'Bathroom',
  icon: Droplet,
  tags: ['sink', 'basin', 'washbasin'],
  size: { w: 0.8, d: 0.48, h: 0.85 },
  params: [{ key: 'mirror', label: 'Mirror', type: 'boolean', default: true }],
  slots: {
    body: { label: 'Cabinet', default: 'wood-oak', category: 'furniture' },
    ceramic: { label: 'Basin', default: 'ceramic', category: 'fixture' },
    metal: { label: 'Tap', default: 'metal-steel', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0,
  build: ({ size: { w, d, h }, params }) => {
    const parts = [
      slab(w, 0.42, d - 0.02, 0, h - 0.5, -0.01, 'body', 0.008),
      slab(w, 0.08, d, 0, h - 0.08, 0, 'ceramic', 0.02),
      cyl(0.01, 0.16, 0, h, -d / 2 + 0.07, 'metal', 0.01, 12),
      slab(0.02, 0.02, 0.12, 0, h + 0.14, -d / 2 + 0.12, 'metal'),
    ];
    if (params.mirror !== false)
      parts.push(slab(w * 0.9, 0.7, 0.02, 0, h + 0.3, -d / 2 + 0.01, 'metal', 0.01));
    return parts;
  },
});
