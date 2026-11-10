'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Site } from '@/core/model/schema';
import { getEnvironment, type EnvironmentPreset } from '@/registry/environments';
import {
  SIDE_NORMAL,
  edgeOffset,
  lakePolygon,
  mulberry32,
  neighbours,
  plotFrame,
  roadRect,
  scatterItems,
  type PlotFrame,
} from '@/core/environment';
import { subtract } from '@/core/geometry/clip';
import type { Vec2 } from '@/core/geometry/vec2';
import { getThreeMaterial } from './materials';
import { ItemsLayer } from './ItemsLayer';
import { metricUVs, partGeometry } from './parts';
import { MeshBuilder, planarUV } from './prism';

const R = 700;

/** Flat region(s) at height y; UVs in meters. */
function flatGeometry(polys: { outer: Vec2[]; holes: Vec2[][] }[], y: number) {
  const shapes = polys.map((r) => {
    const s = new THREE.Shape(r.outer.map((p) => new THREE.Vector2(p.x, -p.y)));
    for (const h of r.holes) s.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p.x, -p.y))));
    return s;
  });
  const g = new THREE.ShapeGeometry(shapes, 1);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/** Geometry rebuilt when the preset or plot changes, disposed when replaced. */
function useDisposable<T extends THREE.BufferGeometry | null>(
  make: () => T,
  preset: EnvironmentPreset,
  f: PlotFrame,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const g = useMemo(() => make(), [preset, f]);
  useEffect(() => () => g?.dispose(), [g]);
  return g;
}

function Ground({ preset, f }: { preset: EnvironmentPreset; f: PlotFrame }) {
  const geo = useDisposable(
    () => {
      const square: Vec2[] = [
        { x: f.cx - R, y: f.cy - R },
        { x: f.cx + R, y: f.cy - R },
        { x: f.cx + R, y: f.cy + R },
        { x: f.cx - R, y: f.cy + R },
      ];
      const cuts: Vec2[][] = [];
      if (preset.coast) {
        const n = SIDE_NORMAL[preset.coast.side];
        const t = { x: -n.y, y: n.x };
        const d = edgeOffset(f, preset.coast.side) + preset.coast.distance;
        const P = (s: number, dd: number) => ({
          x: t.x * s + n.x * dd + f.cx * Math.abs(t.x),
          y: t.y * s + n.y * dd + f.cy * Math.abs(t.y),
        });
        cuts.push([P(-2 * R, d), P(2 * R, d), P(2 * R, d + 3 * R), P(-2 * R, d + 3 * R)]);
      }
      const lake = lakePolygon(preset, f);
      if (lake) cuts.push(lake);
      return flatGeometry(subtract(square, cuts), -0.045);
    },
    preset,
    f,
  );
  return <mesh geometry={geo} material={getThreeMaterial(preset.ground)} receiveShadow />;
}

function Coast({ preset, f }: { preset: EnvironmentPreset; f: PlotFrame }) {
  const coast = preset.coast!;
  const built = useMemo(() => {
    const n = SIDE_NORMAL[coast.side];
    const t = { x: -n.y, y: n.x };
    const d = edgeOffset(f, coast.side) + coast.distance;
    const W = (s: number, dd: number, y: number) => [
      t.x * s + n.x * dd + f.cx * Math.abs(t.x),
      y,
      t.y * s + n.y * dd + f.cy * Math.abs(t.y),
    ];
    const mb = new MeshBuilder();
    const rnd = mulberry32(coast.side.length * 977 + Math.round(d));
    if (coast.kind === 'cliff') {
      // A jagged rock face: columns every few meters that lean and bulge out as they drop.
      const step = 5;
      const cols: { s: number; top: number; mid: number; bot: number }[] = [];
      const raw: { s: number; top: number; mid: number; bot: number }[] = [];
      for (let s = -R; s <= R; s += step)
        raw.push({ s, top: (rnd() - 0.5) * 1.6, mid: 1 + rnd() * 5, bot: 3 + rnd() * 9 });
      // Smooth the noise so the face reads as eroded rock, not a saw blade.
      for (let i = 0; i < raw.length; i++) {
        const nb = [raw[i - 2], raw[i - 1], raw[i], raw[i + 1], raw[i + 2]].filter(Boolean) as typeof raw;
        const avg = (k: 'top' | 'mid' | 'bot') => nb.reduce((a, c) => a + c[k], 0) / nb.length;
        cols.push({ s: raw[i]!.s, top: avg('top'), mid: avg('mid') + (rnd() - 0.5) * 1.2, bot: avg('bot') });
      }
      for (let i = 0; i < cols.length - 1; i++) {
        const a = cols[i]!;
        const b = cols[i + 1]!;
        const yMid = -coast.drop * 0.45;
        const upper = [
          W(a.s, d + a.top, -0.05),
          W(b.s, d + b.top, -0.05),
          W(b.s, d + b.mid, yMid),
          W(a.s, d + a.mid, yMid),
        ];
        const lower = [
          W(a.s, d + a.mid, yMid),
          W(b.s, d + b.mid, yMid),
          W(b.s, d + b.bot, -coast.drop - 2),
          W(a.s, d + a.bot, -coast.drop - 2),
        ];
        for (const quad of [upper, lower]) {
          mb.polygon(
            coast.rock ?? 'rock',
            'cliff',
            [quad[0]!, quad[1]!, quad[2]!],
            planarUV([quad[0]!, quad[1]!, quad[2]!]),
          );
          mb.polygon(
            coast.rock ?? 'rock',
            'cliff',
            [quad[0]!, quad[2]!, quad[3]!],
            planarUV([quad[0]!, quad[2]!, quad[3]!]),
          );
        }
      }
      // Cliff-top strip of rocky ground.
      const strip = [W(-R, d - 6, -0.04), W(R, d - 6, -0.04), W(R, d, -0.05), W(-R, d, -0.05)];
      mb.polygon(coast.edge ?? 'rocky-ground', 'edge', strip, planarUV(strip), [0, 1, 0]);
    } else {
      // A sloping beach down to the water line.
      const beach = [
        W(-R, d, -0.045),
        W(R, d, -0.045),
        W(R, d + 26, -coast.drop - 0.4),
        W(-R, d + 26, -coast.drop - 0.4),
      ];
      mb.polygon(coast.edge ?? 'sand', 'beach', beach, planarUV(beach));
      const back = [W(-R, d - 8, -0.04), W(R, d - 8, -0.04), W(R, d, -0.045), W(-R, d, -0.045)];
      mb.polygon(coast.edge ?? 'sand', 'beach', back, planarUV(back), [0, 1, 0]);
    }
    const waterY = coast.kind === 'cliff' ? -coast.drop + 0.6 : -coast.drop * 0.55;
    const water = [
      W(-R * 2, d - 4, waterY),
      W(R * 2, d - 4, waterY),
      W(R * 2, d + R * 2, waterY),
      W(-R * 2, d + R * 2, waterY),
    ];
    const wm = new MeshBuilder();
    wm.polygon(coast.water, 'water', water, (v) => [v[0]!, v[2]!], [0, 1, 0]);
    return { land: mb.build(), water: wm.build() };
  }, [coast, f]);
  useEffect(
    () => () => {
      built.land.geometry.dispose();
      built.water.geometry.dispose();
    },
    [built],
  );
  return (
    <>
      <mesh
        geometry={built.land.geometry}
        material={built.land.keys.map((k) => getThreeMaterial(k, 'normal', 2))}
        receiveShadow
        castShadow
      />
      <mesh geometry={built.water.geometry} material={getThreeMaterial(coast.water)} />
    </>
  );
}

function Lake({ preset, f }: { preset: EnvironmentPreset; f: PlotFrame }) {
  const lake = preset.lake!;
  const geos = useDisposable(
    () => {
      const poly = lakePolygon(preset, f)!;
      const c = poly.reduce((a, q) => ({ x: a.x + q.x / poly.length, y: a.y + q.y / poly.length }), {
        x: 0,
        y: 0,
      });
      const outer = poly.map((q) => ({ x: c.x + (q.x - c.x) * 1.08, y: c.y + (q.y - c.y) * 1.08 }));
      const g = flatGeometry(subtract(outer, [poly]), -0.04);
      const water = flatGeometry([{ outer: poly, holes: [] }], -0.35);
      const merged = new THREE.BufferGeometry();
      merged.userData = { shore: g, water };
      return merged;
    },
    preset,
    f,
  );
  const { shore, water } = geos.userData as { shore: THREE.BufferGeometry; water: THREE.BufferGeometry };
  useEffect(
    () => () => {
      shore.dispose();
      water.dispose();
    },
    [shore, water],
  );
  return (
    <>
      <mesh geometry={shore} material={getThreeMaterial(lake.shore)} receiveShadow />
      <mesh geometry={water} material={getThreeMaterial(lake.water)} />
      <mesh geometry={water} position={[0, -1.4, 0]} material={getThreeMaterial('soil', 'normal', 4)} />
    </>
  );
}

function Road({ preset, f }: { preset: EnvironmentPreset; f: PlotFrame }) {
  const geo = useDisposable(
    () => {
      const r = roadRect(preset, f)!;
      return flatGeometry([{ outer: r, holes: [] }], -0.03);
    },
    preset,
    f,
  );
  const walk = useDisposable(
    () => {
      const n = SIDE_NORMAL[preset.road!.side];
      const r = roadRect(preset, f)!;
      const off = (p: Vec2, k: number) => ({ x: p.x + n.x * k, y: p.y + n.y * k });
      const near = [off(r[0]!, -2), off(r[1]!, -2), r[1]!, r[0]!];
      const far = [r[3]!, r[2]!, off(r[2]!, 2), off(r[3]!, 2)];
      return flatGeometry(
        [
          { outer: near, holes: [] },
          { outer: far, holes: [] },
        ],
        -0.02,
      );
    },
    preset,
    f,
  );
  return (
    <>
      <mesh geometry={geo} material={getThreeMaterial('asphalt')} receiveShadow />
      <mesh geometry={walk} material={getThreeMaterial('paving')} receiveShadow />
    </>
  );
}

function Neighbours({ preset, f }: { preset: EnvironmentPreset; f: PlotFrame }) {
  const list = useMemo(() => neighbours(preset, f), [preset, f]);
  return (
    <>
      {list.map((h, i) => (
        <group key={i} position={[h.x, 0, h.y]} rotation={[0, -h.rotation, 0]}>
          <mesh
            geometry={partGeometry({ kind: 'box', size: [h.w, h.h, h.d] })}
            position={[0, h.h / 2, 0]}
            material={getThreeMaterial(h.facade)}
            castShadow
            receiveShadow
          />
          <GableRoof w={h.w} d={h.d} y={h.h} material={h.roof} />
          <mesh
            geometry={partGeometry({ kind: 'box', size: [1, 2.1, 0.05] })}
            position={[0, 1.05, h.d / 2 + 0.02]}
            material={getThreeMaterial('timber-dark')}
          />
          {[-h.w / 3, h.w / 3].map((x) => (
            <mesh
              key={x}
              geometry={partGeometry({ kind: 'box', size: [1.4, 1.3, 0.05] })}
              position={[x, 1.5, h.d / 2 + 0.02]}
              material={getThreeMaterial('glass-smoked')}
            />
          ))}
        </group>
      ))}
    </>
  );
}

function GableRoof({ w, d, y, material }: { w: number; d: number; y: number; material: string }) {
  const built = useMemo(() => {
    const mb = new MeshBuilder();
    const o = 0.4;
    const ridge = y + d * 0.4;
    const A = [-w / 2 - o, y - 0.15, d / 2 + o];
    const B = [w / 2 + o, y - 0.15, d / 2 + o];
    const C = [w / 2 + o, ridge, 0];
    const D = [-w / 2 - o, ridge, 0];
    const E = [-w / 2 - o, y - 0.15, -d / 2 - o];
    const F = [w / 2 + o, y - 0.15, -d / 2 - o];
    mb.polygon(material, 'r', [A, B, C, D], planarUV([A, B, C, D]));
    mb.polygon(material, 'r', [F, E, D, C], planarUV([F, E, D, C]));
    for (const sx of [-1, 1]) {
      const tri = [
        [(sx * w) / 2, y, d / 2],
        [(sx * w) / 2, y, -d / 2],
        [(sx * w) / 2, ridge - 0.2, 0],
      ];
      mb.polygon('render-white', 'g', sx > 0 ? tri : [...tri].reverse(), planarUV(tri));
    }
    return mb.build();
  }, [w, d, y, material]);
  useEffect(() => () => built.geometry.dispose(), [built]);
  return (
    <mesh
      geometry={built.geometry}
      material={built.keys.map((k) => getThreeMaterial(k))}
      castShadow
      receiveShadow
    />
  );
}

function Hills({ preset, f }: { preset: EnvironmentPreset; f: PlotFrame }) {
  const hills = useMemo(
    () =>
      (preset.hills ?? []).map((h, i) => {
        const rnd = mulberry32(i * 131 + Math.round(h.height));
        let geo: THREE.BufferGeometry;
        if (h.rounded) {
          geo = new THREE.SphereGeometry(h.radius, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
          geo.scale(1, h.height / h.radius, 1);
        } else {
          geo = new THREE.ConeGeometry(h.radius, h.height, 11, 8);
          geo.translate(0, h.height / 2, 0);
          const pos = geo.getAttribute('position');
          for (let k = 0; k < pos.count; k++) {
            const y = pos.getY(k);
            if (y > h.height - 1) continue;
            const j = 1 + (rnd() - 0.5) * 0.35;
            pos.setX(k, pos.getX(k) * j);
            pos.setZ(k, pos.getZ(k) * j);
            pos.setY(k, y * (1 + (rnd() - 0.5) * 0.08));
          }
          geo = geo.toNonIndexed();
          geo.computeVertexNormals();
        }
        metricUVs(geo);
        let cap: THREE.BufferGeometry | null = null;
        if (h.snow) {
          cap = new THREE.ConeGeometry(h.radius * 0.36, h.height * 0.34, 11, 2);
          cap.translate(0, h.height - h.height * 0.17 + 0.5, 0);
          metricUVs(cap);
        }
        const a = h.angle;
        return { geo, cap, x: f.cx + Math.cos(a) * h.distance, z: f.cy - Math.sin(a) * h.distance, h };
      }),
    [preset, f],
  );
  useEffect(
    () => () =>
      hills.forEach((h) => {
        h.geo.dispose();
        h.cap?.dispose();
      }),
    [hills],
  );
  return (
    <>
      {hills.map((h, i) => (
        <group key={i} position={[h.x, -0.5, h.z]}>
          <mesh geometry={h.geo} material={getThreeMaterial(h.h.material, 'normal', 12)} />
          {h.cap && <mesh geometry={h.cap} material={getThreeMaterial('snow', 'normal', 10)} />}
        </group>
      ))}
    </>
  );
}

/** Everything outside the plot for the chosen outdoor preset. */
export function Surroundings({ site }: { site: Site }) {
  const preset = getEnvironment(site.environment);
  const f = useMemo(() => plotFrame(site), [site]);
  const items = useMemo(() => scatterItems(preset, site), [preset, site]);
  return (
    <group>
      <Ground preset={preset} f={f} />
      {preset.coast && <Coast preset={preset} f={f} />}
      {preset.lake && <Lake preset={preset} f={f} />}
      {preset.road && <Road preset={preset} f={f} />}
      {preset.neighbours ? <Neighbours preset={preset} f={f} /> : null}
      <Hills preset={preset} f={f} />
      <ItemsLayer items={items} baseY={0} variant="normal" pickable={false} />
    </group>
  );
}
