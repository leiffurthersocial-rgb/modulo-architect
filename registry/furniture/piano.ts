import { KeyboardMusic } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'piano',
  name: 'Upright piano',
  kind: 'furniture',
  category: 'Living',
  icon: KeyboardMusic,
  tags: ['music', 'instrument', 'keyboard'],
  size: { w: 1.5, d: 0.6, h: 1.25 },
  resizable: { w: false, d: false, h: false },
  slots: {
    body: { label: 'Finish', default: 'lacquer-black', category: 'furniture' },
    keys: { label: 'Keys', default: 'lacquer-white', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.05,
  build: ({ size: { w, d, h } }) => [
    slab(w, h, d * 0.55, 0, 0, -d * 0.22, 'body', 0.01),
    slab(w - 0.1, 0.05, d * 0.25, 0, 0.7, d * 0.18, 'keys'),
    slab(w, 0.04, d * 0.3, 0, 0.66, d * 0.18, 'body'),
    slab(0.06, 0.66, d * 0.4, -w / 2 + 0.03, 0, d * 0.15, 'body'),
    slab(0.06, 0.66, d * 0.4, w / 2 - 0.03, 0, d * 0.15, 'body'),
  ],
});
