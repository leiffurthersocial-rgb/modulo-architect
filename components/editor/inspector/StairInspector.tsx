'use client';
import type { Level, Project, Stair } from '@/core/model/schema';
import { Section, Row, LabeledRow } from '@/components/ui/Section';
import { Segmented } from '@/components/ui/Segmented';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { ModelNumber, mutate } from './fields';
import { EntityActions, Readout } from './common';
import { findEntity } from '@/core/model/entities';
import { stairLayout } from '@/core/geometry/stairs';
import { formatArea, formatLength } from '@/core/units/units';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { ArrowUpToLine, Plus } from 'lucide-react';
import { addLevel } from '@/store/actions';
import { stairReachesNext } from '@/core/model/voids';
import { area } from '@/core/geometry/polygon';

export function StairInspector({ stair, level }: { stair: Stair; level: Level }) {
  const u = useDocument((s) => s.project.settings.units);
  const set = (fn: (s: Stair) => void) => (d: Project) => {
    const ref = findEntity(d, stair.id);
    if (ref?.kind === 'stair') fn(ref.entity);
  };
  const lay = stairLayout(stair, stair.rise ?? level.height);
  const levels = useDocument((s) => s.project.building.levels);
  const above = levels[levels.findIndex((l) => l.id === level.id) + 1];
  const reaches = stairReachesNext(stair, level);
  const openArea = lay.footprint.reduce((a, poly) => a + area(poly), 0);
  return (
    <>
      <Section title="Shape">
        <Segmented
          ariaLabel="Stair shape"
          size="sm"
          value={stair.type}
          onChange={(v) => mutate('Stair shape', (d) => set((s) => void (s.type = v))(d as Project))}
          options={[
            { value: 'straight', label: 'Straight' },
            { value: 'l-shaped', label: 'L-shaped' },
          ]}
        />
        {stair.type === 'l-shaped' && (
          <LabeledRow label="Turn">
            <Segmented
              ariaLabel="Turn direction"
              size="sm"
              value={stair.turn}
              onChange={(v) => mutate('Stair turn', (d) => set((s) => void (s.turn = v))(d as Project))}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </LabeledRow>
        )}
      </Section>
      <Section title="Size">
        <Row>
          <ModelNumber
            label="Width"
            short="W"
            value={stair.width}
            min={0.6}
            max={3}
            mergeKey={`st-w-${stair.id}`}
            apply={(d, v) => set((s) => void (s.width = v))(d as Project)}
          />
          <ModelNumber
            label="Run"
            short="Run"
            value={stair.length}
            min={0.8}
            max={10}
            mergeKey={`st-l-${stair.id}`}
            apply={(d, v) => set((s) => void (s.length = v))(d as Project)}
          />
        </Row>
        <Row>
          {stair.type === 'l-shaped' && (
            <ModelNumber
              label="Second run"
              short="Run 2"
              value={stair.length2}
              min={0.5}
              max={8}
              mergeKey={`st-l2-${stair.id}`}
              apply={(d, v) => set((s) => void (s.length2 = v))(d as Project)}
            />
          )}
          <ModelNumber
            label="Rotation"
            short="R"
            kind="angle"
            value={-stair.rotation}
            mergeKey={`st-r-${stair.id}`}
            apply={(d, v) => set((s) => void (s.rotation = -v))(d as Project)}
          />
        </Row>
        <ModelNumber
          label="Rise"
          value={stair.rise ?? level.height}
          min={0.2}
          max={10}
          mergeKey={`st-rise-${stair.id}`}
          apply={(d, v) =>
            set((s) => void (s.rise = Math.abs(v - level.height) < 1e-6 ? null : v))(d as Project)
          }
        />
        <Readout label="Steps" value={`${lay.count} × ${formatLength(lay.riser, u)}`} />
        <Readout label="Going" value={formatLength(lay.tread, u)} />
      </Section>
      <Section title="Floor above">
        {above ? (
          <>
            <LabeledRow label="Cut stairwell opening">
              <Switch
                label="Cut an opening in the floor above"
                checked={stair.opening !== false}
                onChange={(on) =>
                  mutate(on ? 'Cut stairwell' : 'Close stairwell', (d) =>
                    set((s) => void (s.opening = on))(d as Project),
                  )
                }
              />
            </LabeledRow>
            <p className="text-xs text-fg-subtle">
              {!reaches
                ? `This stair does not reach ${above.name}, so no opening is cut.`
                : stair.opening !== false
                  ? `The ${above.name} floor and this level's ceiling are open above the stairs (${formatArea(openArea, u)}).`
                  : `${above.name} keeps its floor here.`}
            </p>
            <Button
              size="sm"
              variant="secondary"
              icon={<ArrowUpToLine className="h-3.5 w-3.5" />}
              onClick={() => useEditor.getState().setActiveLevel(above.id)}
            >
              Go to {above.name}
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-fg-subtle">
              There is no level above yet. Add one and the stairwell is cut automatically.
            </p>
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => addLevel(true)}
            >
              Add a level above
            </Button>
          </>
        )}
      </Section>
      <Section title="Finish">
        <MaterialPicker
          label="Treads"
          category="floor"
          value={stair.material}
          onChange={(id) => mutate('Stair finish', (d) => set((s) => void (s.material = id))(d as Project))}
        />
      </Section>
      <EntityActions locked={stair.locked} duplicate />
    </>
  );
}
