'use client';
import type { ParamSpec, ParamValue } from '@/registry';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { LabeledRow } from '@/components/ui/Section';
import { ModelNumber, mutate } from './fields';
import type { Draft } from 'immer';
import type { Project } from '@/core/model/schema';

/** Renders registry-declared parameters, so new elements get an inspector for free. */
export function ParamFields({
  specs,
  values,
  idKey,
  write,
}: {
  specs: ParamSpec[];
  values: Record<string, ParamValue>;
  idKey: string;
  write: (d: Draft<Project>, key: string, v: ParamValue) => void;
}) {
  return (
    <>
      {specs.map((p) => {
        const v = values[p.key] ?? p.default;
        if (p.type === 'boolean')
          return (
            <LabeledRow key={p.key} label={p.label}>
              <Switch label={p.label} checked={Boolean(v)} onChange={(on) => mutate(`Set ${p.label.toLowerCase()}`, (d) => write(d, p.key, on))} />
            </LabeledRow>
          );
        if (p.type === 'select')
          return (
            <LabeledRow key={p.key} label={p.label}>
              <Select label={p.label} value={String(v)} options={p.options ?? []} onChange={(val) => mutate(`Set ${p.label.toLowerCase()}`, (d) => write(d, p.key, val))} />
            </LabeledRow>
          );
        return (
          <ModelNumber
            key={p.key}
            label={p.label}
            kind={p.type === 'length' ? 'length' : p.type === 'angle' ? 'angle' : 'number'}
            value={Number(v)}
            min={p.min}
            max={p.max}
            step={p.step}
            mergeKey={`param-${idKey}-${p.key}`}
            apply={(d, val) => write(d, p.key, p.type === 'number' && (p.step ?? 1) >= 1 ? Math.round(val) : val)}
          />
        );
      })}
    </>
  );
}
