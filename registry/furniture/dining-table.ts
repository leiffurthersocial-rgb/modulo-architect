import { Utensils } from 'lucide-react';
import { defineElement } from '../define';
import { slab, legs } from '../parts';

export default defineElement({
  id: 'dining-table',
  name: 'Dining table',
  kind: 'furniture',
  category: 'Dining',
  icon: Utensils,
  tags: ['table', 'kitchen'],
  size: { w: 1.8, d: 0.9, h: 0.75 },
  slots: {
    top: { label: 'Top', default: 'wood-oak', category: 'furniture' },
    legs: { label: 'Legs', default: 'wood-oak', category: 'furniture' },
  },
  snap: 'floor',
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.035, d, 0, h - 0.035, 0, 'top', 0.008),
    ...legs(w, d, h - 0.035, 0.08, 'legs', 0.05),
  ],
});
