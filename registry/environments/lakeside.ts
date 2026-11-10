import type { EnvironmentPreset } from './types';

export default {
  id: 'lakeside',
  name: 'Lakeside forest',
  description: 'A still lake fringed by birch and pine',
  swatch: ['#3f5f4b', '#2d5560'],
  ground: 'forest-floor',
  suggest: { terrain: 'forest-floor', latitude: 60, sky: 'golden-hour', hour: 19 },
  lake: { side: 'south', distance: 10, width: 140, length: 90, water: 'lake', shore: 'gravel' },
  hills: [
    { angle: 0.8, distance: 360, radius: 200, height: 60, material: 'forest-floor', rounded: true },
    { angle: 2.4, distance: 340, radius: 180, height: 55, material: 'forest-floor', rounded: true },
  ],
  scatter: [
    { element: 'conifer', count: 160, band: [14, 150], scale: [0.8, 1.6], inland: true },
    { element: 'birch', count: 60, band: [8, 90], scale: [0.8, 1.3], inland: true },
    { element: 'boulder', count: 20, band: [4, 60], scale: [0.5, 1.6] },
    { element: 'ornamental-grass', count: 30, band: [2, 30], scale: [0.6, 1.1] },
  ],
} satisfies EnvironmentPreset;
