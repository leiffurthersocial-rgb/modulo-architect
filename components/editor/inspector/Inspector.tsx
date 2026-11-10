'use client';
import { X } from 'lucide-react';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { findEntity, entityLabel } from '@/core/model/entities';
import { IconButton } from '@/components/ui/Button';
import { WallInspector } from './WallInspector';
import { RoomInspector } from './RoomInspector';
import { OpeningInspector } from './OpeningInspector';
import { ItemInspector } from './ItemInspector';
import { StairInspector } from './StairInspector';
import { RoofInspector } from './RoofInspector';
import { SiteInspector } from './SiteInspector';
import { MultiInspector } from './MultiInspector';
import { NodeInspector } from './NodeInspector';
import { SlabInspector } from './SlabInspector';
import { getElement, getOpening } from '@/registry';

/** Contextual inspector: appears only when something is selected. */
export function Inspector() {
  const selection = useEditor((s) => s.selection);
  const project = useDocument((s) => s.project);
  const readOnly = useDocument((s) => s.readOnly);
  if (selection.length === 0) return null;
  let title = '';
  let body: React.ReactNode = null;
  if (selection.length > 1) {
    title = `${selection.length} selected`;
    body = <MultiInspector ids={selection} />;
  } else if (selection[0] === 'site') {
    title = 'Site';
    body = <SiteInspector />;
  } else {
    const ref = findEntity(project, selection[0]!);
    if (!ref) return null;
    title = entityLabel(ref);
    switch (ref.kind) {
      case 'wall':
        body = <WallInspector wall={ref.entity} level={ref.level} />;
        break;
      case 'room':
        title = 'Room';
        body = <RoomInspector room={ref.entity} level={ref.level} />;
        break;
      case 'opening':
        title = getOpening(ref.entity.type)?.name ?? title;
        body = <OpeningInspector opening={ref.entity} level={ref.level} />;
        break;
      case 'item':
        title = ref.entity.name ?? getElement(ref.entity.type)?.name ?? 'Item';
        body = <ItemInspector item={ref.entity} level={ref.level} />;
        break;
      case 'stair':
        body = <StairInspector stair={ref.entity} level={ref.level} />;
        break;
      case 'roof':
        body = <RoofInspector roof={ref.entity} />;
        break;
      case 'slab':
        body = <SlabInspector slab={ref.entity} level={ref.level} />;
        break;
      case 'node':
        body = <NodeInspector node={ref.entity} level={ref.level} />;
        break;
      default:
        return null;
    }
  }
  return (
    <aside
      aria-label="Inspector"
      data-testid="inspector"
      className="panel animate-in pointer-events-auto flex max-h-full w-[280px] flex-col overflow-hidden"
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-line pl-4 pr-1.5">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <IconButton
          label="Close inspector"
          shortcut="esc"
          size="sm"
          onClick={() => useEditor.getState().clearSelection()}
        >
          <X />
        </IconButton>
      </header>
      <fieldset disabled={readOnly} className="min-w-0 scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {body}
      </fieldset>
    </aside>
  );
}
