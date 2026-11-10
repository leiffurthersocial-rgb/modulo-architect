import { z } from 'zod';

/**
 * The Modulo document model. Plain, serialisable JSON. Geometry is never stored, only parameters.
 * Units: meters, radians. Plan space is (x, y) where +y points "south" (down on screen) and maps
 * to world +z in 3D. Bump SCHEMA_VERSION and add a migration in migrations.ts on any breaking change.
 */
export const SCHEMA_VERSION = 1;

const id = z.string().min(1);
const num = z.number().finite();
const flags = { locked: z.boolean().optional(), hidden: z.boolean().optional() };
const paramValue = z.union([z.number(), z.string(), z.boolean()]);

export const Vec2Schema = z.object({ x: num, y: num });

/** A wall graph vertex. Walls reference nodes, so moving a node moves every wall (and room) on it. */
export const NodeSchema = z.object({ id, x: num, y: num });

export const WallSchema = z.object({
  id,
  a: id,
  b: id,
  thickness: num.positive(),
  /** null = inherit the level's floor height. */
  height: num.positive().nullable(),
  /** Material on the left (relative to a→b) and right faces. */
  materials: z.object({ left: z.string(), right: z.string() }),
  /** Facade override for this wall's exterior face (defaults to the project facade). */
  facade: z.string().optional(),
  ...flags,
});

export const RoomSchema = z.object({
  id,
  name: z.string(),
  /** Ordered loop of node ids. Polygon is derived from node positions. */
  nodes: z.array(id).min(3),
  floorMaterial: z.string(),
  ceilingMaterial: z.string(),
  /** False when the user removed this room's floor (walls stay). */
  floor: z.boolean().default(true),
  ...flags,
});

/** A free-standing floor slab, independent of walls (patios, landings, kept floors). */
export const SlabSchema = z.object({
  id,
  points: z.array(z.object({ x: num, y: num })).min(3),
  material: z.string(),
  thickness: num.positive(),
  ...flags,
});

export const OpeningSchema = z.object({
  id,
  /** Registry id, e.g. "door-single". */
  type: z.string(),
  wallId: id,
  /** Distance from the wall's start node to the opening centre. */
  offset: num,
  width: num.positive(),
  height: num.positive(),
  sill: num.min(0),
  /** Door swings to the other side of the wall. */
  flip: z.boolean().default(false),
  /** Hinge on the other jamb. */
  mirror: z.boolean().default(false),
  material: z.string().optional(),
  params: z.record(z.string(), paramValue).default({}),
  ...flags,
});

export const StairSchema = z.object({
  id,
  type: z.enum(['straight', 'l-shaped']),
  x: num,
  y: num,
  rotation: num,
  width: num.positive(),
  /** Horizontal run of the first flight. */
  length: num.positive(),
  /** Run of the second flight (L-shaped). */
  length2: num.positive().default(1.6),
  turn: z.enum(['left', 'right']).default('left'),
  /** null = rise to the next level. */
  rise: num.positive().nullable(),
  /** Cut a stairwell into the floor above (and this level's ceiling). */
  opening: z.boolean().default(true),
  material: z.string(),
  ...flags,
});

export const ItemSchema = z.object({
  id,
  /** Registry id, e.g. "sofa-3". */
  type: z.string(),
  name: z.string().optional(),
  x: num,
  y: num,
  /** Elevation of the item's base above its floor/terrain. */
  z: num.default(0),
  rotation: num,
  size: z.object({ w: num.positive(), d: num.positive(), h: num.positive() }),
  params: z.record(z.string(), paramValue).default({}),
  /** Overrides for the element's material slots (slot -> material id). */
  materials: z.record(z.string(), z.string()).default({}),
  ...flags,
});

export const LevelSchema = z.object({
  id,
  name: z.string(),
  /** Height of the finished floor above ground (0 = ground floor). */
  elevation: num,
  /** Floor-to-floor height. Walls inherit this unless overridden. */
  height: num.positive(),
  floorThickness: num.positive(),
  nodes: z.array(NodeSchema),
  walls: z.array(WallSchema),
  rooms: z.array(RoomSchema),
  openings: z.array(OpeningSchema),
  stairs: z.array(StairSchema),
  items: z.array(ItemSchema),
  slabs: z.array(SlabSchema).default([]),
  ...flags,
});

export const RoofSchema = z.object({
  id,
  levelId: id,
  type: z.enum(['flat', 'gable', 'hip', 'shed']),
  /** When true the footprint follows the level's walls. */
  auto: z.boolean(),
  x: num,
  y: num,
  width: num.positive(),
  depth: num.positive(),
  rotation: num,
  /** Ridge runs along the long side when "auto", otherwise along x or y of the roof frame. */
  ridge: z.enum(['auto', 'x', 'y']).default('auto'),
  pitch: num.min(0).max(75),
  overhang: num.min(0),
  thickness: num.positive(),
  material: z.string(),
  ...flags,
});

export const BuildingSchema = z.object({
  levels: z.array(LevelSchema).min(1),
  roofs: z.array(RoofSchema),
});

export const SiteSchema = z.object({
  /** Plot boundary polygon in plan space. */
  plot: z.array(Vec2Schema).min(3),
  terrainMaterial: z.string(),
  /** Rotation of north from plan "up", radians. */
  northAngle: num,
  latitude: num.min(-90).max(90),
});

export const ExteriorSchema = z.object({
  /** Default facade material for exterior wall faces. */
  facadeMaterial: z.string(),
  items: z.array(ItemSchema),
  sun: z.object({ hour: num.min(0).max(24), month: num.min(1).max(12) }),
});

export const SettingsSchema = z.object({
  units: z.enum(['metric', 'imperial']),
  gridSize: num.positive(),
  snapping: z.boolean(),
  angleStep: num.positive(),
  showDimensions: z.boolean(),
});

export const ProjectSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id,
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  site: SiteSchema,
  building: BuildingSchema,
  exterior: ExteriorSchema,
  settings: SettingsSchema,
});

export type Node = z.infer<typeof NodeSchema>;
export type Wall = z.infer<typeof WallSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Slab = z.infer<typeof SlabSchema>;
export type Opening = z.infer<typeof OpeningSchema>;
export type Stair = z.infer<typeof StairSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type Roof = z.infer<typeof RoofSchema>;
export type Building = z.infer<typeof BuildingSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type Exterior = z.infer<typeof ExteriorSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Project = z.infer<typeof ProjectSchema>;

export type EntityKind =
  'node' | 'wall' | 'room' | 'slab' | 'opening' | 'stair' | 'item' | 'roof' | 'level' | 'site';
