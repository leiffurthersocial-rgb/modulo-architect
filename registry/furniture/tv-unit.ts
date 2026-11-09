import { Tv } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'tv-unit',
  name: 'TV unit',
  kind: 'furniture',
  category: 'Living',
  icon: Tv,
  tags: ['media', 'sideboard', 'television'],
  size: { w: 1.8, d: 0.42, h: 1.25 },
  slots: {
    body: { label: 'Cabinet', default: 'wood-walnut', category: 'furniture' },
    screen: { label: 'Screen', default: 'lacquer-black', category: 'fixture' },
  },
  params: [{ key: 'tv', label: 'Television', type: 'boolean', default: true }],
  snap: 'floor',
  wallOffset: 0.02,
  build: ({ size: { w, d, h }, params }) => {
    const parts = [slab(w, 0.45, d, 0, 0.08, 0, 'body', 0.01), slab(w - 0.1, 0.08, d - 0.1, 0, 0, 0, 'screen')];
    if (params.tv !== false) {
      const tvW = Math.min(w * 0.75, 1.45);
      parts.push(slab(tvW, Math.min(h - 0.55, tvW * 0.56), 0.04, 0, 0.6, -d / 2 + 0.08, 'screen', 0.005));
      parts.push(slab(0.25, 0.07, 0.15, 0, 0.53, -d / 2 + 0.12, 'screen'));
    }
    return parts;
  },
});
