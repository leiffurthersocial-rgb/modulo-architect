#!/usr/bin/env python3
"""
Download CC0 sky HDRIs from Poly Haven for image-based lighting and backgrounds.

For each sky: public/skies/<id>/env.hdr (1k, lighting + reflections) and bg.jpg (2k tonemapped
background). The sun's position in the panorama is detected so the app can rotate the sky to
match the simulated sun. Writes registry/skies.generated.json.
"""
import io
import json
import os
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'skies')
MANIFEST = os.path.join(ROOT, 'registry', 'skies.generated.json')

SKIES = {
    'clear': 'kloofendal_43d_clear_puresky',
    'partly-cloudy': 'kloofendal_48d_partly_cloudy_puresky',
    'overcast': 'overcast_soil_puresky',
    'golden-hour': 'kloppenheim_06_puresky',
    'sunset': 'belfast_sunset_puresky',
    'night': 'rogland_clear_night',
}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'modulo-architect-asset-fetch/1.0'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def main():
    manifest = {}
    for key, asset in SKIES.items():
        files = json.loads(get(f'https://api.polyhaven.com/files/{asset}'))
        dest = os.path.join(OUT, key)
        os.makedirs(dest, exist_ok=True)
        with open(os.path.join(dest, 'env.hdr'), 'wb') as f:
            f.write(get(files['hdri']['1k']['hdr']['url']))
        img = Image.open(io.BytesIO(get(files['tonemapped']['url']))).convert('RGB')
        bg = img.resize((2048, 1024), Image.LANCZOS)
        bg.save(os.path.join(dest, 'bg.jpg'), quality=84, optimize=True, progressive=True)
        # Brightest blob in the upper hemisphere = the sun (u: 0..1 around, v: 0 = zenith).
        small = img.resize((512, 256), Image.BOX).convert('L')
        best, bu, bv = -1, 0.5, 0.25
        for y in range(0, 128):
            for x in range(512):
                v = small.getpixel((x, y))
                if v > best:
                    best, bu, bv = v, x / 512, y / 256
        manifest[key] = {'asset': asset, 'sunU': round(bu, 4), 'sunV': round(bv, 4), 'source': f'https://polyhaven.com/a/{asset}'}
        print(key, asset, manifest[key])
    with open(MANIFEST, 'w') as f:
        json.dump(manifest, f, indent=1)


if __name__ == '__main__':
    main()
