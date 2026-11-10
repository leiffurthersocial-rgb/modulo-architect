import { CookingPot } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'kitchen-sink-unit',
  name: 'Sink unit',
  kind: 'furniture',
  category: 'Kitchen',
  icon: CookingPot,
  tags: ['sink', 'dishwasher', 'cabinet', 'base unit'],
  size: { w: 1.2, d: 0.62, h: 0.9 },
  slots: {
    fronts: { label: 'Fronts', default: 'lacquer-white', category: 'furniture' },
    top: { label: 'Worktop', default: 'floor-terrazzo', category: 'furniture' },
    metal: { label: 'Fixtures', default: 'metal-steel', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0,
  build: ({ size: { w, d, h } }) => [
    slab(w, 0.1, d - 0.08, 0, 0, -0.04, 'metal'),
    slab(w, h - 0.14, d - 0.04, 0, 0.1, -0.02, 'fronts'),
    slab(w / 2 - 0.004, h - 0.15, 0.018, -w / 4, 0.105, d / 2 - 0.03, 'fronts', 0.002),
    slab(w / 2 - 0.004, h - 0.15, 0.018, w / 4, 0.105, d / 2 - 0.03, 'metal', 0.002),
    slab(w, 0.04, d, 0, h - 0.04, 0, 'top', 0.004),
    slab(w * 0.42, 0.012, 0.42, -w / 4, h - 0.005, 0.02, 'metal', 0.02),
    slab(0.025, 0.28, 0.025, -w / 4, h, -d / 2 + 0.08, 'metal'),
  ],
});
