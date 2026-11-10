import * as THREE from 'three';
import type { Vec2 } from '@/core/geometry/vec2';
import { signedArea } from '@/core/geometry/polygon';

/**
 * Accumulates non-indexed triangles grouped by material key, remembering which entity each
 * triangle belongs to so a raycast `faceIndex` resolves to an id.
 */
export class MeshBuilder {
  private groups = new Map<string, { pos: number[]; nrm: number[]; uv: number[]; ids: string[] }>();

  private group(key: string) {
    let g = this.groups.get(key);
    if (!g) {
      g = { pos: [], nrm: [], uv: [], ids: [] };
      this.groups.set(key, g);
    }
    return g;
  }

  tri(key: string, id: string, a: number[], b: number[], c: number[], n: number[], uvs: number[][]) {
    const g = this.group(key);
    g.pos.push(...a, ...b, ...c);
    g.nrm.push(...n, ...n, ...n);
    g.uv.push(...uvs[0]!, ...uvs[1]!, ...uvs[2]!);
    g.ids.push(id);
  }

  /** Planar polygon (convex or simple) in 3D, triangulated. */
  polygon(key: string, id: string, verts: number[][], uvOf: (v: number[]) => number[], normal?: number[]) {
    if (verts.length < 3) return;
    const n = normal ?? newell(verts);
    if (!n) return;
    // Project to the dominant plane for triangulation.
    const ax = Math.abs(n[0]!);
    const ay = Math.abs(n[1]!);
    const az = Math.abs(n[2]!);
    const proj = verts.map((v) =>
      ax >= ay && ax >= az
        ? new THREE.Vector2(v[1]!, v[2]!)
        : ay >= az
          ? new THREE.Vector2(v[0]!, v[2]!)
          : new THREE.Vector2(v[0]!, v[1]!),
    );
    let tris: number[][];
    if (verts.length === 3) tris = [[0, 1, 2]];
    else tris = THREE.ShapeUtils.triangulateShape(proj, []);
    for (const [i, j, k] of tris) {
      const a = verts[i!]!;
      const b = verts[j!]!;
      const c = verts[k!]!;
      // Keep winding consistent with the polygon normal.
      const tn = cross3(sub3(b, a), sub3(c, a));
      const flip = tn[0]! * n[0]! + tn[1]! * n[1]! + tn[2]! * n[2]! < 0;
      if (flip) this.tri(key, id, a, c, b, n, [uvOf(a), uvOf(c), uvOf(b)]);
      else this.tri(key, id, a, b, c, n, [uvOf(a), uvOf(b), uvOf(c)]);
    }
  }

  /**
   * Vertical prism from a plan polygon between heights y0..y1. `sideKey` picks a material per
   * side face from its outward plan normal.
   */
  prism(
    polygon: Vec2[],
    y0: number,
    y1: number,
    id: string,
    capKey: string,
    sideKey: (n: Vec2, mid: Vec2) => string,
  ) {
    if (polygon.length < 3 || y1 - y0 < 1e-5) return;
    const ccw = signedArea(polygon) > 0;
    const pts = ccw ? polygon : [...polygon].reverse();
    // Caps (plan y → world z).
    const top = pts.map((p) => [p.x, y1, p.y]);
    const bottom = [...pts].reverse().map((p) => [p.x, y0, p.y]);
    const capUV = (v: number[]) => [v[0]!, v[2]!];
    this.polygon(capKey, id, top, capUV, [0, 1, 0]);
    this.polygon(capKey, id, bottom, capUV, [0, -1, 0]);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      const ex = b.x - a.x;
      const ey = b.y - a.y;
      const L = Math.hypot(ex, ey);
      if (L < 1e-6) continue;
      // Outward normal for a CCW polygon in (x, y-down-is-z) space.
      const n = { x: ey / L, y: -ex / L };
      const key = sideKey(n, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const A0 = [a.x, y0, a.y];
      const B0 = [b.x, y0, b.y];
      const B1 = [b.x, y1, b.y];
      const A1 = [a.x, y1, a.y];
      const u0 = a.x * -n.y + a.y * n.x;
      const u1 = u0 + L;
      this.polygon(key, id, [A0, B0, B1, A1], (v) => [v === A0 || v === A1 ? u0 : u1, v[1]!], [n.x, 0, n.y]);
    }
  }

  /** Build a BufferGeometry with one group per material key, plus a triangle→id table. */
  build(): { geometry: THREE.BufferGeometry; keys: string[]; triIds: string[] } {
    const keys = [...this.groups.keys()];
    const pos: number[] = [];
    const nrm: number[] = [];
    const uv: number[] = [];
    const triIds: string[] = [];
    const geometry = new THREE.BufferGeometry();
    let start = 0;
    keys.forEach((k, i) => {
      const g = this.groups.get(k)!;
      pos.push(...g.pos);
      nrm.push(...g.nrm);
      uv.push(...g.uv);
      triIds.push(...g.ids);
      const count = g.pos.length / 3;
      geometry.addGroup(start, count, i);
      start += count;
    });
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    return { geometry, keys, triIds };
  }
}

/**
 * UVs in meters on the polygon's own plane: u runs horizontally along the face, v up the slope.
 * Used for roofs so tiles and slates keep their real size on any pitch.
 */
export function planarUV(verts: number[][]): (v: number[]) => number[] {
  const n = newell(verts) ?? [0, 1, 0];
  let t = cross3([0, 1, 0], n);
  let tl = Math.hypot(t[0]!, t[1]!, t[2]!);
  if (tl < 1e-6) {
    t = [1, 0, 0];
    tl = 1;
  }
  t = t.map((x) => x / tl);
  const b = cross3(n, t);
  return (v) => [
    v[0]! * t[0]! + v[1]! * t[1]! + v[2]! * t[2]!,
    v[0]! * b[0]! + v[1]! * b[1]! + v[2]! * b[2]!,
  ];
}

function sub3(a: number[], b: number[]) {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}
function cross3(a: number[], b: number[]) {
  return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
}

/** Newell's method: robust polygon normal. */
function newell(verts: number[][]): number[] | null {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i]!;
    const b = verts[(i + 1) % verts.length]!;
    x += (a[1]! - b[1]!) * (a[2]! + b[2]!);
    y += (a[2]! - b[2]!) * (a[0]! + b[0]!);
    z += (a[0]! - b[0]!) * (a[1]! + b[1]!);
  }
  const l = Math.hypot(x, y, z);
  return l < 1e-9 ? null : [x / l, y / l, z / l];
}
