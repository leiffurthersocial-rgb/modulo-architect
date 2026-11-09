'use client';
import { Magnet, Ruler } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEditor } from '@/store/editor';
import { useDocument } from '@/store/document';
import { useToolUI } from '@/features/tools/store';
import { getTool } from '@/features/tools';
import { formatLength } from '@/core/units/units';
import { runCommand } from '@/features/commands/commands';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';

export function StatusBar() {
  const tool = useEditor((s) => s.tool);
  const mode = useEditor((s) => s.mode);
  const cursor = useEditor((s) => s.cursor);
  const toast = useEditor((s) => s.toast);
  const selection = useEditor((s) => s.selection.length);
  const settings = useDocument((s) => s.project.settings);
  useToolUI((s) => s.tick);
  const [showToast, setShowToast] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  void selection;
  const hint = mode === 'walk' ? '' : getTool(tool).hint();
  return (
    <footer
      className="panel pointer-events-auto flex h-9 min-w-0 items-center gap-3 rounded-[12px] px-3 text-[12.5px]"
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          showToast && toast ? 'font-medium text-fg' : 'text-fg-muted',
        )}
        data-testid="status-hint"
      >
        {showToast && toast ? toast.text : hint}
      </span>
      {cursor && (
        <span className="tnum hidden shrink-0 text-fg-subtle md:inline" data-testid="cursor-pos">
          {formatLength(cursor.x, settings.units)}, {formatLength(cursor.y, settings.units)}
        </span>
      )}
      <span className="h-4 w-px bg-line" />
      <Tooltip
        label={settings.snapping ? 'Snapping on (hold Alt to bypass)' : 'Snapping off'}
        shortcut="shift+s"
        side="top"
      >
        <button
          aria-pressed={settings.snapping}
          aria-label="Toggle snapping"
          onClick={() => runCommand('view.snap')}
          className={cn(
            'flex h-6 items-center gap-1 rounded-md px-1.5 font-medium',
            settings.snapping ? 'text-accent' : 'text-fg-subtle hover:text-fg',
          )}
        >
          <Magnet className="h-3.5 w-3.5" /> Snap
        </button>
      </Tooltip>
      <Tooltip label="Dimension overlay" side="top">
        <button
          aria-pressed={settings.showDimensions}
          aria-label="Toggle dimensions"
          onClick={() => runCommand('view.dims')}
          className={cn(
            'flex h-6 items-center gap-1 rounded-md px-1.5 font-medium',
            settings.showDimensions ? 'text-accent' : 'text-fg-subtle hover:text-fg',
          )}
        >
          <Ruler className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
      <Tooltip label="Units" shortcut="u" side="top">
        <button
          aria-label="Toggle units"
          onClick={() => runCommand('view.units')}
          className="h-6 rounded-md px-1.5 font-medium text-fg-muted hover:bg-hover hover:text-fg"
          data-testid="units-toggle"
        >
          {settings.units === 'metric' ? 'm' : 'ft'}
        </button>
      </Tooltip>
    </footer>
  );
}
