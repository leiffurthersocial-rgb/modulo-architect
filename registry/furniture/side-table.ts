import { Table } from 'lucide-react';
import { defineElement } from '../define';
import { cyl } from '../parts';

export default defineElement({
  id: 'side-table',
  name: 'Side table',
  kind: 'furniture',
  category: 'Living',
  icon: Table,
  size: { w: 0.45, d: 0.45, h: 0.52 },
  slots: { top: { label: 'Finish', default: 'lacquer-white', category: 'furniture' } },
  snap: 'floor',
  footprint: ({ size: { w } }) =>
    Array.from({ length: 12 }, (_, i) => ({ x: (Math.cos((i / 12) * Math.PI * 2) * w) / 2, y: (Math.sin((i / 12) * Math.PI * 2) * w) / 2 })),
  build: ({ size: { w, h } }) => [
    cyl(w / 2, 0.025, 0, h - 0.025, 0, 'top', w / 2, 32),
    cyl(0.025, h - 0.045, 0, 0.02, 0, 'top', 0.025, 12),
    cyl(w / 2.6, 0.02, 0, 0, 0, 'top', w / 2.6, 32),
  ],
});
