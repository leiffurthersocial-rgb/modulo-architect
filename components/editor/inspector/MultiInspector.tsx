'use client';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
} from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { IconButton } from '@/components/ui/Button';
import { EntityActions } from './common';
import * as A from '@/store/actions';
import { kindOf } from '@/core/model/entities';

export function MultiInspector({ ids }: { ids: string[] }) {
  const counts = ids.reduce<Record<string, number>>((m, id) => {
    const k = kindOf(id) ?? 'other';
    m[k] = (m[k] ?? 0) + 1;
    return m;
  }, {});
  const label: Record<string, string> = { item: 'items', wall: 'walls', opening: 'openings', stair: 'stairs', room: 'rooms', node: 'corners' };
  return (
    <>
      <Section title="Selection">
        <p className="text-[13px] text-fg-muted">
          {Object.entries(counts)
            .map(([k, n]) => `${n} ${label[k] ?? k}`)
            .join(' · ')}
        </p>
      </Section>
      <Section title="Align & distribute">
        <div className="flex flex-wrap gap-0.5">
          <IconButton label="Align left" onClick={() => A.alignSelection('left')}>
            <AlignStartVertical />
          </IconButton>
          <IconButton label="Align centres (x)" onClick={() => A.alignSelection('center-x')}>
            <AlignCenterVertical />
          </IconButton>
          <IconButton label="Align right" onClick={() => A.alignSelection('right')}>
            <AlignEndVertical />
          </IconButton>
          <IconButton label="Align top" onClick={() => A.alignSelection('top')}>
            <AlignStartHorizontal />
          </IconButton>
          <IconButton label="Align centres (y)" onClick={() => A.alignSelection('center-y')}>
            <AlignCenterHorizontal />
          </IconButton>
          <IconButton label="Align bottom" onClick={() => A.alignSelection('bottom')}>
            <AlignEndHorizontal />
          </IconButton>
          <IconButton label="Distribute horizontally" onClick={() => A.alignSelection('distribute-x')}>
            <AlignHorizontalDistributeCenter />
          </IconButton>
          <IconButton label="Distribute vertically" onClick={() => A.alignSelection('distribute-y')}>
            <AlignVerticalDistributeCenter />
          </IconButton>
        </div>
        <p className="text-xs text-fg-subtle">Drag any selected object to move the group as one undo step.</p>
      </Section>
      <EntityActions duplicate />
    </>
  );
}
