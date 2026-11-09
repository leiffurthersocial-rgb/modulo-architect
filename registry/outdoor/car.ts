import { Car } from 'lucide-react';
import { defineElement } from '../define';
import { slab, cyl } from '../parts';

export default defineElement({
  id: 'car',
  name: 'Car',
  kind: 'outdoor',
  category: 'Vehicles',
  icon: Car,
  tags: ['vehicle', 'parking'],
  size: { w: 1.85, d: 4.5, h: 1.5 },
  resizable: { w: false, d: false, h: false },
  slots: {
    paint: { label: 'Paint', default: 'car-paint', category: 'fixture' },
    glass: { label: 'Glass', default: 'lacquer-black', category: 'fixture' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => {
    const parts = [
      slab(w, h * 0.42, d, 0, 0.22, 0, 'paint', 0.12),
      slab(w * 0.86, h * 0.36, d * 0.5, 0, 0.22 + h * 0.42, -d * 0.04, 'glass', 0.12),
    ];
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        parts.push(
          cyl(0.33, 0.22, (sx * w) / 2 - sx * 0.11, 0.33 - 0.11, sz * d * 0.32, 'rubber', 0.33, 20, [
            0,
            0,
            Math.PI / 2,
          ]),
        );
    return parts.map((p, i) =>
      i >= 2 ? { ...p, position: [p.position[0], 0.33, p.position[2]] as [number, number, number] } : p,
    );
  },
});
