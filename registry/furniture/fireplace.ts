import { Flame } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'fireplace',
  name: 'Wood stove',
  kind: 'furniture',
  category: 'Living',
  icon: Flame,
  tags: ['fireplace', 'stove', 'heater'],
  size: { w: 0.55, d: 0.5, h: 1.1 },
  slots: {
    body: { label: 'Body', default: 'metal-black', category: 'fixture' },
    glow: { label: 'Fire', default: 'lamp-glow', category: 'fixture' },
    hearth: { label: 'Hearth', default: 'stone', category: 'floor' },
  },
  snap: 'floor',
  wallOffset: 0.15,
  build: ({ size: { w, d, h } }) => [
    slab(w + 0.4, 0.03, d + 0.4, 0, 0, 0.1, 'hearth'),
    slab(w, h * 0.75, d, 0, 0.03, 0, 'body', 0.02),
    slab(w * 0.6, h * 0.3, 0.01, 0, h * 0.3, d / 2, 'glow'),
    { geom: { kind: 'cylinder', radiusTop: 0.08, radiusBottom: 0.08, height: h * 0.25 + 1.2, segments: 16 }, position: [0, h * 0.78 + (h * 0.25 + 1.2) / 2, 0], material: 'body' },
  ],
});
