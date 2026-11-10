#!/usr/bin/env node
/**
 * Download CC0 3D models from Poly Haven and pack them as web-ready GLBs.
 *
 *   node scripts/fetch-models.mjs            # every model in MODELS
 *   (behind an HTTPS proxy, prefix with NODE_USE_ENV_PROXY=1)
 *   node scripts/fetch-models.mjs sofa_02    # just one
 *
 * Each model is welded, deduplicated, simplified to a polygon budget, its textures resized and
 * converted to WebP, and meshopt-compressed. Writes public/models/<id>.glb, a thumbnail, and
 * registry/models/models.generated.json (catalog metadata incl. real-world bounding box).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import {
  dedup,
  prune,
  weld,
  simplify,
  textureCompress,
  getBounds,
  meshopt,
  flatten,
  join,
} from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'public', 'models');
const MANIFEST = path.join(ROOT, 'registry', 'models', 'models.generated.json');
const UA = { 'User-Agent': 'modulo-architect-asset-fetch/1.0' };

/**
 * Curated catalog: Poly Haven id → how it appears in Modulo.
 * kind/category/snap mirror ElementDef; `tris` is the triangle budget; `tex` the max texture size.
 */
const MODELS = {
  // Living
  sofa_02: { name: 'Chesterfield sofa', kind: 'furniture', category: 'Living', tags: ['couch', 'leather'] },
  sofa_03: { name: 'Mid-century sofa', kind: 'furniture', category: 'Living', tags: ['couch'] },
  Sofa_01: { name: 'Classic sofa', kind: 'furniture', category: 'Living', tags: ['couch'] },
  modern_arm_chair_01: {
    name: 'Modern armchair',
    kind: 'furniture',
    category: 'Living',
    tags: ['chair', 'lounge'],
  },
  ArmChair_01: { name: 'Wingback armchair', kind: 'furniture', category: 'Living', tags: ['chair'] },
  mid_century_lounge_chair: {
    name: 'Lounge chair',
    kind: 'furniture',
    category: 'Living',
    tags: ['eames', 'chair'],
  },
  Rockingchair_01: { name: 'Rocking chair', kind: 'furniture', category: 'Living', tags: ['chair'] },
  Ottoman_01: { name: 'Ottoman', kind: 'furniture', category: 'Living', tags: ['footstool', 'pouf'] },
  coffee_table_round_01: {
    name: 'Round coffee table',
    kind: 'furniture',
    category: 'Living',
    tags: ['table'],
  },
  modern_coffee_table_01: {
    name: 'Modern coffee table',
    kind: 'furniture',
    category: 'Living',
    tags: ['table'],
  },
  side_table_01: { name: 'Wooden side table', kind: 'furniture', category: 'Living', tags: ['end table'] },
  Television_01: { name: 'Retro television', kind: 'furniture', category: 'Living', tags: ['tv'] },
  vintage_grandfather_clock_01: {
    name: 'Grandfather clock',
    kind: 'furniture',
    category: 'Living',
    tags: ['clock'],
  },
  // Dining
  round_wooden_table_01: {
    name: 'Round dining table',
    kind: 'furniture',
    category: 'Dining',
    tags: ['table'],
  },
  wooden_table_02: {
    name: 'Farmhouse table',
    kind: 'furniture',
    category: 'Dining',
    tags: ['table', 'rustic'],
  },
  gallinera_table: { name: 'Gallinera table', kind: 'furniture', category: 'Dining', tags: ['table'] },
  dining_chair_02: { name: 'Bistro chair', kind: 'furniture', category: 'Dining', tags: ['chair'] },
  GreenChair_01: {
    name: 'Green lounge chair',
    kind: 'furniture',
    category: 'Living',
    tags: ['chair', 'armchair'],
  },
  plastic_monobloc_chair_01: {
    name: 'Garden chair',
    kind: 'outdoor',
    category: 'Furniture',
    tags: ['chair', 'plastic'],
  },
  Shelf_01: { name: 'Wall shelf unit', kind: 'furniture', category: 'Living', tags: ['bookcase'] },
  painted_wooden_chair_01: { name: 'Painted chair', kind: 'furniture', category: 'Dining', tags: ['chair'] },
  // Bedroom & storage
  ClassicNightstand_01: {
    name: 'Classic nightstand',
    kind: 'furniture',
    category: 'Bedroom',
    tags: ['bedside'],
  },
  vintage_wooden_drawer_01: {
    name: 'Vintage drawers',
    kind: 'furniture',
    category: 'Bedroom',
    tags: ['dresser'],
  },
  modern_wooden_cabinet: {
    name: 'Modern cabinet',
    kind: 'furniture',
    category: 'Living',
    tags: ['sideboard', 'storage'],
  },
  vintage_cabinet_01: {
    name: 'Vintage cabinet',
    kind: 'furniture',
    category: 'Living',
    tags: ['cupboard', 'storage'],
  },
  wooden_display_shelves_01: {
    name: 'Display shelves',
    kind: 'furniture',
    category: 'Living',
    tags: ['bookcase', 'shelving'],
  },
  drawer_cabinet: { name: 'Drawer cabinet', kind: 'furniture', category: 'Office', tags: ['storage'] },
  ClassicConsole_01: { name: 'Console table', kind: 'furniture', category: 'Decor', tags: ['hallway'] },
  // Lighting
  Chandelier_01: {
    name: 'Crystal chandelier',
    kind: 'furniture',
    category: 'Lighting',
    snap: 'ceiling',
    light: true,
  },
  Chandelier_02: {
    name: 'Brass chandelier',
    kind: 'furniture',
    category: 'Lighting',
    snap: 'ceiling',
    light: true,
  },
  modern_ceiling_lamp_01: {
    name: 'Modern ceiling lamp',
    kind: 'furniture',
    category: 'Lighting',
    snap: 'ceiling',
    light: true,
  },
  desk_lamp_arm_01: {
    name: 'Architect lamp',
    kind: 'furniture',
    category: 'Lighting',
    light: true,
    solid: false,
  },
  Lantern_01: { name: 'Lantern', kind: 'furniture', category: 'Lighting', light: true, solid: false },
  // Decor & plants
  potted_plant_01: {
    name: 'Potted palm',
    kind: 'furniture',
    category: 'Decor',
    tags: ['plant'],
    tris: 25000,
  },
  potted_plant_02: {
    name: 'Potted fern',
    kind: 'furniture',
    category: 'Decor',
    tags: ['plant'],
    tris: 25000,
  },
  potted_plant_04: {
    name: 'Succulent pot',
    kind: 'furniture',
    category: 'Decor',
    tags: ['plant'],
    tris: 20000,
    solid: false,
  },
  pachira_aquatica_01: {
    name: 'Money tree',
    kind: 'furniture',
    category: 'Decor',
    tags: ['plant'],
    tris: 25000,
    keep: /_d$/,
  },
  calathea_orbifolia_01: {
    name: 'Calathea',
    kind: 'furniture',
    category: 'Decor',
    tags: ['plant'],
    tris: 20000,
    keep: /_a$/,
  },
  anthurium_botany_01: {
    name: 'Anthurium',
    kind: 'furniture',
    category: 'Decor',
    tags: ['plant', 'flowers'],
    tris: 20000,
    solid: false,
    keep: /_a$/,
  },
  ceramic_vase_01: { name: 'Ceramic vase', kind: 'furniture', category: 'Decor', solid: false },
  antique_ceramic_vase_01: { name: 'Antique vase', kind: 'furniture', category: 'Decor', solid: false },
  brass_vase_03: { name: 'Brass vase', kind: 'furniture', category: 'Decor', solid: false },
  throw_pillows_01: {
    name: 'Throw pillows',
    kind: 'furniture',
    category: 'Decor',
    tags: ['cushions'],
    solid: false,
  },
  chess_set: { name: 'Chess set', kind: 'furniture', category: 'Decor', solid: false },
  marble_bust_01: {
    name: 'Marble bust',
    kind: 'furniture',
    category: 'Decor',
    tags: ['sculpture', 'statue'],
    solid: false,
  },
  wicker_basket_01: { name: 'Wicker basket', kind: 'furniture', category: 'Decor', solid: false },
  ornate_mirror_01: {
    name: 'Ornate mirror',
    kind: 'furniture',
    category: 'Decor',
    snap: 'wall',
    elevation: 0.9,
    solid: false,
  },
  fancy_picture_frame_01: {
    name: 'Gilded frame',
    kind: 'furniture',
    category: 'Decor',
    snap: 'wall',
    elevation: 1.3,
    solid: false,
  },
  // Outdoor
  outdoor_table_chair_set_01: {
    name: 'Patio dining set',
    kind: 'outdoor',
    category: 'Furniture',
    tags: ['table', 'chairs'],
  },
  wooden_picnic_table: { name: 'Picnic table', kind: 'outdoor', category: 'Furniture', tags: ['bench'] },
  stone_fire_pit: { name: 'Stone fire pit', kind: 'outdoor', category: 'Furniture' },
  street_lamp_01: { name: 'Street lamp', kind: 'outdoor', category: 'Lighting', light: true },
  garden_gnome: { name: 'Garden gnome', kind: 'outdoor', category: 'Furniture', solid: false },
  wine_barrel_01: { name: 'Barrel planter', kind: 'outdoor', category: 'Planting' },
  exterior_aircon_unit: {
    name: 'AC unit',
    kind: 'outdoor',
    category: 'Structures',
    tags: ['air conditioning', 'heat pump'],
  },
  tree_small_02: {
    name: 'Young tree',
    kind: 'outdoor',
    category: 'Planting',
    tags: ['tree'],
    tris: 30000,
    tex: 1024,
  },
  jacaranda_tree: {
    name: 'Jacaranda',
    kind: 'outdoor',
    category: 'Planting',
    tags: ['tree', 'flowering'],
    tris: 45000,
    tex: 1024,
  },
  island_tree_01: {
    name: 'Island tree',
    kind: 'outdoor',
    category: 'Planting',
    tags: ['tree'],
    tris: 40000,
    tex: 1024,
  },
  fir_tree_01: {
    name: 'Fir tree',
    kind: 'outdoor',
    category: 'Planting',
    tags: ['tree', 'conifer'],
    tris: 40000,
    tex: 1024,
    keep: /_a_LOD0$/,
  },
  pine_tree_01: {
    name: 'Pine tree',
    kind: 'outdoor',
    category: 'Planting',
    tags: ['tree', 'conifer'],
    tris: 40000,
    tex: 1024,
    keep: /_a_LOD0$/,
  },
  tree_stump_01: { name: 'Tree stump', kind: 'outdoor', category: 'Planting', tags: ['log'], tris: 12000 },
};

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (i === 2) throw e;
    }
  }
}

async function processModel(id, meta, io) {
  const files = JSON.parse((await get(`https://api.polyhaven.com/files/${id}`)).toString());
  const g = files.gltf['1k'].gltf;
  const tmp = path.join(ROOT, 'node_modules', '.cache', 'ph-models', id);
  await fs.mkdir(tmp, { recursive: true });
  const gltfPath = path.join(tmp, path.basename(g.url));
  await fs.writeFile(gltfPath, await get(g.url));
  await Promise.all(
    Object.entries(g.include).map(async ([rel, f]) => {
      const p = path.join(tmp, rel);
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, await get(f.url));
    }),
  );
  const doc = await io.read(gltfPath);
  // Some assets ship several variants side by side: keep just the chosen one.
  if (meta.keep) {
    for (const scene of doc.getRoot().listScenes())
      for (const child of scene.listChildren()) if (!meta.keep.test(child.getName())) child.dispose();
    await doc.transform(prune());
  }
  const before = countTris(doc);
  const budget = meta.tris ?? 20000;
  const ratio = Math.min(1, budget / Math.max(1, before));
  await doc.transform(
    dedup(),
    flatten(),
    join(),
    weld(),
    ...(ratio < 1
      ? [simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01, lockBorder: false })]
      : []),
    prune(),
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [meta.tex ?? 512, meta.tex ?? 512],
      quality: 80,
    }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
  const b = getBounds(doc.getRoot().listScenes()[0]);
  const size = { w: b.max[0] - b.min[0], h: b.max[1] - b.min[1], d: b.max[2] - b.min[2] };
  const center = { x: (b.max[0] + b.min[0]) / 2, y: b.min[1], z: (b.max[2] + b.min[2]) / 2 };
  await io.write(path.join(OUT, `${id}.glb`), doc);
  const thumb = await get(`https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?width=256&height=256`);
  await sharp(thumb)
    .resize(160, 160)
    .webp({ quality: 78 })
    .toFile(path.join(OUT, `${id}.webp`));
  const stat = await fs.stat(path.join(OUT, `${id}.glb`));
  console.log(
    `${id.padEnd(30)} ${before} → ${countTris(doc)} tris  ${(stat.size / 1024).toFixed(0)} KB  ${size.w.toFixed(2)}×${size.d.toFixed(2)}×${size.h.toFixed(2)} m`,
  );
  const r3 = (n) => Math.round(n * 1000) / 1000;
  return {
    ...Object.fromEntries(Object.entries(meta).filter(([k]) => k !== 'keep')),
    id: `m-${id.toLowerCase().replace(/_/g, '-')}`,
    asset: id,
    url: `/models/${id}.glb`,
    thumb: `/models/${id}.webp`,
    size: { w: r3(size.w), d: r3(size.d), h: r3(size.h) },
    origin: { x: r3(center.x), y: r3(center.y), z: r3(center.z) },
    source: `https://polyhaven.com/a/${id}`,
  };
}

function countTris(doc) {
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const p of mesh.listPrimitives()) {
      const idx = p.getIndices();
      n += (idx ? idx.getCount() : p.getAttribute('POSITION').getCount()) / 3;
    }
  return Math.round(n);
}

async function main() {
  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;
  const io = new NodeIO(fetch)
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MODELS);
  let manifest = {};
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  } catch {
    /* first run */
  }
  for (const id of wanted) {
    try {
      manifest[id] = await processModel(id, MODELS[id], io);
    } catch (e) {
      console.error(`${id}: ${e.message}`);
    }
  }
  await fs.writeFile(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1));
  void EXTMeshoptCompression;
}

main();
