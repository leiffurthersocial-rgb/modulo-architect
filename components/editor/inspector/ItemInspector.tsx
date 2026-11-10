'use client';
import { AlertTriangle, Link2, Link2Off } from 'lucide-react';
import { useState } from 'react';
import type { Item, Level, Project } from '@/core/model/schema';
import { Section, Row, More } from '@/components/ui/Section';
import { MaterialPicker } from '@/components/ui/MaterialPicker';
import { TextField } from '@/components/ui/TextField';
import { IconButton } from '@/components/ui/Button';
import { ModelNumber, mutate } from './fields';
import { EntityActions } from './common';
import { ParamFields } from './ParamFields';
import { getElement } from '@/registry';
import { findEntity } from '@/core/model/entities';
import { itemIssues } from '@/core/model/footprint';
import { useDocument } from '@/store/document';

export function ItemInspector({ item, level }: { item: Item; level: Level | null }) {
  const project = useDocument((s) => s.project);
  const def = getElement(item.type);
  const [linked, setLinked] = useState(false);
  if (!def) return null;
  const set = (fn: (i: Item) => void) => (d: Project) => {
    const ref = findEntity(d, item.id);
    if (ref?.kind === 'item') fn(ref.entity);
  };
  const rs = def.resizable ?? {};
  const issues = itemIssues(level, level ? level.items : project.exterior.items, item);
  const sizeField = (axis: 'w' | 'd' | 'h', label: string, short: string) => (
    <ModelNumber
      label={label}
      short={short}
      value={item.size[axis]}
      min={def.minSize?.[axis] ?? 0.05}
      max={60}
      disabled={rs[axis] === false || item.locked}
      mergeKey={`item-${axis}-${item.id}`}
      testId={`item-${axis}`}
      apply={(d, v) =>
        set((i) => {
          const k = v / i.size[axis];
          i.size[axis] = v;
          if (linked)
            for (const o of ['w', 'd', 'h'] as const)
              if (o !== axis && rs[o] !== false) i.size[o] = Math.max(0.05, i.size[o] * k);
        })(d as Project)
      }
    />
  );
  return (
    <>
      {issues.length > 0 && (
        <div
          role="status"
          className="mx-3 mt-3 flex items-start gap-2 rounded-[10px] bg-danger-soft px-3 py-2 text-[12.5px] text-danger"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {issues.some((i) => i.kind === 'blocks-door')
              ? 'This blocks a door swing.'
              : 'This overlaps another item.'}{' '}
            Move it or press Z to look.
          </span>
        </div>
      )}
      <Section
        title="Size"
        action={
          <IconButton
            label={linked ? 'Unlink proportions' : 'Scale proportionally'}
            size="sm"
            active={linked}
            onClick={() => setLinked(!linked)}
          >
            {linked ? <Link2 /> : <Link2Off />}
          </IconButton>
        }
      >
        <Row>
          {sizeField('w', 'Width', 'W')}
          {sizeField('d', 'Depth', 'D')}
        </Row>
        <Row>
          {sizeField('h', 'Height', 'H')}
          <ModelNumber
            label="Rotation"
            short="R"
            kind="angle"
            value={-item.rotation}
            disabled={item.locked}
            step={Math.PI / 180}
            mergeKey={`item-r-${item.id}`}
            apply={(d, v) => set((i) => void (i.rotation = -v))(d as Project)}
          />
        </Row>
      </Section>
      <Section title="Position">
        <Row>
          <ModelNumber
            label="X"
            value={item.x}
            disabled={item.locked}
            mergeKey={`item-x-${item.id}`}
            apply={(d, v) => set((i) => void (i.x = v))(d as Project)}
          />
          <ModelNumber
            label="Y"
            value={item.y}
            disabled={item.locked}
            mergeKey={`item-y-${item.id}`}
            apply={(d, v) => set((i) => void (i.y = v))(d as Project)}
          />
        </Row>
        <ModelNumber
          label="Elevation"
          value={item.z}
          min={-2}
          max={20}
          disabled={item.locked}
          mergeKey={`item-z-${item.id}`}
          apply={(d, v) => set((i) => void (i.z = v))(d as Project)}
        />
      </Section>
      {Object.keys(def.slots).length > 0 && (
        <Section title="Materials">
          {Object.entries(def.slots).map(([slot, s]) => (
            <MaterialPicker
              key={slot}
              label={s.label}
              category={s.category}
              value={item.materials[slot] ?? s.default}
              onChange={(id) =>
                mutate(`${s.label} finish`, (d) => set((i) => void (i.materials[slot] = id))(d as Project))
              }
            />
          ))}
        </Section>
      )}
      {(def.params?.length ?? 0) > 0 && (
        <Section title="Options">
          <ParamFields
            specs={(def.params ?? []).filter((p) => !p.advanced)}
            values={item.params}
            idKey={item.id}
            write={(d, key, v) => set((i) => void (i.params[key] = v))(d as Project)}
          />
          {(def.params ?? []).some((p) => p.advanced) && (
            <More>
              <ParamFields
                specs={(def.params ?? []).filter((p) => p.advanced)}
                values={item.params}
                idKey={item.id}
                write={(d, key, v) => set((i) => void (i.params[key] = v))(d as Project)}
              />
            </More>
          )}
        </Section>
      )}
      <Section>
        <More>
          {def.source && (
            <a
              href={def.source}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-accent hover:underline"
            >
              3D model: Poly Haven (CC0)
            </a>
          )}
          <TextField
            label="Custom name"
            value={item.name ?? def.name}
            onChange={(v) =>
              mutate('Rename', (d) =>
                set((i) => void (i.name = v === def.name ? undefined : v))(d as Project),
              )
            }
          />
        </More>
      </Section>
      <EntityActions locked={item.locked} duplicate />
    </>
  );
}
