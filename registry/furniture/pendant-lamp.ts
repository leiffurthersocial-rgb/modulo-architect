import { LampCeiling } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'pendant-lamp',
  name: 'Pendant light',
  kind: 'furniture',
  category: 'Lighting',
  icon: LampCeiling,
  tags: ['ceiling light', 'chandelier'],
  size: { w: 0.45, d: 0.45, h: 0.9 },
  elevation: 1.65,
  slots: {
    shade: { label: 'Shade', default: 'lacquer-black', category: 'fixture' },
    glow: { label: 'Bulb', default: 'lamp-glow', category: 'fixture' },
  },
  light: { y: 0.05, intensity: 9, distance: 10 },
  snap: 'ceiling',
  solid: false,
  build: ({ size: { w, h } }) => [
    cyl(0.004, h - 0.2, 0, 0.2, 0, 'shade', 0.004, 6),
    cyl(w / 2, 0.2, 0, 0, 0, 'shade', 0.04, 32),
    cyl(0.06, 0.03, 0, 0.0, 0, 'glow', 0.06, 16),
    cyl(0.06, 0.02, 0, h - 0.02, 0, 'shade', 0.06, 16),
  ],
});
