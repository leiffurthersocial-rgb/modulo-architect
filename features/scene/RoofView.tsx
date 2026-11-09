'use client';
import { useEffect, useMemo } from 'react';
import type { Project, Roof } from '@/core/model/schema';
import { roofFaces } from '@/core/geometry/roof';
import { MeshBuilder } from './prism';
import { getThreeMaterial } from './materials';

export function RoofView({ roof, project, variant }: { roof: Roof; project: Project; variant: 'normal' | 'ghost' }) {
  const level = project.building.levels.find((l) => l.id === roof.levelId);
  const base = level ? level.elevation + Math.max(level.height, ...level.walls.map((w) => w.height ?? 0)) : 3;
  const wallT = level?.walls[0]?.thickness ?? 0.2;
  const facade = project.exterior.facadeMaterial;
  const built = useMemo(() => {
    const mb = new MeshBuilder();
    for (const f of roofFaces(roof, base, wallT)) {
      const key = f.kind === 'gable' ? facade : f.kind === 'bottom' ? 'paint-white' : roof.material;
      mb.polygon(key, roof.id, f.verts, (v) => [v[0]!, v[2]! + v[1]!]);
    }
    return mb.build();
  }, [roof, base, wallT, facade]);
  useEffect(() => () => built.geometry.dispose(), [built]);
  const mats = useMemo(() => built.keys.map((k) => getThreeMaterial(k, variant)), [built, variant]);
  if (roof.hidden) return null;
  return <mesh geometry={built.geometry} material={mats} castShadow={variant === 'normal'} receiveShadow userData={{ pick: true, id: roof.id }} />;
}
