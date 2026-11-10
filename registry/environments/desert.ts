import type { EnvironmentPreset } from './types';

export default {
  id: 'desert',
  name: 'Desert',
  description: 'Red mesas, cacti and dry earth',
  swatch: ['#c9925f', '#e8cfa5'],
  ground: 'sand-desert',
  suggest: { terrain: 'sand-desert', latitude: 33, sky: 'clear', hour: 17 },
  hills: [
    { angle: 0.6, distance: 350, radius: 120, height: 70, material: 'rock' },
    { angle: 1.7, distance: 420, radius: 160, height: 90, material: 'rock' },
    { angle: 3.0, distance: 380, radius: 140, height: 60, material: 'rock' },
    { angle: 4.6, distance: 400, radius: 180, height: 80, material: 'rock' },
  ],
  scatter: [
    { element: 'cactus', count: 40, band: [4, 120], scale: [0.6, 1.4] },
    { element: 'boulder', count: 50, band: [3, 120], scale: [0.5, 2.5] },
    { element: 'ornamental-grass', count: 30, band: [2, 60], scale: [0.4, 0.8] },
  ],
  haze: 0.8,
} satisfies EnvironmentPreset;
