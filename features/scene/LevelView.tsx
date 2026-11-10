'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Level, Project } from '@/core/model/schema';
import { buildLevelWalls } from './buildWalls';
import { deriveLevel, levelAbove, levelBelow } from './derive';
import { getThreeMaterial } from './materials';
import { OpeningView } from './OpeningView';
import { ItemsLayer } from './ItemsLayer';
import { StairView } from './StairView';
import { pointInPolygon } from '@/core/geometry/polygon';
import { stairLayout } from '@/core/geometry/stairs';

export type Variant = 'normal' | 'ghost';

export function LevelView({
  project,
  level,
  variant,
  showCeilings,
  openDoors,
}: {
  project: Project;
  level: Level;
  variant: Variant;
  showCeilings: boolean;
  openDoors?: Record<string, number>;
}) {
  const derived = deriveLevel(level);
  const facade = project.exterior.facadeMaterial;
  const walls = useMemo(() => buildLevelWalls(level, derived, facade), [level, derived, facade]);
  useEffect(() => () => walls.geometry.dispose(), [walls]);
  const wallMaterials = useMemo(() => walls.keys.map((k) => getThreeMaterial(k, variant)), [walls, variant]);
  const below = levelBelow(project, level);
  const above = levelAbove(project, level);

  // Stair voids: stairs on the level below that climb up to this one.
  const holes = useMemo(() => {
    if (!below) return [];
    return below.stairs.filter((s) => s.rise === null).flatMap((s) => stairLayout(s, below.height).footprint);
  }, [below]);

  const ceilingY = level.elevation + level.height - (above ? above.floorThickness : 0) - 0.002;

  return (
    <group>
      <mesh
        geometry={walls.geometry}
        material={wallMaterials}
        castShadow={variant === 'normal'}
        receiveShadow
        userData={{ pick: true, triIds: walls.triIds }}
      />
      {level.rooms.map((room) => {
        if (room.hidden) return null;
        const dr = derived.rooms.find((r) => r.id === room.id);
        if (!dr || dr.polygon.length < 3) return null;
        const hasFloor = room.floor !== false;
        const roomHoles = holes.filter((h) => h.every((p) => pointInPolygon(p, dr.polygon)));
        return (
          <group key={room.id}>
            {hasFloor && (
              <FloorSlab
                id={room.id}
                polygon={dr.polygon}
                holes={roomHoles}
                top={level.elevation + 0.001}
                thickness={level.floorThickness}
                material={getThreeMaterial(room.floorMaterial, variant)}
                shadows={variant === 'normal'}
              />
            )}
            {showCeilings && (
              <Ceiling
                polygon={dr.polygon}
                holes={roomHoles.length ? [] : []}
                y={ceilingY}
                material={getThreeMaterial(room.ceilingMaterial)}
              />
            )}
          </group>
        );
      })}
      {level.slabs.map((s) =>
        s.hidden ? null : (
          <FloorSlab
            key={s.id}
            id={s.id}
            polygon={s.points}
            holes={holes.filter((h) => h.every((p) => pointInPolygon(p, s.points)))}
            top={level.elevation + 0.0005}
            thickness={s.thickness}
            material={getThreeMaterial(s.material, variant)}
            shadows={variant === 'normal'}
          />
        ),
      )}
      {level.openings.map((o) => {
        if (o.hidden) return null;
        const dw = derived.wallById.get(o.wallId);
        const wall = level.walls.find((w) => w.id === o.wallId);
        if (!dw || !wall || wall.hidden) return null;
        return (
          <OpeningView
            key={o.id}
            opening={o}
            shape={dw.shape}
            elevation={level.elevation}
            variant={variant}
            open={openDoors?.[o.id] ?? 0}
          />
        );
      })}
      {level.stairs.map((s) =>
        s.hidden ? null : (
          <StairView
            key={s.id}
            stair={s}
            layout={derived.stairs.get(s.id)}
            elevation={level.elevation}
            variant={variant}
          />
        ),
      )}
      <ItemsLayer items={level.items} baseY={level.elevation} variant={variant} ceilingY={ceilingY} />
    </group>
  );
}

function FloorSlab({
  id,
  polygon,
  holes,
  top,
  thickness,
  material,
  shadows,
}: {
  id: string;
  polygon: { x: number; y: number }[];
  holes: { x: number; y: number }[][];
  top: number;
  thickness: number;
  material: THREE.Material;
  shadows: boolean;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(polygon.map((p) => new THREE.Vector2(p.x, p.y)));
    for (const h of holes) shape.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p.x, p.y))));
    const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.translate(0, top, 0);
    return g;
  }, [polygon, holes, top, thickness]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      material={material}
      receiveShadow
      castShadow={shadows}
      userData={{ pick: true, id }}
    />
  );
}

function Ceiling({
  polygon,
  y,
  material,
}: {
  polygon: { x: number; y: number }[];
  holes: unknown[];
  y: number;
  material: THREE.Material;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(polygon.map((p) => new THREE.Vector2(p.x, p.y)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(Math.PI / 2);
    g.translate(0, y, 0);
    return g;
  }, [polygon, y]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} receiveShadow />;
}
