import { Waves } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'hot-tub',
  name: 'Hot tub',
  kind: 'outdoor',
  category: 'Water',
  icon: Waves,
  tags: ['jacuzzi', 'spa', 'whirlpool'],
  size: { w: 2.2, d: 2.2, h: 0.9 },
  slots: {
    shell: { label: 'Cladding', default: 'timber-dark', category: 'facade' },
    water: { label: 'Water', default: 'water', category: 'terrain' },
    rim: { label: 'Rim', default: 'lacquer-white', category: 'fixture' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => [
    slab(w, h - 0.06, d, 0, 0, 0, 'shell', 0.08),
    slab(w, 0.06, d, 0, h - 0.06, 0, 'rim', 0.04),
    { ...slab(w - 0.3, 0.02, d - 0.3, 0, h - 0.05, 0, 'water', 0.08), noShadow: true },
  ],
});
