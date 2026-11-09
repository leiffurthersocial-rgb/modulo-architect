import type { Part } from './types';

/** Terse part builders so element definitions stay readable. Coordinates: centre of the part. */
export const box = (
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  material: string,
  radius?: number,
  rotation?: [number, number, number],
): Part => ({ geom: { kind: 'box', size: [w, h, d], radius }, position: [x, y, z], material, rotation });

/** Box resting on y0 (bottom face) rather than centred. */
export const slab = (w: number, h: number, d: number, x: number, y0: number, z: number, material: string, radius?: number) =>
  box(w, h, d, x, y0 + h / 2, z, material, radius);

export const cyl = (
  r: number,
  h: number,
  x: number,
  y0: number,
  z: number,
  material: string,
  rTop = r,
  segments = 24,
  rotation?: [number, number, number],
): Part => ({
  geom: { kind: 'cylinder', radiusTop: rTop, radiusBottom: r, height: h, segments },
  position: [x, y0 + h / 2, z],
  material,
  rotation,
});

export const sphere = (r: number, x: number, y: number, z: number, material: string, scale?: [number, number, number]): Part => ({
  geom: { kind: 'sphere', radius: r, scale },
  position: [x, y, z],
  material,
});

/** Four legs inset from the corners of a w×d footprint. */
export function legs(w: number, d: number, h: number, inset: number, material: string, t = 0.04, round = false): Part[] {
  const xs = [-w / 2 + inset, w / 2 - inset];
  const zs = [-d / 2 + inset, d / 2 - inset];
  const out: Part[] = [];
  for (const x of xs)
    for (const z of zs) out.push(round ? cyl(t / 2, h, x, 0, z, material, t / 2, 12) : slab(t, h, t, x, 0, z, material));
  return out;
}
