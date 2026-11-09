'use client';
import { FlipHorizontal2, FlipVertical2 } from 'lucide-react';
import type { Level, Opening, Project } from '@/core/model/schema';
import { Section, Row, More } from '@/components/ui/Section';
import { Select } from '@/components/ui/Select';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { Button } from '@/components/ui/Button';
import { ModelNumber, mutate } from './fields';
import { EntityActions } from './common';
import { allOpenings, getOpening, defaultParams } from '@/registry';
import { findEntity } from '@/core/model/entities';
import * as ops from '@/core/model/ops';
import { OPENING_SLOTS } from '@/registry/openings';

export function OpeningInspector({ opening, level }: { opening: Opening; level: Level }) {
  const def = getOpening(opening.type);
  const wall = level.walls.find((w) => w.id === opening.wallId);
  const L = wall ? ops.wallLength(level, wall) : 10;
  const set = (fn: (o: Opening) => void) => (d: Project) => {
    const ref = findEntity(d, opening.id);
    if (ref?.kind === 'opening') fn(ref.entity);
  };
  const isDoor = def?.kind === 'door';
  const sameKind = allOpenings().filter((o) => o.kind === def?.kind);
  return (
    <>
      <Section title="Type">
        <Select
          label="Opening type"
          value={opening.type}
          options={sameKind.map((o) => ({ value: o.id, label: o.name }))}
          onChange={(v) =>
            mutate('Change type', (d) =>
              set((o) => {
                const nd = getOpening(v)!;
                o.type = v;
                o.params = { ...defaultParams(nd), ...o.params };
                o.width = Math.min(nd.defaults.width, L - 0.1);
                o.height = nd.defaults.height;
                o.sill = nd.defaults.sill;
              })(d as Project),
            )
          }
        />
      </Section>
      <Section title="Size">
        <Row>
          <ModelNumber
            label="Width"
            short="W"
            value={opening.width}
            min={0.3}
            max={Math.max(0.3, L - 0.1)}
            mergeKey={`op-w-${opening.id}`}
            testId="opening-width"
            apply={(d, v) =>
              set((o) => {
                o.width = v;
                o.offset = Math.min(Math.max(o.offset, v / 2 + 0.05), L - v / 2 - 0.05);
              })(d as Project)
            }
          />
          <ModelNumber label="Height" short="H" value={opening.height} min={0.3} max={(wall?.height ?? level.height) - opening.sill} mergeKey={`op-h-${opening.id}`} apply={(d, v) => set((o) => void (o.height = v))(d as Project)} />
        </Row>
        <Row>
          {!isDoor && (
            <ModelNumber label="Sill height" short="Sill" value={opening.sill} min={0} max={(wall?.height ?? level.height) - opening.height} mergeKey={`op-s-${opening.id}`} apply={(d, v) => set((o) => void (o.sill = v))(d as Project)} />
          )}
          <ModelNumber
            label="From wall start"
            short="Pos"
            value={opening.offset - opening.width / 2}
            min={0.05}
            max={L - opening.width - 0.05}
            mergeKey={`op-o-${opening.id}`}
            apply={(d, v) => set((o) => void (o.offset = v + o.width / 2))(d as Project)}
          />
        </Row>
      </Section>
      {isDoor && (
        <Section title="Swing">
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary" icon={<FlipVertical2 className="h-3.5 w-3.5" />} onClick={() => mutate('Flip door', (d) => set((o) => void (o.flip = !o.flip))(d as Project))}>
              Flip side
            </Button>
            <Button size="sm" variant="secondary" icon={<FlipHorizontal2 className="h-3.5 w-3.5" />} onClick={() => mutate('Mirror hinge', (d) => set((o) => void (o.mirror = !o.mirror))(d as Project))}>
              Swap hinge
            </Button>
          </div>
        </Section>
      )}
      <Section>
        <More>
          <MaterialPicker label="Frame" category="fixture" value={opening.material ?? OPENING_SLOTS.frame!} onChange={(id) => mutate('Frame finish', (d) => set((o) => void (o.material = id))(d as Project))} />
          {(def?.params ?? []).map((p) =>
            p.type === 'number' ? (
              <ModelNumber
                key={p.key}
                label={p.label}
                kind="number"
                value={Number(opening.params[p.key] ?? p.default)}
                min={p.min}
                max={p.max}
                step={p.step ?? 1}
                mergeKey={`op-p-${opening.id}-${p.key}`}
                apply={(d, v) => set((o) => void (o.params[p.key] = Math.round(v)))(d as Project)}
              />
            ) : null,
          )}
        </More>
      </Section>
      <EntityActions locked={opening.locked} />
    </>
  );
}
