'use client';
import type { Project, Roof } from '@/core/model/schema';
import { Section, Row, LabeledRow, More } from '@/components/ui/Section';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { ModelNumber, mutate } from './fields';
import { EntityActions, Readout } from './common';
import { findEntity } from '@/core/model/entities';
import { ridgeHeight } from '@/core/geometry/roof';
import { formatLength } from '@/core/units/units';
import { useDocument } from '@/store/document';

export function RoofInspector({ roof }: { roof: Roof }) {
  const u = useDocument((s) => s.project.settings.units);
  const set = (fn: (r: Roof) => void) => (d: Project) => {
    const ref = findEntity(d, roof.id);
    if (ref?.kind === 'roof') fn(ref.entity);
  };
  return (
    <>
      <Section title="Type">
        <Segmented
          ariaLabel="Roof type"
          size="sm"
          value={roof.type}
          onChange={(v) =>
            mutate('Roof type', (d) =>
              set((r) => {
                r.type = v;
                if (v !== 'flat' && r.pitch < 5) r.pitch = 30;
              })(d as Project),
            )
          }
          options={[
            { value: 'gable', label: 'Gable' },
            { value: 'hip', label: 'Hip' },
            { value: 'shed', label: 'Shed' },
            { value: 'flat', label: 'Flat' },
          ]}
        />
        {roof.type !== 'flat' && roof.type !== 'hip' && (
          <LabeledRow label="Ridge direction">
            <Segmented
              ariaLabel="Ridge direction"
              size="sm"
              value={roof.ridge}
              onChange={(v) => mutate('Ridge direction', (d) => set((r) => void (r.ridge = v))(d as Project))}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'x', label: '↔' },
                { value: 'y', label: '↕' },
              ]}
            />
          </LabeledRow>
        )}
      </Section>
      <Section title="Shape">
        <Row>
          {roof.type !== 'flat' && (
            <ModelNumber
              label="Pitch"
              short="Pitch"
              kind="angle"
              value={(roof.pitch * Math.PI) / 180}
              min={0}
              max={(75 * Math.PI) / 180}
              mergeKey={`rf-p-${roof.id}`}
              testId="roof-pitch"
              apply={(d, v) => set((r) => void (r.pitch = (v * 180) / Math.PI))(d as Project)}
            />
          )}
          <ModelNumber
            label="Overhang"
            short="Over"
            value={roof.overhang}
            min={0}
            max={2}
            mergeKey={`rf-o-${roof.id}`}
            apply={(d, v) => set((r) => void (r.overhang = v))(d as Project)}
          />
        </Row>
        <ModelNumber
          label="Thickness"
          value={roof.thickness}
          min={0.05}
          max={1}
          mergeKey={`rf-t-${roof.id}`}
          apply={(d, v) => set((r) => void (r.thickness = v))(d as Project)}
        />
        <Readout label="Height above walls" value={formatLength(ridgeHeight(roof), u)} />
      </Section>
      <Section title="Finish">
        <MaterialPicker
          label="Roofing"
          category="roof"
          value={roof.material}
          onChange={(id) => mutate('Roof finish', (d) => set((r) => void (r.material = id))(d as Project))}
        />
      </Section>
      <Section>
        <LabeledRow label="Fit to walls">
          <Switch
            label="Fit roof to walls automatically"
            checked={roof.auto}
            onChange={(on) => mutate('Roof auto-fit', (d) => set((r) => void (r.auto = on))(d as Project))}
          />
        </LabeledRow>
        {!roof.auto && (
          <More label="Footprint">
            <Row>
              <ModelNumber
                label="X"
                value={roof.x}
                mergeKey={`rf-x-${roof.id}`}
                apply={(d, v) => set((r) => void (r.x = v))(d as Project)}
              />
              <ModelNumber
                label="Y"
                value={roof.y}
                mergeKey={`rf-y-${roof.id}`}
                apply={(d, v) => set((r) => void (r.y = v))(d as Project)}
              />
            </Row>
            <Row>
              <ModelNumber
                label="Width"
                short="W"
                value={roof.width}
                min={1}
                mergeKey={`rf-w-${roof.id}`}
                apply={(d, v) => set((r) => void (r.width = v))(d as Project)}
              />
              <ModelNumber
                label="Depth"
                short="D"
                value={roof.depth}
                min={1}
                mergeKey={`rf-d-${roof.id}`}
                apply={(d, v) => set((r) => void (r.depth = v))(d as Project)}
              />
            </Row>
            <ModelNumber
              label="Rotation"
              kind="angle"
              value={-roof.rotation}
              mergeKey={`rf-r-${roof.id}`}
              apply={(d, v) => set((r) => void (r.rotation = -v))(d as Project)}
            />
          </More>
        )}
      </Section>
      <EntityActions locked={roof.locked} />
    </>
  );
}
