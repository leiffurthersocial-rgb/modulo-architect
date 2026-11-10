import type { EnvironmentPreset } from './types';

export default {
  id: 'suburban',
  name: 'Suburban street',
  description: 'A quiet street with neighbours and front lawns',
  swatch: ['#8a9a7a', '#c9c6bd'],
  ground: 'meadow',
  suggest: { terrain: 'grass', latitude: 45, sky: 'clear' },
  road: { side: 'south', distance: 3, width: 7 },
  neighbours: 6,
  scatter: [
    { element: 'tree', count: 14, band: [4, 45], scale: [0.8, 1.2] },
    { element: 'shrub', count: 24, band: [2, 30], scale: [0.6, 1.2] },
    { element: 'hedge', count: 6, band: [2, 30], scale: [0.8, 1] },
  ],
  hills: [{ angle: 1.6, distance: 380, radius: 220, height: 30, material: 'forest-floor', rounded: true }],
} satisfies EnvironmentPreset;
