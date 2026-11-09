'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Site } from '@/core/model/schema';
import { getThreeMaterial } from './materials';

/** Ground: a large neutral disc plus the plot surface with its boundary. */
export function Terrain({ site, showSurroundings, accent }: { site: Site; showSurroundings: boolean; accent: string }) {
  const plotGeo = useMemo(() => {
    // Build in (x, -y) and rotate -90° about X so plan (x, y) lands on world (x, 0, y) facing up.
    const shape = new THREE.Shape(site.plot.map((p) => new THREE.Vector2(p.x, -p.y)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    g.translate(0, -0.02, 0);
    return g;
  }, [site.plot]);
  const outline = useMemo(() => {
    const pts = [...site.plot, site.plot[0]!].map((p) => new THREE.Vector3(p.x, -0.005, p.y));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [site.plot]);
  useEffect(
    () => () => {
      plotGeo.dispose();
      outline.dispose();
    },
    [plotGeo, outline],
  );
  return (
    <group>
      <mesh geometry={plotGeo} material={getThreeMaterial(site.terrainMaterial)} receiveShadow userData={{ pick: true, id: 'site' }} />
      {showSurroundings && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
          <circleGeometry args={[220, 64]} />
          <meshStandardMaterial color="#a9b48f" roughness={1} />
        </mesh>
      )}
      <lineSegments geometry={outline}>
        <lineDashedMaterial color={accent} dashSize={0.4} gapSize={0.3} transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
