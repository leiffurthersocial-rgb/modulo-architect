import type { Roof } from '../model/schema';

export type V3 = [number, number, number];

export interface RoofFace {
  /** Planar polygon in world space (x, y up, z = plan y). */
  verts: V3[];
  kind: 'top' | 'bottom' | 'edge' | 'gable';
}

/**
 * Parametric roof geometry on a rectangle. Returns closed slabs for the roof planes plus vertical
 * gable infill triangles that sit on the walls. `base` is the wall-top elevation.
 */
export function roofFaces(roof: Roof, base: number, wallThickness = 0.2): RoofFace[] {
  const tan = Math.tan((Math.min(roof.pitch, 75) * Math.PI) / 180);
  const o = roof.overhang;
  const t = roof.thickness;
  let W = roof.width;
  let D = roof.depth;
  // Local frame: ridge along local x. Swap if the ridge should run along the other axis.
  const ridgeAlongX = roof.ridge === 'x' ? true : roof.ridge === 'y' ? false : W >= D;
  if (!ridgeAlongX) [W, D] = [D, W];
  const extraRot = ridgeAlongX ? 0 : Math.PI / 2;

  const faces: RoofFace[] = [];
  const toWorld = (x: number, y: number, z: number): V3 => {
    const a = roof.rotation + extraRot;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [roof.x + x * c - z * s, y, roof.y + x * s + z * c];
  };
  const slabFrom = (top: [number, number, number][]) => {
    // A planar top polygon (local), thickened downwards by t.
    const T = top.map(([x, y, z]) => toWorld(x, y, z));
    const B = top.map(([x, y, z]) => toWorld(x, y - t, z));
    faces.push({ verts: T, kind: 'top' });
    faces.push({ verts: [...B].reverse(), kind: 'bottom' });
    for (let i = 0; i < T.length; i++) {
      const j = (i + 1) % T.length;
      faces.push({ verts: [T[j]!, T[i]!, B[i]!, B[j]!], kind: 'edge' });
    }
  };

  const hw = W / 2;
  const hd = D / 2;
  const eave = base + t - o * tan;
  const top0 = base + t;

  switch (roof.type) {
    case 'flat': {
      slabFrom([
        [-hw - o, top0, -hd - o],
        [-hw - o, top0, hd + o],
        [hw + o, top0, hd + o],
        [hw + o, top0, -hd - o],
      ]);
      break;
    }
    case 'shed': {
      // Low side at +z, high side at -z.
      const h = (z: number) => top0 + (hd - z) * tan;
      slabFrom([
        [-hw - o, h(-hd - o), -hd - o],
        [-hw - o, h(hd + o), hd + o],
        [hw + o, h(hd + o), hd + o],
        [hw + o, h(-hd - o), -hd - o],
      ]);
      // Side infill (trapezoids) on the two walls along z.
      for (const sx of [-1, 1]) {
        const x = sx * (hw - wallThickness / 2);
        const tri: V3[] = [toWorld(x, base, -hd), toWorld(x, base, hd), toWorld(x, top0 - t, hd), toWorld(x, h(-hd) - t, -hd)];
        faces.push({ verts: sx > 0 ? tri : [...tri].reverse(), kind: 'gable' });
      }
      break;
    }
    case 'gable': {
      const ridge = top0 + hd * tan;
      slabFrom([
        [-hw - o, ridge, 0],
        [-hw - o, eave, hd + o],
        [hw + o, eave, hd + o],
        [hw + o, ridge, 0],
      ]);
      slabFrom([
        [-hw - o, eave, -hd - o],
        [-hw - o, ridge, 0],
        [hw + o, ridge, 0],
        [hw + o, eave, -hd - o],
      ]);
      for (const sx of [-1, 1]) {
        const x = sx * (hw - wallThickness / 2);
        const tri: V3[] = [toWorld(x, base, -hd), toWorld(x, base, hd), toWorld(x, ridge - t, 0)];
        faces.push({ verts: sx > 0 ? tri : [...tri].reverse(), kind: 'gable' });
      }
      break;
    }
    case 'hip': {
      const ridge = top0 + hd * tan;
      const rx = Math.max(0, hw - hd);
      const X = hw + o;
      const Z = hd + o;
      // Front & back trapezoids, two hip triangles.
      slabFrom([
        [-rx, ridge, 0],
        [-X, eave, Z],
        [X, eave, Z],
        [rx, ridge, 0],
      ]);
      slabFrom([
        [-X, eave, -Z],
        [-rx, ridge, 0],
        [rx, ridge, 0],
        [X, eave, -Z],
      ]);
      slabFrom([
        [-X, eave, -Z],
        [-X, eave, Z],
        [-rx, ridge, 0],
      ]);
      slabFrom([
        [X, eave, Z],
        [X, eave, -Z],
        [rx, ridge, 0],
      ]);
      break;
    }
  }
  return faces;
}

/** Height of the roof's top surface above `base` at the ridge (for UI readouts). */
export function ridgeHeight(roof: Roof): number {
  if (roof.type === 'flat') return roof.thickness;
  const span = Math.min(roof.width, roof.depth);
  const tan = Math.tan((roof.pitch * Math.PI) / 180);
  if (roof.type === 'shed') return roof.thickness + span * tan;
  return roof.thickness + (span / 2) * tan;
}
