'use client';
import type { Level, Wall, Project } from '@/core/model/schema';
import { Section, More, Row, LabeledRow } from '@/components/ui/Section';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { Switch } from '@/components/ui/Switch';
import { ModelNumber, mutate } from './fields';
import { EntityActions, Readout } from './common';
import * as ops from '@/core/model/ops';
import { findEntity } from '@/core/model/entities';
import { deriveLevel } from '@/features/scene/derive';
import { useDocument } from '@/store/document';
import { formatLength } from '@/core/units/units';
import { nodePos } from '@/core/geometry/graph';
import { angleOf, sub } from '@/core/geometry/vec2';

export function WallInspector({ wall, level }: { wall: Wall; level: Level }) {
  const project = useDocument((s) => s.project);
  const u = project.settings.units;
  const length = ops.wallLength(level, wall);
  const dw = deriveLevel(level).wallById.get(wall.id);
  const exterior = dw ? dw.leftExterior || dw.rightExterior : false;
  const set = (fn: (w: Wall) => void) => (d: Project) => {
    const ref = findEntity(d, wall.id);
    if (ref?.kind === 'wall') fn(ref.entity);
  };
  const a = nodePos(level, wall.a)!;
  const b = nodePos(level, wall.b)!;
  const ang = ((-angleOf(sub(b, a)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return (
    <>
      <Section title="Dimensions">
        <ModelNumber
          label="Length"
          value={length}
          min={0.1}
          mergeKey={`wall-len-${wall.id}`}
          disabled={wall.locked}
          testId="wall-length"
          apply={(d, v) => ops.setWallLength(d as Project, wall.id, v)}
        />
        <Row>
          <ModelNumber
            label="Thickness"
            short="T"
            value={wall.thickness}
            min={0.05}
            max={1}
            mergeKey={`wall-t-${wall.id}`}
            disabled={wall.locked}
            apply={(d, v) => set((w) => void (w.thickness = v))(d as Project)}
          />
          <ModelNumber
            label="Height"
            short="H"
            value={wall.height ?? level.height}
            min={0.3}
            max={20}
            mergeKey={`wall-h-${wall.id}`}
            disabled={wall.locked}
            apply={(d, v) => set((w) => void (w.height = Math.abs(v - level.height) < 1e-6 ? null : v))(d as Project)}
          />
        </Row>
        <LabeledRow label="Follow floor height">
          <Switch
            label="Wall height follows the level's floor height"
            checked={wall.height === null}
            onChange={(on) => mutate('Wall height', (d) => set((w) => void (w.height = on ? null : level.height))(d as Project))}
          />
        </LabeledRow>
      </Section>
      <Section title="Finish">
        <MaterialPicker
          label={dw?.leftExterior ? 'Facade (left)' : 'Left side'}
          category={dw?.leftExterior ? 'facade' : 'wall'}
          value={dw?.leftExterior ? (wall.facade ?? project.exterior.facadeMaterial) : wall.materials.left}
          onChange={(id) => mutate('Wall finish', (d) => set((w) => (dw?.leftExterior ? (w.facade = id) : (w.materials.left = id)))(d as Project))}
        />
        <MaterialPicker
          label={dw?.rightExterior ? 'Facade (right)' : 'Right side'}
          category={dw?.rightExterior ? 'facade' : 'wall'}
          value={dw?.rightExterior ? (wall.facade ?? project.exterior.facadeMaterial) : wall.materials.right}
          onChange={(id) => mutate('Wall finish', (d) => set((w) => (dw?.rightExterior ? (w.facade = id) : (w.materials.right = id)))(d as Project))}
        />
        {exterior && wall.facade && (
          <button className="self-start text-xs text-accent hover:underline" onClick={() => mutate('Reset facade', (d) => set((w) => void delete w.facade)(d as Project))}>
            Use the house facade
          </button>
        )}
      </Section>
      <Section>
        <More>
          <Readout label="Start" value={`${formatLength(a.x, u)}, ${formatLength(a.y, u)}`} />
          <Readout label="End" value={`${formatLength(b.x, u)}, ${formatLength(b.y, u)}`} />
          <Readout label="Angle" value={`${Math.round((ang * 180) / Math.PI * 10) / 10}°`} />
          <Readout label="Openings" value={String(level.openings.filter((o) => o.wallId === wall.id).length)} />
        </More>
      </Section>
      <EntityActions locked={wall.locked} />
    </>
  );
}
