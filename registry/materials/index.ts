import type { MaterialCategory, MaterialDef } from './types';
import manifest from './textures.generated.json';

export type { MaterialDef, MaterialCategory } from './types';

/**
 * The material registry. Every surface references one of these ids. Textured entries point at a
 * CC0 scan in /public/textures (fetched and optimised by scripts/fetch-textures.py); their size
 * on screen is the scan's real-world dimensions, so a 1.7 m plank repeat is 1.7 m in the model.
 */
type Manifest = Record<
  string,
  { name: string; size: [number, number]; avg: string | null; maps: string[]; source: string }
>;
const TEX = manifest as unknown as Manifest;

/** Flat (untextured) material. */
const M = (
  id: string,
  name: string,
  categories: MaterialCategory[],
  color: string,
  roughness = 0.8,
  metalness = 0,
  extra: Partial<MaterialDef> = {},
): MaterialDef => ({ id, name, categories, color, roughness, metalness, ...extra });

interface TexOpts {
  /** Multiply a neutral detail map by this colour. */
  tint?: string;
  /** Scale the scan's real size (2 = twice as large). */
  scale?: number;
  roughness?: number;
  metalness?: number;
  normalScale?: number;
  rotation?: number;
  group?: string;
  brightness?: number;
  /** Warm/cool cast multiplied into an untinted scan. */
  cast?: string;
}

/** Textured material backed by a scan in public/textures/<asset>. */
function T(
  id: string,
  name: string,
  categories: MaterialCategory[],
  asset: string,
  o: TexOpts = {},
): MaterialDef {
  const t = TEX[asset];
  if (!t) return M(id, name, categories, o.tint ?? '#bbbbbb');
  const base = `/textures/${asset}`;
  const tinted = !!o.tint && t.maps.includes('detail');
  const k = o.scale ?? 1;
  return {
    id,
    name,
    categories,
    color: o.tint ?? o.cast ?? t.avg ?? '#bbbbbb',
    roughness: o.roughness ?? 1,
    metalness: o.metalness ?? 0,
    maps: {
      color: `${base}/${tinted ? 'detail' : 'color'}.jpg`,
      normal: t.maps.includes('normal') ? `${base}/normal.jpg` : undefined,
      arm: t.maps.includes('arm') ? `${base}/arm.jpg` : undefined,
      thumb: `${base}/thumb.jpg`,
    },
    uvScale: [t.size[0] * k, t.size[1] * k],
    tinted: tinted || !!o.cast,
    brightness: o.brightness,
    antiTile: categories.includes('terrain') || undefined,
    normalScale: o.normalScale,
    rotation: o.rotation,
    group: o.group,
    source: t.source,
  };
}

export const MATERIALS: MaterialDef[] = [
  // ── Floors: wood
  T('floor-oak', 'Oak boards', ['floor'], 'WoodFloor051', { group: 'Wood' }),
  T('floor-ash', 'Light ash', ['floor'], 'laminate_floor_02', { group: 'Wood' }),
  T('floor-wood-classic', 'Classic planks', ['floor'], 'wood_floor', { group: 'Wood' }),
  T('floor-walnut', 'Walnut', ['floor'], 'dark_wood', { group: 'Wood' }),
  T('floor-rustic', 'Rustic pine', ['floor'], 'WoodFloor043', { group: 'Wood' }),
  T('floor-herringbone', 'Herringbone parquet', ['floor'], 'herringbone_parquet', { group: 'Wood' }),
  T('floor-diagonal-parquet', 'Diagonal parquet', ['floor'], 'diagonal_parquet', { group: 'Wood' }),
  T('floor-weathered', 'Weathered boards', ['floor', 'facade'], 'weathered_brown_planks', { group: 'Wood' }),
  // ── Floors: stone, tile, concrete
  T('floor-concrete', 'Polished concrete', ['floor', 'facade', 'wall'], 'Concrete034', { group: 'Concrete' }),
  T('floor-concrete-warm', 'Burnished concrete', ['floor'], 'smooth_concrete_floor', { group: 'Concrete' }),
  T('floor-tile-white', 'White square tile', ['floor', 'wall'], 'Tiles107', { group: 'Tile' }),
  T('floor-tile-beige', 'Beige tile', ['floor', 'wall'], 'interior_tiles', { group: 'Tile' }),
  T('floor-tile-large', 'Large grey tile', ['floor', 'terrain'], 'large_floor_tiles_02', { group: 'Tile' }),
  T('floor-tile-slate', 'Stone tile', ['floor', 'terrain'], 'large_grey_tiles', { group: 'Tile' }),
  T('floor-slate', 'Slate', ['floor'], 'slate_floor', { group: 'Stone' }),
  T('floor-terrazzo', 'White terrazzo', ['floor', 'furniture'], 'Terrazzo005', { group: 'Stone' }),
  T('floor-terrazzo-warm', 'Warm terrazzo', ['floor'], 'terrazzo_tiles', { group: 'Stone' }),
  T('floor-marble', 'Carrara marble', ['floor', 'wall', 'furniture'], 'Marble012', { group: 'Stone' }),
  T('floor-marble-black', 'Nero marble', ['floor', 'wall', 'furniture'], 'Marble016', { group: 'Stone' }),
  T('floor-travertine', 'Travertine', ['floor', 'wall', 'facade'], 'Travertine009', { group: 'Stone' }),
  T('floor-checker', 'Checkerboard marble', ['floor'], 'Tiles074', { group: 'Tile' }),
  T('floor-encaustic', 'Encaustic tile', ['floor', 'wall'], 'Tiles131', { group: 'Tile' }),
  T('floor-terracotta', 'Terracotta tile', ['floor', 'terrain'], 'terracotta_floor_tiles', { group: 'Tile' }),
  T('floor-checker-grey', 'Grey checker tile', ['floor'], 'floor_tiles_06', { group: 'Tile' }),
  // ── Floors: soft
  T('floor-carpet', 'Grey carpet', ['floor'], 'Carpet016', { tint: '#a3a09a', group: 'Carpet' }),
  T('floor-carpet-wool', 'Wool carpet', ['floor'], 'Carpet016', { group: 'Carpet' }),
  T('floor-carpet-navy', 'Navy carpet', ['floor'], 'Carpet016', { tint: '#4b5571', group: 'Carpet' }),
  T('floor-carpet-herringbone', 'Herringbone carpet', ['floor'], 'poly_wool_herringbone', {
    scale: 2.5,
    group: 'Carpet',
  }),

  // ── Interior walls: paint over a real plaster scan, tinted
  T('paint-white', 'Warm white', ['wall'], 'Plaster001', { tint: '#f2f0eb', group: 'Paint' }),
  T('paint-linen', 'Linen', ['wall'], 'Plaster001', { tint: '#e8e0d2', group: 'Paint' }),
  T('paint-greige', 'Greige', ['wall'], 'Plaster001', { tint: '#cfc6b8', group: 'Paint' }),
  T('paint-sage', 'Sage', ['wall'], 'Plaster001', { tint: '#b8c2ad', group: 'Paint' }),
  T('paint-olive', 'Olive', ['wall'], 'Plaster001', { tint: '#8c8f6b', group: 'Paint' }),
  T('paint-clay', 'Clay', ['wall'], 'Plaster001', { tint: '#d3a98d', group: 'Paint' }),
  T('paint-terracotta', 'Terracotta', ['wall'], 'Plaster001', { tint: '#b86f50', group: 'Paint' }),
  T('paint-blush', 'Blush', ['wall'], 'Plaster001', { tint: '#e6c4bb', group: 'Paint' }),
  T('paint-sky', 'Pale sky', ['wall'], 'Plaster001', { tint: '#c3d3de', group: 'Paint' }),
  T('paint-navy', 'Navy', ['wall'], 'Plaster001', { tint: '#3c4a66', group: 'Paint' }),
  T('paint-charcoal', 'Charcoal', ['wall'], 'Plaster001', { tint: '#3c3c40', group: 'Paint' }),
  T('wall-limewash', 'Limewash', ['wall', 'facade'], 'painted_plaster_wall', {
    tint: '#e9e1d4',
    group: 'Plaster',
  }),
  T('wall-plaster-rough', 'Rough plaster', ['wall', 'facade'], 'white_rough_plaster', { group: 'Plaster' }),
  T('wall-concrete', 'Raw concrete', ['wall', 'facade'], 'concrete_wall_003', { group: 'Concrete' }),
  T('wall-wood-slats', 'Wood panelling', ['wall'], 'planks_brown_10', { group: 'Wood' }),

  // ── Facades
  T('render-white', 'White render', ['facade', 'wall'], 'white_stucco', { group: 'Render' }),
  T('render-sand', 'Sand render', ['facade'], 'beige_wall_001', { group: 'Render' }),
  T('brick-red', 'Red brick', ['facade', 'wall'], 'red_brick', { group: 'Brick' }),
  T('brick-white', 'Whitewashed brick', ['facade', 'wall'], 'whitewashed_brick', { group: 'Brick' }),
  T('brick-dark', 'Dark brick', ['facade', 'wall'], 'brick_wall_001', { group: 'Brick' }),
  T('timber-cladding', 'Larch cladding', ['facade', 'floor'], 'wood_planks', { group: 'Timber' }),
  T('timber-dark', 'Black timber', ['facade'], 'black_painted_planks', { group: 'Timber' }),
  T('stone', 'Sandstone blocks', ['facade', 'floor', 'terrain'], 'sandstone_blocks_05', { group: 'Stone' }),
  T('stone-rubble', 'Rubble stone', ['facade', 'terrain'], 'stone_wall', { group: 'Stone' }),
  T('stone-rustic', 'Rustic stone', ['facade'], 'rustic_stone_wall_02', { group: 'Stone' }),
  T('facade-tiles', 'Facade tiles', ['facade'], 'rectangular_facade_tiles', { group: 'Cladding' }),
  T('cladding-corrugated', 'Corrugated metal', ['facade', 'roof'], 'corrugated_iron', {
    metalness: 0.6,
    group: 'Cladding',
  }),
  M('metal-anthracite', 'Anthracite metal', ['facade', 'roof', 'fixture'], '#3a3d42', 0.45, 0.6, {
    group: 'Cladding',
  }),

  // ── Roofs
  T('roof-terracotta', 'Clay tile', ['roof'], 'clay_roof_tiles_02'),
  T('roof-slate', 'Slate', ['roof'], 'roof_slates_02'),
  T('roof-concrete-tile', 'Concrete tile', ['roof'], 'grey_roof_tiles'),
  T('roof-thatch', 'Thatch', ['roof'], 'thatch_roof_angled', { scale: 2 }),
  T('roof-zinc', 'Corrugated zinc', ['roof'], 'corrugated_iron', { metalness: 0.6 }),
  T('roof-green', 'Green roof', ['roof', 'terrain'], 'Grass001'),
  T('roof-gravel', 'Gravel ballast', ['roof', 'terrain'], 'gravel_stones'),

  // ── Terrain & hardscape
  T('grass', 'Lawn', ['terrain'], 'Grass004', { group: 'Planting' }),
  T('meadow', 'Meadow', ['terrain'], 'Grass001', { group: 'Planting' }),
  T('rough-grass', 'Rough grass', ['terrain'], 'Ground037', { group: 'Planting' }),
  T('forest-floor', 'Forest floor', ['terrain'], 'forest_leaves_02', { group: 'Planting' }),
  T('gravel', 'Gravel', ['terrain'], 'gravel_floor', { group: 'Loose' }),
  T('gravel-grey', 'Grey gravel', ['terrain'], 'gravel_stones', { group: 'Loose' }),
  T('sand', 'Sand', ['terrain'], 'coast_sand_01', { scale: 0.35, group: 'Loose' }),
  T('sand-white', 'White sand', ['terrain'], 'coast_sand_01', {
    scale: 0.35,
    tint: '#eadcc0',
    group: 'Loose',
  }),
  T('sand-desert', 'Desert sand', ['terrain'], 'coast_sand_01', {
    scale: 0.5,
    tint: '#d9a777',
    group: 'Loose',
  }),
  T('soil', 'Soil', ['terrain'], 'dirt', { group: 'Loose' }),
  T('dry-earth', 'Dry earth', ['terrain'], 'mud_cracked_dry_03', { group: 'Loose' }),
  T('snow', 'Snow', ['terrain'], 'snow_02', { group: 'Loose' }),
  T('paving', 'Paving slabs', ['terrain', 'floor'], 'large_floor_tiles_02', { group: 'Paving' }),
  T('pavers-hex', 'Hex pavers', ['terrain'], 'PavingStones130', { group: 'Paving' }),
  T('pavers-brick', 'Brick pavers', ['terrain'], 'herringbone_pavement', { group: 'Paving' }),
  T('cobblestone', 'Cobblestone', ['terrain'], 'cobblestone_floor_04', { group: 'Paving' }),
  T('crazy-paving', 'Crazy paving', ['terrain'], 'slab_tiles', { group: 'Paving' }),
  T('asphalt', 'Asphalt', ['terrain'], 'clean_asphalt', { group: 'Paving' }),
  T('rock', 'Rock face', ['terrain', 'facade'], 'rock_face_03', { group: 'Rock' }),
  T('rocky-ground', 'Rocky ground', ['terrain'], 'rocks_ground_02', { group: 'Rock' }),
  T('mossy-rock', 'Mossy rock', ['terrain'], 'mossy_rock', { group: 'Rock' }),
  M('water', 'Pool water', ['terrain', 'fixture'], '#3c9ec6', 0.04, 0.05, {
    opacity: 0.82,
    maps: { normal: '/textures/water/normal.jpg' },
    uvScale: [3, 3],
    normalScale: 0.35,
  }),
  M('sea', 'Sea', ['terrain'], '#1f5f7a', 0.06, 0.1, {
    maps: { normal: '/textures/water/normal.jpg' },
    uvScale: [14, 14],
    normalScale: 0.5,
  }),
  M('lagoon', 'Lagoon', ['terrain'], '#2aa3b3', 0.05, 0.1, {
    opacity: 0.9,
    maps: { normal: '/textures/water/normal.jpg' },
    uvScale: [10, 10],
    normalScale: 0.4,
  }),
  M('lake', 'Lake', ['terrain'], '#2d5560', 0.05, 0.1, {
    maps: { normal: '/textures/water/normal.jpg' },
    uvScale: [10, 10],
    normalScale: 0.3,
  }),

  // ── Furniture: wood
  T('wood-oak', 'Oak', ['furniture'], 'oak_veneer_01', { group: 'Wood' }),
  T('wood-white-oak', 'White oak', ['furniture'], 'white_oak_veneer', { scale: 2, group: 'Wood' }),
  T('wood-walnut', 'Walnut', ['furniture'], 'walnut_veneer', { group: 'Wood' }),
  T('wood-teak', 'Teak', ['furniture'], 'teak_veneer', { group: 'Wood' }),
  T('wood-black', 'Smoked oak', ['furniture'], 'black_oak_veneer', { group: 'Wood' }),
  T('plywood', 'Birch plywood', ['furniture', 'wall'], 'plywood', { scale: 2, group: 'Wood' }),
  // ── Furniture: textiles & leather
  T('fabric-linen', 'Natural linen', ['furniture'], 'rough_linen', {
    tint: '#ddd6c9',
    scale: 1.5,
    group: 'Textile',
  }),
  T('fabric-charcoal', 'Charcoal weave', ['furniture'], 'Fabric030', { tint: '#4b4b50', group: 'Textile' }),
  T('fabric-sage', 'Sage linen', ['furniture'], 'rough_linen', {
    tint: '#9caa90',
    scale: 1.5,
    group: 'Textile',
  }),
  T('fabric-rust', 'Rust linen', ['furniture'], 'rough_linen', {
    tint: '#b4673f',
    scale: 1.5,
    group: 'Textile',
  }),
  T('fabric-ink', 'Ink weave', ['furniture'], 'Fabric030', { tint: '#38415a', group: 'Textile' }),
  T('fabric-mustard', 'Mustard weave', ['furniture'], 'Fabric030', { tint: '#c99a3c', group: 'Textile' }),
  T('fabric-boucle', 'Teddy bouclé', ['furniture'], 'curly_teddy_natural', { scale: 1.5, group: 'Textile' }),
  T('fabric-tweed', 'Tweed', ['furniture'], 'wool_boucle', { scale: 1.5, group: 'Textile' }),
  T('fabric-velvet', 'Ruby velvet', ['furniture'], 'velour_velvet', { scale: 1.5, group: 'Textile' }),
  T('fabric-denim', 'Denim', ['furniture'], 'denim_fabric', { scale: 2, group: 'Textile' }),
  T('leather-brown', 'Tan leather', ['furniture'], 'brown_leather', { group: 'Leather' }),
  T('leather-oxblood', 'Oxblood leather', ['furniture'], 'Leather037', { group: 'Leather' }),
  T('leather-white', 'White leather', ['furniture'], 'leather_white', { group: 'Leather' }),
  T('mattress', 'Bedding', ['furniture'], 'cotton_jersey', { tint: '#f4f1ea', scale: 1.5, group: 'Textile' }),
  // ── Fixtures & finishes (smooth: flat PBR reads best)
  M('lacquer-white', 'White lacquer', ['furniture', 'fixture'], '#f3f1ed', 0.35),
  M('lacquer-black', 'Black lacquer', ['furniture', 'fixture'], '#242427', 0.35),
  M('lacquer-sage', 'Sage lacquer', ['furniture', 'fixture'], '#97a38c', 0.4),
  M('lacquer-navy', 'Navy lacquer', ['furniture', 'fixture'], '#2f3a52', 0.4),
  M('metal-steel', 'Brushed steel', ['fixture', 'furniture'], '#b9bdc3', 0.35, 0.9),
  M('metal-black', 'Black metal', ['fixture', 'furniture'], '#2b2b2e', 0.5, 0.6),
  M('brass', 'Brass', ['fixture', 'furniture'], '#c9a45a', 0.3, 0.95),
  M('copper', 'Copper', ['fixture', 'furniture'], '#b8734b', 0.3, 0.95),
  M('chrome', 'Chrome', ['fixture'], '#e6e8ea', 0.08, 1),
  M('ceramic', 'White ceramic', ['fixture'], '#f7f6f3', 0.12),
  M('glass', 'Glass', ['fixture'], '#d4e6ec', 0.02, 0.1, { opacity: 0.22 }),
  M('glass-smoked', 'Smoked glass', ['fixture', 'furniture'], '#5b6266', 0.04, 0.1, { opacity: 0.45 }),
  M('mirror', 'Mirror', ['fixture'], '#e8eef0', 0.02, 1),
  M('foliage', 'Foliage', ['furniture', 'terrain'], '#5f8a4f', 0.85),
  M('foliage-dark', 'Dark foliage', ['furniture', 'terrain'], '#3f6a3b', 0.85),
  M('foliage-light', 'Light foliage', ['furniture', 'terrain'], '#86a55a', 0.85),
  M('blossom', 'Blossom', ['furniture', 'terrain'], '#e8a5b8', 0.8),
  T('bark', 'Bark', ['furniture', 'terrain'], 'bark_brown_02', { group: 'Wood' }),
  T('bark-palm', 'Palm bark', ['furniture', 'terrain'], 'palm_bark'),
  M('terracotta-pot', 'Terracotta', ['furniture'], '#b8704f', 0.85),
  M('lamp-glow', 'Lamp shade', ['fixture'], '#fff4dc', 0.6, 0, {
    emissive: '#ffd9a0',
    emissiveIntensity: 0.6,
  }),
  M('car-paint', 'Car paint', ['fixture'], '#8a9aa8', 0.25, 0.6),
  M('rubber', 'Rubber', ['fixture'], '#1f1f21', 0.9),
  M('fabric-white', 'White canvas', ['furniture'], '#f4f2ed', 0.95),
];

const byId = new Map(MATERIALS.map((m) => [m.id, m]));

/** Old ids from earlier versions that were merged into others. */
const ALIASES: Record<string, string> = {};

export const FALLBACK_MATERIAL: MaterialDef = M('fallback', 'Default', ['wall'], '#cccccc');

export function getMaterial(id: string | undefined): MaterialDef {
  if (!id) return FALLBACK_MATERIAL;
  return byId.get(id) ?? byId.get(ALIASES[id] ?? '') ?? FALLBACK_MATERIAL;
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
