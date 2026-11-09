import { ChefHat } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'kitchen-island',
  name: 'Kitchen island',
  kind: 'furniture',
  category: 'Kitchen',
  icon: ChefHat,
  size: { w: 2.0, d: 1.0, h: 0.92 },
  slots: {
    body: { label: 'Body', default: 'wood-oak', category: 'furniture' },
    top: { label: 'Worktop', default: 'floor-terrazzo', category: 'furniture' },
  },
  snap: 'floor',
  build: ({ size: { w, d, h } }) => [
    slab(w - 0.05, h - 0.04, d - 0.3, 0, 0, -0.12, 'body', 0.005),
    slab(w, 0.04, d, 0, h - 0.04, 0, 'top', 0.006),
  ],
});
