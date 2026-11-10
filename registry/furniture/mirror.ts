import { RectangleVertical } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'mirror',
  name: 'Wall mirror',
  kind: 'furniture',
  category: 'Decor',
  icon: RectangleVertical,
  tags: ['looking glass', 'hallway', 'bathroom'],
  size: { w: 0.6, d: 0.03, h: 1.4 },
  resizable: { w: true, d: false, h: true },
  elevation: 0.5,
  slots: { frame: { label: 'Frame', default: 'brass', category: 'fixture' } },
  snap: 'wall',
  wallOffset: 0,
  solid: false,
  build: ({ size: { w, d, h } }) => [
    slab(w, h, d * 0.5, 0, 0, -d * 0.25, 'frame', 0.01),
    slab(w - 0.04, h - 0.04, 0.004, 0, 0.02, 0.003, 'metal-steel'),
  ],
});
