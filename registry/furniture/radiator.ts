import { Heater } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'radiator',
  name: 'Radiator',
  kind: 'furniture',
  category: 'Decor',
  icon: Heater,
  tags: ['heating', 'heater'],
  size: { w: 1.0, d: 0.1, h: 0.6 },
  resizable: { w: true, d: false, h: true },
  elevation: 0.15,
  slots: { body: { label: 'Finish', default: 'lacquer-white', category: 'fixture' } },
  snap: 'wall',
  wallOffset: 0.04,
  solid: false,
  build: ({ size: { w, d, h } }) => {
    const n = Math.max(3, Math.round(w / 0.08));
    const parts = [];
    for (let i = 0; i < n; i++)
      parts.push(slab(w / n - 0.012, h, d, -w / 2 + (w / n) * (i + 0.5), 0, 0, 'body', 0.008));
    return parts;
  },
});
