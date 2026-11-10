import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { PartGeom } from '@/registry/types';

/** Geometry cache for element parts. Identical primitives share one BufferGeometry. */
const cache = new Map<string, THREE.BufferGeometry>();
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function partGeometry(g: PartGeom): THREE.BufferGeometry {
  let key: string;
  switch (g.kind) {
    case 'box':
      key = `b:${g.size.map(r3).join(',')}:${r3(g.radius ?? 0)}`;
      break;
    case 'cylinder':
      key = `c:${r3(g.radiusTop)},${r3(g.radiusBottom)},${r3(g.height)},${g.segments ?? 24}`;
      break;
    case 'sphere':
      key = `s:${r3(g.radius)}:${(g.scale ?? [1, 1, 1]).map(r3).join(',')}`;
      break;
    case 'torus':
      key = `t:${r3(g.radius)},${r3(g.tube)},${r3(g.arc ?? Math.PI * 2)}`;
      break;
  }
  let geo = cache.get(key);
  if (geo) return geo;
  switch (g.kind) {
    case 'box': {
      const [w, h, d] = g.size.map((v) => Math.max(v, 0.001)) as [number, number, number];
      const r = Math.min(g.radius ?? 0, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
      geo = r > 0.002 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
      break;
    }
    case 'cylinder':
      geo = new THREE.CylinderGeometry(
        Math.max(g.radiusTop, 0),
        Math.max(g.radiusBottom, 0.001),
        Math.max(g.height, 0.001),
        g.segments ?? 24,
      );
      break;
    case 'sphere': {
      geo = new THREE.SphereGeometry(g.radius, 20, 14);
      if (g.scale) geo.scale(...g.scale);
      break;
    }
    case 'torus':
      geo = new THREE.TorusGeometry(g.radius, g.tube, 10, 32, g.arc ?? Math.PI * 2);
      break;
  }
  metricUVs(geo);
  cache.set(key, geo);
  return geo;
}

/**
 * Replace a primitive's 0..1 UVs with box-projected UVs in meters, so a textured material tiles
 * at the same real-world scale on every face (and on every size of the same element).
 */
export function metricUVs(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute('position');
  const nrm = geo.getAttribute('normal');
  if (!pos || !nrm) return;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ax = Math.abs(nrm.getX(i));
    const ay = Math.abs(nrm.getY(i));
    const az = Math.abs(nrm.getZ(i));
    let u: number;
    let v: number;
    if (ay >= ax && ay >= az) {
      u = x;
      v = z;
    } else if (ax >= az) {
      u = nrm.getX(i) > 0 ? -z : z;
      v = y;
    } else {
      u = nrm.getZ(i) > 0 ? x : -x;
      v = y;
    }
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
