import { Library } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'bookshelf',
  name: 'Bookshelf',
  kind: 'furniture',
  category: 'Living',
  icon: Library,
  tags: ['shelving', 'books', 'storage'],
  size: { w: 1.0, d: 0.35, h: 2.0 },
  params: [{ key: 'shelves', label: 'Shelves', type: 'number', default: 5, min: 2, max: 10, step: 1 }],
  slots: {
    body: { label: 'Frame', default: 'wood-oak', category: 'furniture' },
    books: { label: 'Books', default: 'fabric-rust', category: 'furniture' },
  },
  snap: 'floor',
  wallOffset: 0.01,
  build: ({ size: { w, d, h }, params }) => {
    const t = 0.025;
    const n = Math.max(2, Math.round(Number(params.shelves) || 5));
    const parts = [
      slab(t, h, d, -w / 2 + t / 2, 0, 0, 'body'),
      slab(t, h, d, w / 2 - t / 2, 0, 0, 'body'),
      slab(w, t, d, 0, h - t, 0, 'body'),
      slab(w - 2 * t, 0.06, d, 0, 0, 0, 'body'),
      slab(w - 2 * t, h - 0.06, 0.01, 0, 0.06, -d / 2 + 0.005, 'body'),
    ];
    const gap = (h - 0.06) / n;
    for (let i = 1; i < n; i++)
      parts.push(slab(w - 2 * t, t, d - 0.01, 0, 0.06 + gap * i - t / 2, 0.005, 'body'));
    for (let i = 0; i < n; i += 2) {
      const bw = (w - 2 * t) * (0.45 + 0.08 * (i % 3));
      parts.push(
        slab(bw, gap * 0.62, d * 0.7, -w / 2 + t + bw / 2 + 0.01, 0.06 + gap * i + t / 2, -0.02, 'books'),
      );
    }
    return parts;
  },
});
