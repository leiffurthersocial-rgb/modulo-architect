import { LampDesk } from 'lucide-react';
import { defineElement } from '../define';
import { cyl, sphere } from '../parts';

export default defineElement({
  id: 'table-lamp',
  name: 'Table lamp',
  kind: 'furniture',
  category: 'Lighting',
  icon: LampDesk,
  tags: ['light', 'bedside lamp'],
  size: { w: 0.28, d: 0.28, h: 0.48 },
  elevation: 0,
  slots: {
    base: { label: 'Base', default: 'ceramic', category: 'fixture' },
    shade: { label: 'Shade', default: 'lamp-glow', category: 'fixture' },
  },
  snap: 'floor',
  solid: false,
  build: ({ size: { w, h } }) => [
    sphere(w * 0.32, 0, h * 0.22, 0, 'base', [1, 1.05, 1]),
    cyl(0.008, h * 0.3, 0, h * 0.38, 0, 'base', 0.008, 8),
    cyl(w / 2, h * 0.36, 0, h * 0.64, 0, 'shade', w * 0.36, 32),
  ],
});
