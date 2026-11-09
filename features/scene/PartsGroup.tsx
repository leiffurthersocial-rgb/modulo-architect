'use client';
import type { Part } from '@/registry/types';
import { partGeometry } from './parts';
import { getThreeMaterial } from './materials';

/** Render a list of parts as plain meshes (used for openings, stairs and ghosts). */
export function PartsGroup({
  parts,
  resolve,
  variant = 'normal',
  pickId,
  shadows = true,
}: {
  parts: Part[];
  resolve: (slotOrMaterial: string) => string;
  variant?: 'normal' | 'ghost' | 'preview' | 'danger';
  pickId?: string;
  shadows?: boolean;
}) {
  return (
    <>
      {parts.map((p, i) => (
        <mesh
          key={i}
          geometry={partGeometry(p.geom)}
          material={getThreeMaterial(resolve(p.material), variant)}
          position={p.position}
          rotation={p.rotation ?? [0, 0, 0]}
          castShadow={shadows && !p.noShadow && variant === 'normal'}
          receiveShadow={variant === 'normal'}
          userData={pickId ? { pick: true, id: pickId } : undefined}
        />
      ))}
    </>
  );
}
