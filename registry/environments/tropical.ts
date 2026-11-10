import type { EnvironmentPreset } from './types';

export default {
  id: 'tropical',
  name: 'Tropical beach',
  description: 'Palms, white sand and a turquoise lagoon',
  swatch: ['#e6d6ac', '#2aa3b3'],
  ground: 'sand-white',
  suggest: { terrain: 'sand-white', latitude: 12, sky: 'clear', hour: 16 },
  coast: { side: 'south', distance: 18, kind: 'beach', drop: 1.2, water: 'lagoon', edge: 'sand-white' },
  hills: [
    { angle: 1.4, distance: 280, radius: 120, height: 70, material: 'forest-floor', rounded: true },
    { angle: 2.1, distance: 330, radius: 140, height: 90, material: 'forest-floor', rounded: true },
  ],
  scatter: [
    { element: 'palm-tree', count: 45, band: [3, 80], scale: [0.8, 1.4] },
    { element: 'flowering-bush', count: 20, band: [2, 30], scale: [0.8, 1.4], inland: true },
    { element: 'ornamental-grass', count: 25, band: [2, 40], scale: [0.6, 1.0] },
    { element: 'boulder', count: 8, band: [10, 40], scale: [0.5, 1.2] },
  ],
} satisfies EnvironmentPreset;
