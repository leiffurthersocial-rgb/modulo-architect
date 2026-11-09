import { WavesLadder } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl } from '../parts';

export default defineElement({
  id: 'pool',
  name: 'Pool',
  kind: 'outdoor',
  category: 'Water',
  icon: WavesLadder,
  tags: ['swimming pool', 'water'],
  size: { w: 8, d: 4, h: 0.12 },
  resizable: { w: true, d: true, h: false },
  params: [{ key: 'coping', label: 'Coping width', type: 'length', default: 0.35, min: 0.1, max: 1 }],
  slots: {
    coping: { label: 'Coping', default: 'stone', category: 'terrain' },
    water: { label: 'Water', default: 'water', category: 'terrain' },
    metal: { label: 'Ladder', default: 'metal-steel', category: 'fixture' },
  },
  snap: 'ground',
  solid: false,
  build: ({ size: { w, d, h }, params }) => {
    const c = Math.min(Number(params.coping ?? 0.35), Math.min(w, d) / 3);
    return [
      slab(w, h, c, 0, 0, -d / 2 + c / 2, 'coping'),
      slab(w, h, c, 0, 0, d / 2 - c / 2, 'coping'),
      slab(c, h, d - 2 * c, -w / 2 + c / 2, 0, 0, 'coping'),
      slab(c, h, d - 2 * c, w / 2 - c / 2, 0, 0, 'coping'),
      { ...slab(w - 2 * c, 0.02, d - 2 * c, 0, h - 0.06, 0, 'water'), noShadow: true },
      cyl(0.02, 0.9, w / 2 - c - 0.15, h - 0.4, -d / 2 + c + 0.05, 'metal', 0.02, 10),
      cyl(0.02, 0.9, w / 2 - c - 0.65, h - 0.4, -d / 2 + c + 0.05, 'metal', 0.02, 10),
    ];
  },
});
