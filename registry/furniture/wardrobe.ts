import { DoorClosed } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'wardrobe',
  name: 'Wardrobe',
  kind: 'furniture',
  category: 'Bedroom',
  icon: DoorClosed,
  tags: ['closet', 'storage', 'cupboard'],
  size: { w: 1.6, d: 0.6, h: 2.2 },
  params: [{ key: 'doors', label: 'Doors', type: 'number', default: 3, min: 1, max: 6, step: 1 }],
  slots: {
    body: { label: 'Body', default: 'lacquer-white', category: 'furniture' },
    handles: { label: 'Handles', default: 'brass', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0.01,
  build: ({ size: { w, d, h }, params }) => {
    const n = Math.max(1, Math.round(Number(params.doors) || 3));
    const dw = w / n;
    const parts = [
      slab(w, h - 0.06, d - 0.02, 0, 0.06, -0.01, 'body'),
      slab(w - 0.04, 0.06, d - 0.06, 0, 0, -0.03, 'handles'),
    ];
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + dw * (i + 0.5);
      parts.push(slab(dw - 0.006, h - 0.07, 0.02, x, 0.065, d / 2 - 0.01, 'body', 0.003));
      const hx = x + (i % 2 === 0 ? dw / 2 - 0.05 : -dw / 2 + 0.05);
      parts.push(slab(0.012, 0.3, 0.02, hx, h * 0.45, d / 2 + 0.01, 'handles'));
    }
    return parts;
  },
});
