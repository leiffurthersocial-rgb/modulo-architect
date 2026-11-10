import { DEFAULT_MATERIALS } from '@/registry/materials';
import { createId } from './ids';
import type { Level, Project, Settings, WallProps } from './types';
import { DEFAULT_LIGHTING, SCHEMA_VERSION } from './schema';

export const DEFAULTS = {
  wallThickness: 0.2,
  interiorWallThickness: 0.12,
  levelHeight: 2.8,
  floorThickness: 0.25,
  doorWidth: 0.9,
  doorHeight: 2.1,
  windowWidth: 1.2,
  windowHeight: 1.3,
  windowSill: 0.9,
  stairWidth: 1.0,
  plotWidth: 30,
  plotDepth: 30,
} as const;

export const DEFAULT_SETTINGS: Settings = {
  units: 'metric',
  gridSize: 0.1,
  snapping: true,
  angleStep: 15,
  showDimensions: true,
};

export function defaultWallProps(thickness: number = DEFAULTS.wallThickness): WallProps {
  return {
    thickness,
    height: null,
    materials: { left: DEFAULT_MATERIALS.wallInterior, right: DEFAULT_MATERIALS.wallInterior },
  };
}

export function createLevel(index: number, elevation: number, height: number = DEFAULTS.levelHeight): Level {
  return {
    id: createId('level'),
    name: index === 0 ? 'Ground floor' : `Level ${index}`,
    elevation,
    height,
    floorThickness: DEFAULTS.floorThickness,
    nodes: [],
    walls: [],
    rooms: [],
    openings: [],
    stairs: [],
    items: [],
    slabs: [],
  };
}

export function createProject(name = 'Untitled house'): Project {
  const now = Date.now();
  const hw = DEFAULTS.plotWidth / 2;
  const hd = DEFAULTS.plotDepth / 2;
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId('project'),
    name,
    createdAt: now,
    updatedAt: now,
    site: {
      plot: [
        { x: -hw, y: -hd },
        { x: hw, y: -hd },
        { x: hw, y: hd },
        { x: -hw, y: hd },
      ],
      terrainMaterial: 'meadow',
      northAngle: 0,
      latitude: 48,
      environment: 'countryside',
    },
    building: { levels: [createLevel(0, 0)], roofs: [] },
    exterior: { facadeMaterial: DEFAULT_MATERIALS.facade, items: [], sun: { hour: 15, month: 6 } },
    settings: { ...DEFAULT_SETTINGS },
    lighting: { ...DEFAULT_LIGHTING },
  };
}
