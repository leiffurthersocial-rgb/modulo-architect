#!/usr/bin/env python3
"""
Download CC0 PBR texture scans from Poly Haven and ambientCG and optimise them for the web.

    python3 scripts/fetch-textures.py            # all textures in TEXTURES
    python3 scripts/fetch-textures.py oak ...    # only the given material ids

For every texture it writes public/textures/<asset>/{color,normal,arm,thumb}.jpg and records
the real-world size (Poly Haven "dimensions", mm) and average colour in
registry/materials/textures.generated.json. Neutral scans used as tint bases also get detail.jpg
(normalised greyscale) so a palette colour can be multiplied in. All assets are CC0:
https://polyhaven.com/license, https://docs.ambientcg.com/license/
"""
import io
import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'textures')
MANIFEST = os.path.join(ROOT, 'registry', 'materials', 'textures.generated.json')

# Poly Haven asset ids used by the material registry.
ASSETS = [
    # wood floors
    'wood_floor', 'laminate_floor_02', 'dark_wood', 'herringbone_parquet', 'diagonal_parquet', 'wood_floor_deck',
    'weathered_brown_planks',
    # tiles & stone floors
    'interior_tiles', 'large_floor_tiles_02', 'large_grey_tiles', 'terrazzo_tiles', 'marble_01', 'terracotta_floor_tiles',
    'floor_tiles_06', 'smooth_concrete_floor', 'slate_floor',
    # walls & facades
    'painted_plaster_wall', 'white_rough_plaster', 'concrete_wall_003', 'white_stucco', 'beige_wall_001', 'red_brick',
    'whitewashed_brick', 'brick_wall_001', 'wood_planks', 'black_painted_planks', 'sandstone_blocks_05', 'stone_wall',
    'rustic_stone_wall_02', 'rectangular_facade_tiles', 'corrugated_iron', 'planks_brown_10',
    # roofs
    'clay_roof_tiles_02', 'roof_slates_02', 'grey_roof_tiles', 'thatch_roof_angled',
    # terrain
    'leafy_grass', 'sparse_grass', 'forest_leaves_02', 'gravel_stones', 'gravel_floor', 'coast_sand_01', 'dirt',
    'slab_tiles', 'cobblestone_floor_04', 'herringbone_pavement', 'clean_asphalt', 'rock_face_03', 'rocks_ground_02',
    'mud_cracked_dry_03', 'snow_02', 'mossy_rock',
    # furniture woods
    'oak_veneer_01', 'walnut_veneer', 'teak_veneer', 'white_oak_veneer', 'black_oak_veneer', 'plywood',
    # textiles & leather
    'rough_linen', 'cotton_jersey', 'velour_velvet', 'wool_boucle', 'curly_teddy_natural', 'denim_fabric',
    'brown_leather', 'leather_white', 'poly_wool_herringbone',
    # bark
    'bark_brown_02', 'palm_bark',
]

# ambientCG asset id -> real-world size of one repeat in meters.
ACG = {
    'Grass004': 1.4, 'Grass001': 1.4, 'Ground037': 2.1, 'Concrete034': 1.1, 'Marble012': 2.0, 'Marble016': 2.0,
    'Terrazzo005': 1.0, 'Tiles107': 1.0, 'Tiles074': 2.1, 'Tiles131': 1.5, 'Travertine009': 1.2, 'Plaster001': 2.0,
    'Carpet016': 1.7, 'Fabric030': 0.5, 'Leather037': 0.5, 'WoodFloor051': 1.8, 'WoodFloor043': 1.3,
    'PavingStones130': 2.3,
}

# Scans used as neutral bases for tinted materials (paint, fabric, carpet).
NEUTRAL = {'Plaster001', 'Fabric030', 'Carpet016', 'rough_linen', 'cotton_jersey', 'poly_wool_herringbone',
           'painted_plaster_wall', 'white_rough_plaster', 'coast_sand_01'}

SIZES = {'color': 1024, 'normal': 512, 'arm': 512}
QUALITY = {'color': 80, 'normal': 88, 'arm': 82}
MAPS = {'color': 'Diffuse', 'normal': 'nor_gl', 'arm': 'arm'}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'modulo-architect-asset-fetch/1.0'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:
            if attempt == 2:
                raise


def save_maps(dest, color, normal, arm):
    """Write the web-optimised maps plus thumbnail (and detail map for neutral bases)."""
    avg = None
    for key, img in (('color', color), ('normal', normal), ('arm', arm)):
        if img is None:
            continue
        img = img.convert('RGB')
        size = SIZES[key]
        if img.width != size:
            img = img.resize((size, size), Image.LANCZOS)
        img.save(os.path.join(dest, f'{key}.jpg'), quality=QUALITY[key], optimize=True, progressive=True)
        if key == 'color':
            img.resize((96, 96), Image.LANCZOS).save(os.path.join(dest, 'thumb.jpg'), quality=78, optimize=True)
            avg = '#%02x%02x%02x' % img.resize((1, 1), Image.BOX).getpixel((0, 0))
            if os.path.basename(dest) in NEUTRAL:
                g = img.convert('L')
                mean = sum(i * n for i, n in enumerate(g.histogram())) / (g.width * g.height)
                k = 225 / max(mean, 1)
                g.point(lambda v: max(0, min(255, int(v * k)))).convert('RGB').save(
                    os.path.join(dest, 'detail.jpg'), quality=80, optimize=True, progressive=True)
    return avg


def process_acg(asset):
    import zipfile
    dest = os.path.join(OUT, asset)
    os.makedirs(dest, exist_ok=True)
    z = zipfile.ZipFile(io.BytesIO(get(f'https://ambientcg.com/get?file={asset}_1K-JPG.zip')))
    def find(suffix):
        for n in z.namelist():
            if n.endswith(f'_{suffix}.jpg'):
                return Image.open(io.BytesIO(z.read(n)))
        return None
    color, normal, rough, ao = find('Color'), find('NormalGL'), find('Roughness'), find('AmbientOcclusion')
    arm = None
    if rough is not None:
        r = rough.convert('L').resize((SIZES['arm'], SIZES['arm']))
        a = ao.convert('L').resize(r.size) if ao is not None else Image.new('L', r.size, 255)
        arm = Image.merge('RGB', (a, r, Image.new('L', r.size, 0)))
    avg = save_maps(dest, color, normal, arm)
    size = ACG[asset]
    return asset, {
        'name': asset,
        'size': [size, size],
        'avg': avg,
        'maps': sorted(k for k in list(MAPS) + ['detail'] if os.path.exists(os.path.join(dest, f'{k}.jpg'))),
        'source': f'https://ambientcg.com/view?id={asset}',
    }


def process(asset):
    if asset in ACG:
        return process_acg(asset)
    files = json.loads(get(f'https://api.polyhaven.com/files/{asset}'))
    info = json.loads(get(f'https://api.polyhaven.com/info/{asset}'))
    dest = os.path.join(OUT, asset)
    os.makedirs(dest, exist_ok=True)
    imgs = {}
    for key, ph in MAPS.items():
        entry = files.get(ph, {}).get('1k', {}).get('jpg')
        imgs[key] = Image.open(io.BytesIO(get(entry['url']))) if entry else None
    avg = save_maps(dest, imgs['color'], imgs['normal'], imgs['arm'])
    dims = info.get('dimensions') or [1000, 1000]
    return asset, {
        'name': info.get('name', asset),
        'size': [round(dims[0] / 1000, 3), round(dims[1] / 1000, 3)],
        'avg': avg,
        'maps': sorted(k for k in list(MAPS) + ['detail'] if os.path.exists(os.path.join(dest, f'{k}.jpg'))),
        'source': f'https://polyhaven.com/a/{asset}',
    }


def main():
    wanted = sys.argv[1:] or ASSETS + list(ACG)
    manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    with ThreadPoolExecutor(8) as pool:
        for asset, meta in pool.map(process, wanted):
            manifest[asset] = meta
            print(f'{asset:28s} {meta["size"]} {meta["avg"]} {meta["maps"]}')
    with open(MANIFEST, 'w') as f:
        json.dump(dict(sorted(manifest.items())), f, indent=1)
    total = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(OUT) for fn in fns)
    print(f'{len(manifest)} textures, {total / 1e6:.1f} MB in public/textures')


if __name__ == '__main__':
    main()
