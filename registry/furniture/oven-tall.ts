import { Microwave } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'oven-tall',
  name: 'Oven tower',
  kind: 'furniture',
  category: 'Kitchen',
  icon: Microwave,
  tags: ['oven', 'microwave', 'appliance', 'tall unit'],
  size: { w: 0.6, d: 0.62, h: 2.2 },
  slots: {
    body: { label: 'Cabinet', default: 'lacquer-white', category: 'furniture' },
    appliance: { label: 'Appliances', default: 'lacquer-black', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0,
  build: ({ size: { w, d, h } }) => [
    slab(w, h, d - 0.02, 0, 0, -0.01, 'body'),
    slab(w - 0.04, 0.58, 0.02, 0, 0.85, d / 2, 'appliance', 0.004),
    slab(w - 0.04, 0.38, 0.02, 0, 1.47, d / 2, 'appliance', 0.004),
  ],
});
