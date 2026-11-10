import { Frame } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'wall-art',
  name: 'Framed picture',
  kind: 'furniture',
  category: 'Decor',
  icon: Frame,
  tags: ['art', 'painting', 'poster', 'print'],
  size: { w: 0.8, d: 0.04, h: 0.6 },
  resizable: { w: true, d: false, h: true },
  elevation: 1.3,
  slots: {
    frame: { label: 'Frame', default: 'lacquer-black', category: 'furniture' },
    art: { label: 'Artwork', default: 'fabric-rust', category: 'furniture' },
  },
  snap: 'wall',
  wallOffset: 0,
  solid: false,
  build: ({ size: { w, d, h } }) => [
    slab(w, h, d * 0.6, 0, 0, -d * 0.2, 'frame', 0.004),
    slab(w - 0.12, h - 0.12, 0.004, 0, 0.06, d * 0.12, 'mattress'),
    slab(w - 0.22, h - 0.22, 0.004, 0, 0.11, d * 0.14, 'art'),
  ],
});
