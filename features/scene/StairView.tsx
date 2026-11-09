'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Stair } from '@/core/model/schema';
import type { StairLayout } from '@/core/geometry/stairs';
import { getThreeMaterial } from './materials';

const unitBox = new THREE.BoxGeometry(1, 1, 1);

export function StairView({
  stair,
  layout,
  elevation,
  variant,
}: {
  stair: Stair;
  layout: StairLayout | undefined;
  elevation: number;
  variant: 'normal' | 'ghost' | 'preview';
}) {
  const steps = useMemo(() => layout?.steps ?? [], [layout]);
  if (!layout) return null;
  const mat = getThreeMaterial(stair.material, variant);
  const nosing = getThreeMaterial('lacquer-white', variant);
  return (
    <group userData={{ pick: true, id: stair.id }}>
      {steps.map((s, i) => {
        const h = s.y1 - s.y0;
        return (
          <group key={i} position={[s.x, elevation, s.y]} rotation={[0, -s.rotation, 0]}>
            <mesh
              geometry={unitBox}
              material={i % 2 === 0 ? mat : mat}
              position={[0, s.y0 + h / 2, 0]}
              scale={[s.w, h, s.d]}
              castShadow={variant === 'normal'}
              receiveShadow
              userData={{ pick: true, id: stair.id }}
            />
            <mesh
              geometry={unitBox}
              material={nosing}
              position={[0, s.y1 - 0.01, -s.d / 2 + 0.01]}
              scale={[s.w + 0.002, 0.022, 0.02]}
            />
          </group>
        );
      })}
    </group>
  );
}
