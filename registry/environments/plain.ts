import type { EnvironmentPreset } from './types';

export default {
  id: 'plain',
  name: 'Open field',
  description: 'Just your plot on a quiet lawn',
  swatch: ['#9fb57c', '#cfdcb4'],
  ground: 'meadow',
  suggest: { terrain: 'meadow', latitude: 48, sky: 'auto' },
  scatter: [],
} satisfies EnvironmentPreset;
