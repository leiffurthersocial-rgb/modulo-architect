import { PanelTop } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'kitchen-wall',
  name: 'Wall cabinet',
  kind: 'furniture',
  category: 'Kitchen',
  icon: PanelTop,
  tags: ['upper cabinet', 'cupboard'],
  size: { w: 1.8, d: 0.35, h: 0.7 },
  elevation: 1.45,
  slots: { fronts: { label: 'Fronts', default: 'lacquer-white', category: 'furniture' } },
  snap: 'wall',
  wallOffset: 0,
  solid: false,
  build: ({ size: { w, d, h } }) => {
    const parts = [slab(w, h, d - 0.02, 0, 0, -0.01, 'fronts')];
    const n = Math.max(1, Math.round(w / 0.6));
    const fw = w / n;
    for (let i = 0; i < n; i++)
      parts.push(
        slab(fw - 0.004, h - 0.004, 0.018, -w / 2 + fw * (i + 0.5), 0.002, d / 2 - 0.01, 'fronts', 0.002),
      );
    return parts;
  },
});
