'use client';
import {
  Box,
  Columns2,
  Download,
  Eye,
  PencilLine,
  Settings,
  FolderOpen,
  Footprints,
  Home,
  Keyboard,
  LayoutGrid,
  MoreHorizontal,
  PencilRuler,
  Redo2,
  Search,
  Share2,
  Sofa,
  Square,
  Trees,
  Undo2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu } from 'radix-ui';
import { useEffect, useState } from 'react';
import { useDocument } from '@/store/document';
import { useEditor, type Mode, type ViewKind } from '@/store/editor';
import { IconButton } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Tooltip } from '@/components/ui/Tooltip';
import { Kbd } from '@/components/ui/Kbd';
import { LogoMark } from '@/components/ui/Logo';
import { runCommand, shortcutOf } from '@/features/commands/commands';
import * as A from '@/store/actions';
import { toggleViewMode } from '@/store/viewMode';
import { cn } from '@/lib/cn';

const MODES: { value: Mode; label: string; icon: React.ReactNode }[] = [
  { value: 'plan', label: 'Plan', icon: <PencilRuler /> },
  { value: 'build', label: 'Build', icon: <Box /> },
  { value: 'furnish', label: 'Furnish', icon: <Sofa /> },
  { value: 'exterior', label: 'Exterior', icon: <Trees /> },
  { value: 'walk', label: 'Walk', icon: <Footprints /> },
];

function ProjectName() {
  const name = useDocument((s) => s.project.name);
  const readOnly = useDocument((s) => s.readOnly);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(name);
  useEffect(() => setText(name), [name]);
  if (editing && !readOnly)
    return (
      <input
        autoFocus
        aria-label="Project name"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (text.trim() && text !== name)
            useDocument.getState().mutate('Rename project', (d) => void (d.name = text.trim()));
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setText(name);
            setEditing(false);
          }
        }}
        className="h-7 w-44 rounded-md border border-accent bg-bg-elevated px-2 text-[13px] font-medium outline-none ring-2 ring-accent-soft"
      />
    );
  return (
    <button
      onClick={() => setEditing(true)}
      className="h-7 max-w-[120px] truncate xl:max-w-[200px] rounded-md px-2 text-[13px] font-medium hover:bg-hover"
      title="Rename project"
      data-testid="project-name"
    >
      {name}
    </button>
  );
}

function SavedIndicator() {
  const dirty = useDocument((s) => s.revision !== s.savedRevision);
  const readOnly = useDocument((s) => s.readOnly);
  if (readOnly)
    return (
      <span className="rounded-md bg-active px-1.5 py-0.5 text-[11px] font-medium text-fg-muted">
        View only
      </span>
    );
  return (
    <span
      aria-live="polite"
      className={cn(
        'text-[11px] text-fg-subtle transition-opacity duration-300',
        dirty ? 'opacity-60' : 'opacity-100',
      )}
      data-testid="saved-indicator"
    >
      {dirty ? 'Saving…' : 'Saved'}
    </span>
  );
}

export function TopBar() {
  const mode = useEditor((s) => s.mode);
  const view = useEditor((s) => s.view);
  const canUndo = useDocument((s) => s.history.past.length > 0);
  const canRedo = useDocument((s) => s.history.future.length > 0);
  const readOnly = useDocument((s) => s.readOnly);
  const showView = mode === 'plan' || mode === 'build' || mode === 'furnish' || mode === 'exterior';

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3">
      <div className="panel pointer-events-auto flex h-11 items-center gap-1 pl-1.5 pr-2">
        <Tooltip label="Home">
          <Link
            href="/"
            aria-label="Home"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] hover:bg-hover"
          >
            <LogoMark className="h-[22px] w-[22px]" />
          </Link>
        </Tooltip>
        <ProjectName />
        <SavedIndicator />
        <span className="mx-1 h-5 w-px bg-line" />
        <IconButton
          label="Undo"
          shortcut={shortcutOf('edit.undo')}
          disabled={!canUndo || readOnly}
          onClick={A.undo}
          data-testid="undo"
        >
          <Undo2 />
        </IconButton>
        <IconButton
          label="Redo"
          shortcut={shortcutOf('edit.redo')}
          disabled={!canRedo || readOnly}
          onClick={A.redo}
          data-testid="redo"
        >
          <Redo2 />
        </IconButton>
      </div>

      <nav
        aria-label="Modes"
        className="panel pointer-events-auto absolute left-1/2 top-3 flex h-11 -translate-x-1/2 items-center px-1"
      >
        <Segmented
          ariaLabel="Editor mode"
          value={mode}
          onChange={(m) => useEditor.getState().setMode(m)}
          className="bg-transparent"
          options={MODES.map((m, i) => ({
            value: m.value,
            label: <span className="hidden xl:inline">{m.label}</span>,
            icon: m.icon,
            tooltip: m.label,
            shortcut: String(i + 1),
          }))}
        />
      </nav>

      <div className="panel pointer-events-auto flex h-11 items-center gap-1 px-1.5">
        {showView && (
          <Segmented<ViewKind>
            ariaLabel="View"
            size="sm"
            value={view}
            onChange={(v) => useEditor.getState().setView(v)}
            options={[
              { value: '2d', label: '2D', tooltip: '2D plan', shortcut: 'shift+1' },
              { value: '3d', label: '3D', tooltip: '3D view', shortcut: 'shift+2' },
              {
                value: 'split',
                label: '',
                icon: <Columns2 />,
                tooltip: 'Split 2D / 3D',
                shortcut: 'shift+3',
              },
            ]}
          />
        )}
        <IconButton
          label={readOnly ? 'Leave view mode (edit)' : 'View mode (lock editing)'}
          shortcut={shortcutOf('mode.view')}
          active={readOnly}
          onClick={toggleViewMode}
          data-testid="view-mode-toggle"
        >
          <Eye />
        </IconButton>
        <IconButton
          label="Search commands"
          shortcut={shortcutOf('help.palette')}
          onClick={() => runCommand('help.palette')}
          data-testid="open-palette"
        >
          <Search />
        </IconButton>
        <IconButton label="Share view-only link" onClick={() => runCommand('project.share')}>
          <Share2 />
        </IconButton>
        <IconButton
          label="Settings"
          shortcut={shortcutOf('app.settings')}
          onClick={() => runCommand('app.settings')}
          data-testid="open-settings"
        >
          <Settings />
        </IconButton>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              aria-label="More"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-fg-muted hover:bg-hover hover:text-fg [&_svg]:h-[18px] [&_svg]:w-[18px]"
            >
              <MoreHorizontal />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="panel animate-in z-50 min-w-[220px] p-1"
            >
              <MenuItem
                icon={<LayoutGrid />}
                label="Projects…"
                shortcut={shortcutOf('project.list')}
                onSelect={() => runCommand('project.list')}
              />
              <MenuItem
                icon={<Download />}
                label="Export .modulo.json"
                shortcut={shortcutOf('project.export')}
                onSelect={() => runCommand('project.export')}
              />
              <MenuItem icon={<Upload />} label="Import…" onSelect={() => runCommand('project.import')} />
              <MenuItem
                icon={<FolderOpen />}
                label="New project"
                onSelect={() => runCommand('project.new')}
              />
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <MenuItem
                icon={<Square />}
                label="Toggle units (m / ft)"
                shortcut={shortcutOf('view.units')}
                onSelect={() => runCommand('view.units')}
              />
              <MenuItem icon={<Box />} label="Toggle dark theme" onSelect={() => runCommand('view.theme')} />
              <MenuItem
                icon={<Keyboard />}
                label="Keyboard shortcuts"
                shortcut="?"
                onSelect={() => runCommand('help.shortcuts')}
              />
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item asChild>
                <Link
                  href="/"
                  className="flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] outline-none data-[highlighted]:bg-hover [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-fg-subtle"
                >
                  <Home /> Back to start
                </Link>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {readOnly && (
        <div className="animate-in pointer-events-auto absolute left-1/2 top-[64px] -translate-x-1/2">
          <div
            className="flex items-center gap-2 rounded-full bg-fg py-1 pl-3 pr-1 text-xs font-medium text-bg shadow-pop"
            data-testid="view-mode-pill"
          >
            <Eye className="h-3.5 w-3.5" />
            Viewing · editing is locked
            <button
              onClick={toggleViewMode}
              className="flex h-6 items-center gap-1 rounded-full bg-bg/15 px-2.5 hover:bg-bg/25"
            >
              <PencilLine className="h-3 w-3" /> Edit
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-[13px] outline-none data-[highlighted]:bg-hover [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-fg-subtle"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {shortcut && <Kbd shortcut={shortcut} />}
    </DropdownMenu.Item>
  );
}
