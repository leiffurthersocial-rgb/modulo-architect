'use client';
import {
  Grid2x2,
  AppWindow,
  DoorOpen,
  Footprints,
  LampFloor,
  MousePointer2,
  PenLine,
  Ruler,
  Square,
  SquareDashed,
} from 'lucide-react';
import { useEditor, MODE_TOOLS, type ToolId } from '@/store/editor';
import { useDocument } from '@/store/document';
import { IconButton } from '@/components/ui/Button';
import { runCommand, shortcutOf } from '@/features/commands/commands';

interface RailItem {
  key: string;
  tool: ToolId;
  label: string;
  icon: React.ReactNode;
  command: string;
  placeId?: string;
}

const ITEMS: RailItem[] = [
  { key: 'select', tool: 'select', label: 'Select', icon: <MousePointer2 />, command: 'tool.select' },
  { key: 'wall', tool: 'wall', label: 'Wall', icon: <PenLine />, command: 'tool.wall' },
  { key: 'room', tool: 'room', label: 'Room', icon: <SquareDashed />, command: 'tool.room' },
  { key: 'floor', tool: 'floor', label: 'Floor', icon: <Grid2x2 />, command: 'tool.floor' },
  { key: 'door', tool: 'opening', label: 'Door', icon: <DoorOpen />, command: 'tool.door', placeId: 'door' },
  {
    key: 'window',
    tool: 'opening',
    label: 'Window',
    icon: <AppWindow />,
    command: 'tool.window',
    placeId: 'window',
  },
  { key: 'stair', tool: 'stair', label: 'Stairs', icon: <Footprints />, command: 'tool.stair' },
  {
    key: 'place',
    tool: 'place',
    label: 'Place from catalog',
    icon: <LampFloor />,
    command: 'tool.furniture',
  },
  { key: 'measure', tool: 'measure', label: 'Measure', icon: <Ruler />, command: 'tool.measure' },
];

export function ToolRail() {
  const mode = useEditor((s) => s.mode);
  const tool = useEditor((s) => s.tool);
  const place = useEditor((s) => s.place);
  const readOnly = useDocument((s) => s.readOnly);
  const allowed = MODE_TOOLS[mode];
  const items = ITEMS.filter(
    (i) => allowed.includes(i.tool) && !(readOnly && i.tool !== 'select' && i.tool !== 'measure'),
  );
  if (items.length === 0) return null;
  return (
    <div
      role="toolbar"
      aria-label="Tools"
      aria-orientation="vertical"
      className="panel pointer-events-auto flex flex-col gap-0.5 p-1"
    >
      {items.map((it) => {
        const active =
          tool === it.tool &&
          (it.placeId
            ? place?.kind === 'opening' && place.id.startsWith(it.placeId)
            : !(it.tool === 'opening'));
        return (
          <IconButton
            key={it.key}
            label={it.label}
            shortcut={shortcutOf(it.command)}
            tooltipSide="right"
            active={active}
            data-testid={`tool-${it.key}`}
            onClick={() => runCommand(it.command)}
          >
            {it.icon}
          </IconButton>
        );
      })}
      <span className="sr-only">
        <Square />
      </span>
    </div>
  );
}
