'use client';
import type { Level, Project, Slab } from '@/core/model/schema';
import { Section } from '@/components/ui/Section';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { ModelNumber, mutate } from './fields';
import { EntityActions, Readout } from './common';
import { findEntity } from '@/core/model/entities';
import { area, bounds } from '@/core/geometry/polygon';
import { formatArea, formatLength } from '@/core/units/units';
import { useDocument } from '@/store/document';

/** A free-standing floor slab. */
export function SlabInspector({ slab }: { slab: Slab; level: Level }) {
  const u = useDocument((s) => s.project.settings.units);
  const set = (fn: (s: Slab) => void) => (d: Project) => {
    const ref = findEntity(d, slab.id);
    if (ref?.kind === 'slab') fn(ref.entity);
  };
  const b = bounds(slab.points);
  return (
    <>
      <Section title="Floor">
        <MaterialPicker
          label="Finish"
          category="floor"
          value={slab.material}
          onChange={(id) => mutate('Floor finish', (d) => set((s) => void (s.material = id))(d as Project))}
        />
        <ModelNumber
          label="Thickness"
          value={slab.thickness}
          min={0.02}
          max={1}
          mergeKey={`slab-t-${slab.id}`}
          apply={(d, v) => set((s) => void (s.thickness = v))(d as Project)}
        />
        <Readout label="Area" value={formatArea(area(slab.points), u)} />
        <Readout label="Size" value={`${formatLength(b.width, u)} × ${formatLength(b.height, u)}`} />
        <p className="text-xs text-fg-subtle">A floor that does not depend on walls. Drag it to move it.</p>
      </Section>
      <EntityActions locked={slab.locked} />
    </>
  );
}
