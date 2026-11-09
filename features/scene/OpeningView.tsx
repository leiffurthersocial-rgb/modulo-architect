'use client';
import { useMemo } from 'react';
import type { Opening } from '@/core/model/schema';
import type { WallShape } from '@/core/geometry/walls';
import { getOpening } from '@/registry';
import { OPENING_SLOTS } from '@/registry/openings';
import { PartsGroup } from './PartsGroup';

export function OpeningView({
  opening,
  shape,
  elevation,
  variant,
  open = 0,
  preview,
}: {
  opening: Opening;
  shape: WallShape;
  elevation: number;
  variant: 'normal' | 'ghost' | 'preview' | 'danger';
  open?: number;
  preview?: boolean;
}) {
  const def = getOpening(opening.type);
  const parts = useMemo(
    () =>
      def?.build({
        width: opening.width,
        height: opening.height,
        thickness: shape.thickness,
        params: { ...opening.params, open },
      }) ?? [],
    [def, opening.width, opening.height, opening.params, shape.thickness, open],
  );
  if (!def) return null;
  const cx = shape.a.x + shape.dir.x * opening.offset;
  const cz = shape.a.y + shape.dir.y * opening.offset;
  const rotY = -Math.atan2(shape.dir.y, shape.dir.x);
  const resolve = (slot: string) =>
    slot === 'frame' || slot === 'leaf'
      ? (opening.material ?? OPENING_SLOTS[slot]!)
      : (OPENING_SLOTS[slot] ?? slot);
  return (
    <group
      position={[cx, elevation + opening.sill, cz]}
      rotation={[0, rotY, 0]}
      scale={[opening.mirror ? -1 : 1, 1, opening.flip ? -1 : 1]}
    >
      <PartsGroup
        parts={parts}
        resolve={resolve}
        variant={variant}
        pickId={preview ? undefined : opening.id}
      />
    </group>
  );
}
