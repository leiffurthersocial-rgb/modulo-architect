'use client';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { useEditor, type LevelDisplay } from '@/store/editor';
import { useDocument } from '@/store/document';
import { Segmented } from '@/components/ui/Segmented';
import { IconButton } from '@/components/ui/Button';
import { ModelNumber } from './inspector/fields';
import { TextField } from '@/components/ui/TextField';
import { DropdownMenu } from 'radix-ui';
import * as A from '@/store/actions';
import * as ops from '@/core/model/ops';
import type { Project } from '@/core/model/schema';
import { formatLength } from '@/core/units/units';
import { cn } from '@/lib/cn';

/** Levels: switch, add/remove, and — prominently — the floor height of the active level. */
export function LevelSwitcher() {
  const levels = useDocument((s) => s.project.building.levels);
  const units = useDocument((s) => s.project.settings.units);
  const readOnly = useDocument((s) => s.readOnly);
  const activeId = useEditor((s) => s.activeLevelId);
  const display = useEditor((s) => s.levelDisplay);
  const mode = useEditor((s) => s.mode);
  const active = levels.find((l) => l.id === activeId) ?? levels[0]!;
  if (mode === 'walk') return null;
  return (
    <div
      className="panel pointer-events-auto flex w-[268px] flex-col gap-2 p-2"
      aria-label="Levels"
      data-testid="levels"
    >
      <div className="flex items-center gap-1">
        <Layers className="ml-1 h-4 w-4 text-fg-subtle" />
        <div className="flex min-w-0 flex-1 flex-wrap gap-0.5" role="tablist" aria-label="Level">
          {[...levels].reverse().map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={l.id === active.id}
              onClick={() => useEditor.getState().setActiveLevel(l.id)}
              data-testid={`level-tab-${levels.indexOf(l)}`}
              className={cn(
                'h-7 rounded-[8px] px-2 text-xs font-medium transition-colors',
                l.id === active.id ? 'bg-fg text-bg' : 'text-fg-muted hover:bg-hover hover:text-fg',
              )}
              title={`${l.name} · +${formatLength(l.elevation, units)}`}
            >
              {levels.indexOf(l) === 0 ? 'G' : levels.indexOf(l)}
            </button>
          ))}
        </div>
        {!readOnly && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                aria-label="Add level"
                data-testid="add-level"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-fg-muted hover:bg-hover hover:text-fg"
              >
                <Plus className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="top"
                align="end"
                sideOffset={6}
                className="panel animate-in z-50 min-w-[220px] p-1"
              >
                <DropdownMenu.Item
                  onSelect={() => A.addLevel(true)}
                  className="flex h-8 items-center rounded-md px-2 text-[13px] outline-none data-[highlighted]:bg-hover"
                  data-testid="add-level-copy"
                >
                  New level with the same walls
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => A.addLevel(false)}
                  className="flex h-8 items-center rounded-md px-2 text-[13px] outline-none data-[highlighted]:bg-hover"
                  data-testid="add-level-empty"
                >
                  Empty level
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
      <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <TextField
            label="Level name"
            value={active.name}
            className="h-7 flex-1 text-xs"
            onChange={(v) =>
              useDocument
                .getState()
                .mutate(
                  'Rename level',
                  (d) => void (d.building.levels.find((l) => l.id === active.id)!.name = v),
                )
            }
          />
          {!readOnly && levels.length > 1 && (
            <IconButton label="Remove this level" size="sm" onClick={() => A.removeLevel(active.id)}>
              <Trash2 />
            </IconButton>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ModelNumber
            label="Floor height"
            short="Height"
            value={active.height}
            min={1.8}
            max={8}
            mergeKey={`lvl-h-${active.id}`}
            testId="floor-height"
            apply={(d, v) => ops.setLevelHeight(d as Project, active.id, v)}
          />
          <ModelNumber
            label="Floor thickness"
            short="Slab"
            value={active.floorThickness}
            min={0.05}
            max={1}
            mergeKey={`lvl-t-${active.id}`}
            apply={(d, v) => void (d.building.levels.find((l) => l.id === active.id)!.floorThickness = v)}
          />
        </div>
      </fieldset>
      <Segmented<LevelDisplay>
        ariaLabel="Other levels"
        size="sm"
        value={display}
        onChange={(v) => useEditor.getState().setLevelDisplay(v)}
        className="w-full [&>button]:flex-1"
        options={[
          { value: 'ghost', label: 'Ghost', tooltip: 'Show levels above as ghosts' },
          { value: 'isolate', label: 'Isolate', tooltip: 'Only this level' },
          { value: 'all', label: 'All', tooltip: 'Show everything, including the roof' },
        ]}
      />
    </div>
  );
}
