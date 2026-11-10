import { Rows3 } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'wall-shelf',
  name: 'Wall shelf',
  kind: 'furniture',
  category: 'Decor',
  icon: Rows3,
  tags: ['floating shelf', 'shelves', 'books'],
  size: { w: 1.2, d: 0.25, h: 0.7 },
  elevation: 1.2,
  params: [{ key: 'shelves', label: 'Shelves', type: 'number', default: 3, min: 1, max: 6, step: 1 }],
  slots: {
    wood: { label: 'Shelves', default: 'wood-oak', category: 'furniture' },
    books: { label: 'Books', default: 'fabric-ink', category: 'furniture' },
  },
  snap: 'wall',
  wallOffset: 0,
  solid: false,
  build: ({ size: { w, d, h }, params }) => {
    const n = Math.max(1, Math.round(Number(params.shelves) || 3));
    const parts = [];
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? 0 : (h - 0.03) * (i / (n - 1));
      parts.push(slab(w, 0.03, d, 0, y, 0, 'wood', 0.004));
      if (i < n - 1 || n === 1)
        parts.push(slab(w * 0.35, 0.2, d * 0.75, -w * 0.25 + (i % 2) * w * 0.4, y + 0.03, -0.02, 'books'));
    }
    return parts;
  },
});
