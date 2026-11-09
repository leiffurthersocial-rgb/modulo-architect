import { LandPlot } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'deck',
  name: 'Deck / terrace',
  kind: 'outdoor',
  category: 'Hardscape',
  icon: LandPlot,
  tags: ['patio', 'terrace', 'decking'],
  size: { w: 5, d: 3, h: 0.18 },
  params: [{ key: 'boards', label: 'Board width', type: 'length', default: 0.14, min: 0.08, max: 0.3, advanced: true }],
  slots: { wood: { label: 'Decking', default: 'timber-cladding', category: 'facade' } },
  snap: 'ground',
  solid: false,
  build: ({ size: { w, d, h }, params }) => {
    const bw = Math.max(0.06, Number(params.boards ?? 0.14));
    const parts = [slab(w - 0.04, h - 0.03, d - 0.04, 0, 0, 0, 'bark')];
    const n = Math.max(1, Math.floor(d / bw));
    const step = d / n;
    for (let i = 0; i < n; i++) parts.push(slab(w, 0.03, step - 0.008, 0, h - 0.03, -d / 2 + step * (i + 0.5), 'wood'));
    return parts;
  },
});
