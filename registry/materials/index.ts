import type { MaterialCategory, MaterialDef } from './types';

export type { MaterialDef, MaterialCategory } from './types';

/**
 * The material registry. Every surface in the model references one of these ids, so adding a
 * textured material later is just a new entry with `maps` filled in.
 */
const M = (
  id: string,
  name: string,
  categories: MaterialCategory[],
  color: string,
  roughness = 0.8,
  metalness = 0,
  extra: Partial<MaterialDef> = {},
): MaterialDef => ({ id, name, categories, color, roughness, metalness, ...extra });

export const MATERIALS: MaterialDef[] = [
  // Floors
  M('floor-oak', 'Oak', ['floor', 'furniture'], '#c9a57a', 0.62),
  M('floor-ash', 'Light ash', ['floor', 'furniture'], '#e2d0b0', 0.6),
  M('floor-walnut', 'Walnut', ['floor', 'furniture'], '#7a5536', 0.55),
  M('floor-concrete', 'Polished concrete', ['floor', 'facade'], '#b9b7b1', 0.38),
  M('floor-tile-white', 'White tile', ['floor', 'wall'], '#ecebe6', 0.25),
  M('floor-tile-slate', 'Slate tile', ['floor'], '#4f5257', 0.45),
  M('floor-terrazzo', 'Terrazzo', ['floor'], '#d9d4cb', 0.35),
  M('floor-carpet', 'Grey carpet', ['floor'], '#918e89', 0.98),
  // Walls (interior paint)
  M('paint-white', 'Warm white', ['wall'], '#f2f0eb', 0.92),
  M('paint-linen', 'Linen', ['wall'], '#e8e0d2', 0.92),
  M('paint-sage', 'Sage', ['wall'], '#b8c2ad', 0.92),
  M('paint-clay', 'Clay', ['wall'], '#d3a98d', 0.92),
  M('paint-sky', 'Pale sky', ['wall'], '#c3d3de', 0.92),
  M('paint-charcoal', 'Charcoal', ['wall'], '#3c3c40', 0.9),
  // Facades
  M('render-white', 'White render', ['facade', 'wall'], '#efece5', 0.95),
  M('render-sand', 'Sand render', ['facade'], '#d9ccb4', 0.95),
  M('brick-red', 'Red brick', ['facade'], '#9c4c37', 0.9),
  M('brick-white', 'Whitewashed brick', ['facade'], '#e4dfd5', 0.9),
  M('timber-cladding', 'Larch cladding', ['facade', 'floor'], '#a07955', 0.75),
  M('timber-dark', 'Charred timber', ['facade'], '#3f342b', 0.85),
  M('stone', 'Limestone', ['facade', 'floor', 'terrain'], '#b3ab9c', 0.85),
  M('metal-anthracite', 'Anthracite metal', ['facade', 'roof', 'fixture'], '#3a3d42', 0.45, 0.6),
  // Roofs
  M('roof-terracotta', 'Terracotta tile', ['roof'], '#a95c3e', 0.85),
  M('roof-slate', 'Slate', ['roof'], '#3f444b', 0.7),
  M('roof-zinc', 'Standing seam zinc', ['roof'], '#7b8188', 0.4, 0.55),
  M('roof-green', 'Green roof', ['roof', 'terrain'], '#6e8a54', 1),
  M('roof-gravel', 'Gravel ballast', ['roof', 'terrain'], '#a29e95', 1),
  // Terrain
  M('grass', 'Lawn', ['terrain'], '#8fab6c', 1),
  M('meadow', 'Meadow', ['terrain'], '#a3b77d', 1),
  M('gravel', 'Gravel', ['terrain'], '#bdb7ab', 1),
  M('sand', 'Sand', ['terrain'], '#dccca6', 1),
  M('soil', 'Soil', ['terrain'], '#7c624b', 1),
  M('paving', 'Paving slabs', ['terrain', 'floor'], '#bcb8b0', 0.9),
  M('asphalt', 'Asphalt', ['terrain'], '#55575a', 0.95),
  M('water', 'Pool water', ['terrain', 'fixture'], '#4fa3c7', 0.05, 0, { opacity: 0.72 }),
  // Furniture & fixtures
  M('fabric-linen', 'Linen fabric', ['furniture'], '#d9d3c7', 0.95),
  M('fabric-charcoal', 'Charcoal fabric', ['furniture'], '#4b4b50', 0.95),
  M('fabric-sage', 'Sage fabric', ['furniture'], '#9caa90', 0.95),
  M('fabric-rust', 'Rust fabric', ['furniture'], '#b4673f', 0.95),
  M('fabric-ink', 'Ink fabric', ['furniture'], '#38415a', 0.95),
  M('lacquer-white', 'White lacquer', ['furniture', 'fixture'], '#f3f1ed', 0.4),
  M('lacquer-black', 'Black lacquer', ['furniture', 'fixture'], '#242427', 0.4),
  M('wood-oak', 'Oak wood', ['furniture'], '#c6a074', 0.6),
  M('wood-walnut', 'Walnut wood', ['furniture'], '#6f4c31', 0.55),
  M('metal-steel', 'Brushed steel', ['fixture', 'furniture'], '#b9bdc3', 0.35, 0.85),
  M('metal-black', 'Black metal', ['fixture', 'furniture'], '#2b2b2e', 0.5, 0.6),
  M('brass', 'Brass', ['fixture', 'furniture'], '#b8964f', 0.35, 0.9),
  M('ceramic', 'White ceramic', ['fixture'], '#f7f6f3', 0.15),
  M('glass', 'Glass', ['fixture'], '#cfe3ea', 0.05, 0.1, { opacity: 0.28 }),
  M('mattress', 'Bedding', ['furniture'], '#f4f2ed', 0.95),
  M('foliage', 'Foliage', ['furniture', 'terrain'], '#5f8a4f', 0.9),
  M('foliage-dark', 'Dark foliage', ['furniture', 'terrain'], '#3f6a3b', 0.9),
  M('bark', 'Bark', ['furniture', 'terrain'], '#6b5141', 0.95),
  M('terracotta-pot', 'Terracotta', ['furniture'], '#b8704f', 0.85),
  M('lamp-glow', 'Lamp shade', ['fixture'], '#fff4dc', 0.6, 0, { emissive: '#ffe6b0', emissiveIntensity: 0.35 }),
  M('car-paint', 'Car paint', ['fixture'], '#8a9aa8', 0.3, 0.5),
  M('rubber', 'Rubber', ['fixture'], '#1f1f21', 0.9),
];

const byId = new Map(MATERIALS.map((m) => [m.id, m]));

export const FALLBACK_MATERIAL: MaterialDef = M('fallback', 'Default', ['wall'], '#cccccc');

export function getMaterial(id: string | undefined): MaterialDef {
  return (id && byId.get(id)) || FALLBACK_MATERIAL;
}

export function materialsFor(category: MaterialCategory): MaterialDef[] {
  return MATERIALS.filter((m) => m.categories.includes(category));
}

export function registerMaterial(def: MaterialDef) {
  if (byId.has(def.id)) throw new Error(`Material "${def.id}" already registered`);
  MATERIALS.push(def);
  byId.set(def.id, def);
}

export const DEFAULT_MATERIALS = {
  wallInterior: 'paint-white',
  facade: 'render-white',
  floor: 'floor-oak',
  ceiling: 'paint-white',
  roof: 'roof-slate',
  terrain: 'grass',
  stair: 'floor-oak',
  frame: 'lacquer-white',
} as const;
