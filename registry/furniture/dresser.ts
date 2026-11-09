import { Archive } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'dresser',
  name: 'Chest of drawers',
  kind: 'furniture',
  category: 'Bedroom',
  icon: Archive,
  tags: ['dresser', 'drawers', 'storage', 'sideboard'],
  size: { w: 1.2, d: 0.48, h: 0.85 },
  slots: {
    body: { label: 'Body', default: 'wood-walnut', category: 'furniture' },
    handles: { label: 'Handles', default: 'brass', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0.02,
  build: ({ size: { w, d, h } }) => {
    const legH = 0.12;
    const parts = [slab(w, h - legH, d, 0, legH, 0, 'body', 0.01), ...legs(w, d, legH, 0.04, 'body', 0.035, true)];
    const rows = 3;
    const rh = (h - legH) / rows;
    for (let i = 0; i < rows; i++) {
      parts.push(slab(w - 0.03, 0.004, 0.006, 0, legH + rh * i, d / 2, 'handles'));
      parts.push(slab(0.18, 0.015, 0.02, 0, legH + rh * (i + 0.5), d / 2 + 0.01, 'handles'));
    }
    return parts;
  },
});
