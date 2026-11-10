'use client';
import { useToolUI } from '@/features/tools/store';
import { useDocument } from '@/store/document';
import { getElement } from '@/registry';
import { PartsGroup } from './PartsGroup';
import { ModelBatch } from './ModelBatch';
import { OpeningView } from './OpeningView';
import { StairView } from './StairView';
import { deriveLevel } from './derive';
import { stairLayout } from '@/core/geometry/stairs';
import { resolveSlot } from './ItemsLayer';

/** Translucent preview of whatever the active tool is about to place. */
export function Ghost() {
  const ghost = useToolUI((s) => s.ghost);
  const project = useDocument((s) => s.project);
  if (!ghost) return null;
  if (ghost.kind === 'item') {
    const def = getElement(ghost.item.type);
    if (!def) return null;
    const level = ghost.levelId ? project.building.levels.find((l) => l.id === ghost.levelId) : null;
    const base = level ? level.elevation : 0;
    if (def.model)
      return (
        <ModelBatch
          def={def}
          items={[{ ...ghost.item, id: 'ghost' }]}
          baseY={base}
          variant={ghost.invalid ? 'danger' : 'preview'}
          pickable={false}
        />
      );
    const parts = def.build({ size: ghost.item.size, params: ghost.item.params });
    return (
      <group
        position={[ghost.item.x, base + ghost.item.z, ghost.item.y]}
        rotation={[0, -ghost.item.rotation, 0]}
      >
        <PartsGroup
          parts={parts}
          resolve={(s) => resolveSlot(def, ghost.item, s)}
          variant={ghost.invalid ? 'danger' : 'preview'}
          shadows={false}
        />
      </group>
    );
  }
  const level = project.building.levels.find((l) => l.id === ghost.levelId);
  if (!level) return null;
  if (ghost.kind === 'opening') {
    const dw = deriveLevel(level).wallById.get(ghost.opening.wallId);
    if (!dw) return null;
    return (
      <OpeningView
        opening={ghost.opening}
        shape={dw.shape}
        elevation={level.elevation}
        variant="preview"
        preview
      />
    );
  }
  return (
    <StairView
      stair={ghost.stair}
      layout={stairLayout(ghost.stair, ghost.stair.rise ?? level.height)}
      elevation={level.elevation}
      variant="preview"
    />
  );
}
