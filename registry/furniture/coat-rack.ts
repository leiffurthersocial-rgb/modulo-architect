import { Shirt } from 'lucide-react';
import { defineElement } from '../define';
import { cyl, sphere } from '../parts';

export default defineElement({
  id: 'coat-rack',
  name: 'Coat stand',
  kind: 'furniture',
  category: 'Decor',
  icon: Shirt,
  tags: ['hallway', 'hanger', 'entry'],
  size: { w: 0.45, d: 0.45, h: 1.8 },
  slots: { wood: { label: 'Wood', default: 'wood-walnut', category: 'furniture' } },
  snap: 'floor',
  build: ({ size: { w, h } }) => {
    const parts = [
      cyl(w * 0.4, 0.03, 0, 0, 0, 'wood', w * 0.4, 24),
      cyl(0.02, h - 0.03, 0, 0.03, 0, 'wood', 0.018, 12),
    ];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      parts.push(sphere(0.03, Math.cos(a) * 0.1, h - 0.15, Math.sin(a) * 0.1, 'wood'));
    }
    return parts;
  },
});
