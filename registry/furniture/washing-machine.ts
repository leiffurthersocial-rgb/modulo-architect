import { WashingMachine } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'washing-machine',
  name: 'Washing machine',
  kind: 'furniture',
  category: 'Bathroom',
  icon: WashingMachine,
  tags: ['laundry', 'washer', 'dryer', 'appliance'],
  size: { w: 0.6, d: 0.6, h: 0.85 },
  resizable: { w: false, d: false, h: false },
  slots: {
    body: { label: 'Body', default: 'lacquer-white', category: 'fixture' },
    glass: { label: 'Door', default: 'lacquer-black', category: 'fixture' },
  },
  snap: 'floor',
  wallOffset: 0.02,
  build: ({ size: { w, d, h } }) => [
    slab(w, h, d, 0, 0, 0, 'body', 0.02),
    {
      geom: { kind: 'cylinder', radiusTop: 0.17, radiusBottom: 0.17, height: 0.02, segments: 32 },
      position: [0, h * 0.45, d / 2 + 0.005],
      rotation: [Math.PI / 2, 0, 0],
      material: 'glass',
    },
  ],
});
