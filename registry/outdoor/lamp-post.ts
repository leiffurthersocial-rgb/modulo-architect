import { Lamp } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'lamp-post',
  name: 'Garden lamp',
  kind: 'outdoor',
  category: 'Lighting',
  icon: Lamp,
  tags: ['bollard', 'path light', 'lantern'],
  size: { w: 0.3, d: 0.3, h: 2.4 },
  slots: {
    pole: { label: 'Pole', default: 'metal-anthracite', category: 'fixture' },
    glow: { label: 'Lantern', default: 'lamp-glow', category: 'fixture' },
  },
  snap: 'ground',
  build: ({ size: { w, h } }) => [
    cyl(w * 0.45, 0.06, 0, 0, 0, 'pole', w * 0.4, 16),
    cyl(0.04, h - 0.4, 0, 0.06, 0, 'pole', 0.035, 12),
    cyl(w * 0.35, 0.3, 0, h - 0.36, 0, 'glow', w * 0.35, 6),
    cyl(w / 2, 0.06, 0, h - 0.06, 0, 'pole', 0.02, 6),
  ],
});
