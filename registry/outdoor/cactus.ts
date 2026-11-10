import { Sprout } from 'lucide-react';
import { defineElement } from '../define';
import { cyl, sphere } from '../parts';

export default defineElement({
  id: 'cactus',
  name: 'Saguaro cactus',
  kind: 'outdoor',
  category: 'Planting',
  icon: Sprout,
  tags: ['desert', 'succulent'],
  size: { w: 1.2, d: 0.5, h: 3 },
  slots: { skin: { label: 'Skin', default: 'foliage-dark', category: 'terrain' } },
  snap: 'ground',
  build: ({ size: { w, h } }) => [
    cyl(0.2, h - 0.2, 0, 0, 0, 'skin', 0.18, 12),
    sphere(0.18, 0, h - 0.2, 0, 'skin'),
    cyl(0.12, 0.5, -w * 0.3, h * 0.4, 0, 'skin', 0.12, 10),
    cyl(0.12, 0.5, w * 0.3, h * 0.5, 0, 'skin', 0.12, 10),
    {
      geom: { kind: 'cylinder', radiusTop: 0.12, radiusBottom: 0.12, height: w * 0.32, segments: 10 },
      position: [-w * 0.16, h * 0.4, 0],
      rotation: [0, 0, Math.PI / 2],
      material: 'skin',
    },
    {
      geom: { kind: 'cylinder', radiusTop: 0.12, radiusBottom: 0.12, height: w * 0.32, segments: 10 },
      position: [w * 0.16, h * 0.5, 0],
      rotation: [0, 0, Math.PI / 2],
      material: 'skin',
    },
    sphere(0.12, -w * 0.3, h * 0.4 + 0.5, 0, 'skin'),
    sphere(0.12, w * 0.3, h * 0.5 + 0.5, 0, 'skin'),
  ],
});
