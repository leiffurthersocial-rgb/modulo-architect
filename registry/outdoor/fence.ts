import { Fence } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'fence',
  name: 'Fence',
  kind: 'outdoor',
  category: 'Boundaries',
  icon: Fence,
  tags: ['picket', 'boundary', 'slats'],
  size: { w: 4, d: 0.06, h: 1.2 },
  minSize: { w: 0.5 },
  resizable: { w: true, d: false, h: true },
  params: [{ key: 'spacing', label: 'Slat gap', type: 'length', default: 0.04, min: 0, max: 0.2, advanced: true }],
  slots: { wood: { label: 'Timber', default: 'timber-cladding', category: 'facade' } },
  snap: 'ground',
  build: ({ size: { w, h }, params }) => {
    const gap = Math.max(0, Number(params.spacing ?? 0.04));
    const slat = 0.09;
    const n = Math.max(1, Math.floor((w + gap) / (slat + gap)));
    const used = n * slat + (n - 1) * gap;
    const parts = [slab(w, 0.05, 0.04, 0, h * 0.2, -0.03, 'wood'), slab(w, 0.05, 0.04, 0, h * 0.75, -0.03, 'wood')];
    const posts = Math.max(2, Math.ceil(w / 2) + 1);
    for (let i = 0; i < posts; i++) parts.push(slab(0.08, h, 0.08, -w / 2 + 0.04 + ((w - 0.08) * i) / (posts - 1), 0, -0.05, 'wood'));
    for (let i = 0; i < n; i++) parts.push(slab(slat, h - 0.05, 0.02, -used / 2 + slat / 2 + i * (slat + gap), 0.03, 0.0, 'wood'));
    return parts;
  },
});
