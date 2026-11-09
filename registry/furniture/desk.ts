import { Monitor } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'desk',
  name: 'Desk',
  kind: 'furniture',
  category: 'Office',
  icon: Monitor,
  tags: ['workspace', 'study', 'computer'],
  size: { w: 1.4, d: 0.7, h: 0.74 },
  params: [{ key: 'monitor', label: 'Monitor', type: 'boolean', default: true }],
  slots: {
    top: { label: 'Top', default: 'wood-oak', category: 'furniture' },
    frame: { label: 'Frame', default: 'metal-black', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.03,
  build: ({ size: { w, d, h }, params }) => {
    const parts = [
      slab(w, 0.03, d, 0, h - 0.03, 0, 'top', 0.006),
      slab(0.04, h - 0.03, d - 0.1, -w / 2 + 0.06, 0, 0, 'frame'),
      slab(0.04, h - 0.03, d - 0.1, w / 2 - 0.06, 0, 0, 'frame'),
      slab(w - 0.16, 0.06, 0.02, 0, h - 0.12, -d / 2 + 0.06, 'frame'),
    ];
    if (params.monitor !== false) {
      parts.push(slab(0.6, 0.36, 0.025, 0, h + 0.12, -d / 2 + 0.16, 'frame', 0.005));
      parts.push(slab(0.05, 0.12, 0.05, 0, h, -d / 2 + 0.16, 'frame'));
      parts.push(slab(0.42, 0.015, 0.14, 0, h, -d / 2 + 0.42, 'frame', 0.004));
    }
    return parts;
  },
});
