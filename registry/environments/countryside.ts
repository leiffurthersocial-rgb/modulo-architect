import type { EnvironmentPreset } from './types';

export default {
  id: 'countryside',
  name: 'Countryside',
  description: 'Rolling meadows, hedgerows and old trees',
  swatch: ['#7f9a5a', '#d9e2b8'],
  ground: 'meadow',
  suggest: { terrain: 'meadow', latitude: 50, sky: 'partly-cloudy' },
  hills: [
    { angle: 0.4, distance: 260, radius: 140, height: 28, material: 'meadow', rounded: true },
    { angle: 1.6, distance: 320, radius: 180, height: 40, material: 'meadow', rounded: true },
    { angle: 2.7, distance: 240, radius: 120, height: 22, material: 'rough-grass', rounded: true },
    { angle: 4.2, distance: 300, radius: 160, height: 34, material: 'meadow', rounded: true },
    { angle: 5.4, distance: 270, radius: 130, height: 26, material: 'rough-grass', rounded: true },
  ],
  scatter: [
    { element: 'm-island-tree-01', count: 6, band: [6, 40], scale: [0.9, 1.2] },
    { element: 'm-tree-small-02', count: 8, band: [4, 35], scale: [0.8, 1.2] },
    { element: 'tree', count: 40, band: [8, 120], scale: [0.8, 1.5] },
    { element: 'birch', count: 18, band: [10, 90], scale: [0.8, 1.3] },
    { element: 'shrub', count: 40, band: [3, 70], scale: [0.7, 1.6] },
    { element: 'flowering-bush', count: 12, band: [2, 25], scale: [0.7, 1.2] },
  ],
} satisfies EnvironmentPreset;
