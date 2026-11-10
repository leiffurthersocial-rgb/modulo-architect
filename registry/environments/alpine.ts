import type { EnvironmentPreset } from './types';

export default {
  id: 'alpine',
  name: 'Alpine valley',
  description: 'Conifer forest and snow-capped peaks',
  swatch: ['#4e6b4a', '#e9eef2'],
  ground: 'meadow',
  suggest: { terrain: 'meadow', latitude: 46.5, sky: 'clear' },
  hills: [
    { angle: 0.3, distance: 420, radius: 220, height: 260, material: 'rock', snow: true },
    { angle: 1.1, distance: 480, radius: 260, height: 340, material: 'rock', snow: true },
    { angle: 1.9, distance: 450, radius: 240, height: 300, material: 'rock', snow: true },
    { angle: 2.8, distance: 400, radius: 200, height: 220, material: 'rock', snow: true },
    { angle: 4.0, distance: 460, radius: 250, height: 280, material: 'rock', snow: true },
    { angle: 5.2, distance: 430, radius: 230, height: 240, material: 'rock', snow: true },
  ],
  scatter: [
    { element: 'm-fir-tree-01', count: 16, band: [18, 75], scale: [0.7, 1.05] },
    { element: 'conifer', count: 220, band: [18, 180], scale: [0.8, 1.8] },
    { element: 'boulder', count: 30, band: [5, 90], scale: [0.6, 2] },
    { element: 'shrub', count: 20, band: [3, 40], scale: [0.5, 1] },
  ],
  haze: 1.6,
} satisfies EnvironmentPreset;
