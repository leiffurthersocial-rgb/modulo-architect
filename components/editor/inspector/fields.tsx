'use client';
import type { Draft } from 'immer';
import { NumberField } from '@/components/ui/NumberField';
import { useDocument } from '@/store/document';
import type { Project } from '@/core/model/schema';
import type { ValueKind } from '@/core/units/units';

/** A NumberField bound to the document: typed edits = one undo step, nudges merge, scrubs group. */
export function ModelNumber({
  label,
  short,
  value,
  kind = 'length',
  min,
  max,
  step,
  disabled,
  mergeKey,
  apply,
  testId,
}: {
  label: string;
  short?: string;
  value: number;
  kind?: ValueKind;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  mergeKey: string;
  apply: (d: Draft<Project>, v: number) => void;
  testId?: string;
}) {
  const units = useDocument((s) => s.project.settings.units);
  const readOnly = useDocument((s) => s.readOnly);
  const doc = useDocument.getState;
  return (
    <NumberField
      label={label}
      short={short}
      value={value}
      kind={kind}
      units={units}
      min={min}
      max={max}
      step={step}
      disabled={disabled || readOnly}
      testId={testId}
      onChange={(v, source) =>
        doc().mutate(
          `Set ${label.toLowerCase()}`,
          (d) => apply(d, v),
          source === 'nudge' ? { mergeKey } : undefined,
        )
      }
      onScrubStart={() => doc().begin(`Set ${label.toLowerCase()}`)}
      onScrubEnd={() => doc().commit()}
    />
  );
}

export function mutate(label: string, recipe: (d: Draft<Project>) => void) {
  useDocument.getState().mutate(label, recipe);
}
