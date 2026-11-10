'use client';
import { Box, Maximize, PanelTop, RectangleHorizontal } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { LightButton } from './LightPanel';
import { useEditor } from '@/store/editor';
import { runCommand, shortcutOf } from '@/features/commands/commands';

export function ViewControls() {
  const view = useEditor((s) => s.view);
  const mode = useEditor((s) => s.mode);
  if (mode === 'walk') return null;
  const has3d = view !== '2d';
  return (
    <div
      className="panel pointer-events-auto flex items-center gap-0.5 p-1"
      role="toolbar"
      aria-label="Camera"
    >
      <LightButton />
      {has3d && (
        <>
          <IconButton label="Top view" size="sm" tooltipSide="top" onClick={() => runCommand('view.top')}>
            <PanelTop />
          </IconButton>
          <IconButton label="Front view" size="sm" tooltipSide="top" onClick={() => runCommand('view.front')}>
            <RectangleHorizontal />
          </IconButton>
          <IconButton
            label="Isometric view"
            size="sm"
            tooltipSide="top"
            onClick={() => runCommand('view.iso')}
          >
            <Box />
          </IconButton>
        </>
      )}
      <IconButton
        label="Zoom to fit / selection"
        shortcut={shortcutOf('view.focus')}
        size="sm"
        tooltipSide="top"
        onClick={() => runCommand('view.focus')}
      >
        <Maximize />
      </IconButton>
    </div>
  );
}
