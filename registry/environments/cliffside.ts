import type { EnvironmentPreset } from './types';

export default {
  id: 'cliffside',
  name: 'Cliffside',
  description: 'A windswept headland above the open sea',
  swatch: ['#6f7f5e', '#2e6a85'],
  ground: 'rough-grass',
  suggest: { terrain: 'rough-grass', latitude: 52, sky: 'partly-cloudy' },
  coast: {
    side: 'south',
    distance: 14,
    kind: 'cliff',
    drop: 32,
    water: 'sea',
    edge: 'rocky-ground',
    rock: 'rock',
  },
  hills: [
    { angle: 1.2, distance: 300, radius: 160, height: 35, material: 'rough-grass', rounded: true },
    { angle: 2.2, distance: 260, radius: 120, height: 24, material: 'meadow', rounded: true },
  ],
  scatter: [
    { element: 'boulder', count: 40, band: [2, 60], scale: [0.6, 2.2] },
    { element: 'ornamental-grass', count: 50, band: [1, 40], scale: [0.6, 1.2] },
    { element: 'conifer', count: 10, band: [20, 90], scale: [0.6, 1.0], inland: true },
    { element: 'shrub', count: 25, band: [3, 50], scale: [0.5, 1.0] },
  ],
} satisfies EnvironmentPreset;
