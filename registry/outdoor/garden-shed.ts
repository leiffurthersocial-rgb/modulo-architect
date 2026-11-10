import { Warehouse } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'garden-shed',
  name: 'Garden shed',
  kind: 'outdoor',
  category: 'Structures',
  icon: Warehouse,
  tags: ['storage', 'tool shed', 'outbuilding'],
  size: { w: 2.5, d: 2.0, h: 2.3 },
  slots: {
    walls: { label: 'Cladding', default: 'timber-dark', category: 'facade' },
    roof: { label: 'Roof', default: 'roof-zinc', category: 'roof' },
    door: { label: 'Door', default: 'timber-cladding', category: 'facade' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => [
    slab(w, h - 0.2, d, 0, 0, 0, 'walls', 0.01),
    { ...slab(w + 0.3, 0.08, d + 0.4, 0, 0, 0, 'roof'), position: [0, h - 0.12, 0], rotation: [0.1, 0, 0] },
    slab(0.9, 1.9, 0.03, 0, 0, d / 2 + 0.01, 'door'),
  ],
});
