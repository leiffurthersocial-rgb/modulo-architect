'use client';
import { useEditor, type Mode, type ToolId, type PlaceSpec } from '@/store/editor';
import { useDocument } from '@/store/document';
import * as A from '@/store/actions';
import { applyTheme, readTheme } from '@/lib/theme';
import { downloadProject, importProjectFile, newProjectFromTemplate } from '@/features/project/io';

/**
 * Every user action lives here once. The command palette, keyboard shortcuts, menus and the
 * shortcut sheet all read this list, so a shortcut can never drift from its tooltip.
 */
export interface Command {
  id: string;
  title: string;
  group: 'Modes' | 'Tools' | 'Edit' | 'Selection' | 'View' | 'Levels' | 'Build' | 'Project' | 'Help';
  /** e.g. "mod+shift+z", "w", "shift+digit2" */
  shortcut?: string;
  /** Extra shortcuts not shown in tooltips. */
  alt?: string[];
  keywords?: string;
  run: () => void;
  /** Hidden from the palette when false. */
  when?: () => boolean;
}

const E = () => useEditor.getState();
const D = () => useDocument.getState();
const editable = () => !D().readOnly;

function tool(id: ToolId, place: PlaceSpec | null = null) {
  return () => {
    const ed = E();
    if (ed.mode === 'walk') ed.setMode(ed.modeBeforeWalk);
    if (ed.mode === 'furnish' && (id === 'wall' || id === 'room' || id === 'opening' || id === 'stair'))
      ed.setMode('build');
    E().setTool(id, place);
  };
}

const mode = (m: Mode) => () => E().setMode(m);

export const COMMANDS: Command[] = [
  // Modes
  { id: 'mode.plan', title: 'Plan mode (2D)', group: 'Modes', shortcut: '1', run: mode('plan') },
  { id: 'mode.build', title: 'Build mode', group: 'Modes', shortcut: '2', run: mode('build') },
  { id: 'mode.furnish', title: 'Furnish mode', group: 'Modes', shortcut: '3', run: mode('furnish') },
  { id: 'mode.exterior', title: 'Exterior mode', group: 'Modes', shortcut: '4', run: mode('exterior') },
  {
    id: 'mode.walk',
    title: 'Walk through (first person)',
    group: 'Modes',
    shortcut: '5',
    keywords: 'guest visitor first person tour',
    run: mode('walk'),
  },

  // Tools
  { id: 'tool.select', title: 'Select', group: 'Tools', shortcut: 'v', run: tool('select') },
  { id: 'tool.wall', title: 'Draw walls', group: 'Tools', shortcut: 'w', when: editable, run: tool('wall') },
  {
    id: 'tool.room',
    title: 'Draw a room',
    group: 'Tools',
    shortcut: 'r',
    keywords: 'rectangle',
    when: editable,
    run: tool('room'),
  },
  {
    id: 'tool.door',
    title: 'Add a door',
    group: 'Tools',
    shortcut: 'd',
    when: editable,
    run: tool('opening', { kind: 'opening', id: 'door-single' }),
  },
  {
    id: 'tool.window',
    title: 'Add a window',
    group: 'Tools',
    shortcut: 'n',
    when: editable,
    run: tool('opening', { kind: 'opening', id: 'window-casement' }),
  },
  {
    id: 'tool.slider',
    title: 'Add a sliding door',
    group: 'Tools',
    keywords: 'patio glass',
    when: editable,
    run: tool('opening', { kind: 'opening', id: 'door-sliding' }),
  },
  {
    id: 'tool.stair',
    title: 'Add stairs',
    group: 'Tools',
    shortcut: 's',
    keywords: 'staircase steps',
    when: editable,
    run: tool('stair'),
  },
  {
    id: 'tool.stair-l',
    title: 'Add L-shaped stairs',
    group: 'Tools',
    when: editable,
    run: tool('stair', { kind: 'element', id: 'l-shaped' }),
  },
  {
    id: 'tool.furniture',
    title: 'Furniture catalog',
    group: 'Tools',
    shortcut: 'f',
    run: () => {
      if (E().mode !== 'furnish') E().setMode('furnish');
      E().set({ catalogOpen: true });
      setTimeout(() => document.querySelector<HTMLInputElement>('[data-catalog-search]')?.focus(), 30);
    },
  },
  {
    id: 'tool.measure',
    title: 'Measure distance',
    group: 'Tools',
    shortcut: 'm',
    keywords: 'ruler tape',
    run: tool('measure'),
  },
  { id: 'tool.pan', title: 'Pan', group: 'Tools', shortcut: 'space', run: () => {}, when: () => false },

  // Build
  ...(['bedroom', 'bathroom', 'kitchen', 'living', 'office', 'hallway'] as const).map((t) => ({
    id: `room.${t}`,
    title: `Add ${t === 'living' ? 'living room' : t}`,
    group: 'Build' as const,
    keywords: 'template room quick',
    when: editable,
    run: tool('room', { kind: 'room-template', id: t }),
  })),
  {
    id: 'roof.gable',
    title: 'Add gable roof',
    group: 'Build',
    when: editable,
    run: () => A.addRoof('gable'),
  },
  { id: 'roof.hip', title: 'Add hip roof', group: 'Build', when: editable, run: () => A.addRoof('hip') },
  { id: 'roof.shed', title: 'Add shed roof', group: 'Build', when: editable, run: () => A.addRoof('shed') },
  { id: 'roof.flat', title: 'Add flat roof', group: 'Build', when: editable, run: () => A.addRoof('flat') },

  // Levels
  {
    id: 'level.add',
    title: 'Add level above',
    group: 'Levels',
    keywords: 'floor storey',
    when: editable,
    run: () => A.addLevel(false),
  },
  {
    id: 'level.add-copy',
    title: 'Add level with the same walls',
    group: 'Levels',
    keywords: 'floor storey duplicate',
    when: editable,
    run: () => A.addLevel(true),
  },
  { id: 'level.up', title: 'Go up a level', group: 'Levels', shortcut: 'pageup', run: () => stepLevel(1) },
  {
    id: 'level.down',
    title: 'Go down a level',
    group: 'Levels',
    shortcut: 'pagedown',
    run: () => stepLevel(-1),
  },
  { id: 'level.show-all', title: 'Levels: show all', group: 'Levels', run: () => E().setLevelDisplay('all') },
  {
    id: 'level.ghost',
    title: 'Levels: ghost others',
    group: 'Levels',
    run: () => E().setLevelDisplay('ghost'),
  },
  {
    id: 'level.isolate',
    title: 'Levels: isolate current',
    group: 'Levels',
    run: () => E().setLevelDisplay('isolate'),
  },

  // Edit
  { id: 'edit.undo', title: 'Undo', group: 'Edit', shortcut: 'mod+z', run: A.undo },
  { id: 'edit.redo', title: 'Redo', group: 'Edit', shortcut: 'mod+shift+z', alt: ['mod+y'], run: A.redo },
  {
    id: 'edit.delete',
    title: 'Delete selection',
    group: 'Edit',
    shortcut: 'delete',
    alt: ['backspace'],
    when: editable,
    run: A.deleteSelection,
  },
  { id: 'edit.copy', title: 'Copy', group: 'Edit', shortcut: 'mod+c', run: () => void A.copySelection() },
  { id: 'edit.cut', title: 'Cut', group: 'Edit', shortcut: 'mod+x', when: editable, run: A.cutSelection },
  {
    id: 'edit.paste',
    title: 'Paste',
    group: 'Edit',
    shortcut: 'mod+v',
    when: editable,
    run: () => A.paste(),
  },
  {
    id: 'edit.duplicate',
    title: 'Duplicate',
    group: 'Edit',
    shortcut: 'mod+d',
    when: editable,
    run: A.duplicateSelection,
  },
  {
    id: 'edit.rotate-cw',
    title: 'Rotate selection 15°',
    group: 'Edit',
    shortcut: ']',
    when: editable,
    run: () => void A.rotateSelection(Math.PI / 12),
  },
  {
    id: 'edit.rotate-ccw',
    title: 'Rotate selection −15°',
    group: 'Edit',
    shortcut: '[',
    when: editable,
    run: () => void A.rotateSelection(-Math.PI / 12),
  },
  {
    id: 'edit.lock',
    title: 'Lock / unlock selection',
    group: 'Edit',
    shortcut: 'mod+shift+l',
    when: editable,
    run: () => A.toggleFlag('locked'),
  },
  {
    id: 'edit.hide',
    title: 'Hide selection',
    group: 'Edit',
    shortcut: 'h',
    when: editable,
    run: () => A.toggleFlag('hidden'),
  },
  {
    id: 'edit.show-all',
    title: 'Show all hidden objects',
    group: 'Edit',
    shortcut: 'shift+h',
    when: editable,
    run: A.showAllHidden,
  },

  // Selection
  { id: 'sel.all', title: 'Select all', group: 'Selection', shortcut: 'mod+a', run: A.selectAll },
  { id: 'sel.none', title: 'Deselect', group: 'Selection', shortcut: 'esc', run: () => E().clearSelection() },
  {
    id: 'sel.in-room',
    title: 'Select everything in room',
    group: 'Selection',
    keywords: 'contents',
    run: () => A.selectAllInRoom(),
  },
  {
    id: 'sel.align-left',
    title: 'Align left',
    group: 'Selection',
    when: editable,
    run: () => A.alignSelection('left'),
  },
  {
    id: 'sel.align-right',
    title: 'Align right',
    group: 'Selection',
    when: editable,
    run: () => A.alignSelection('right'),
  },
  {
    id: 'sel.align-top',
    title: 'Align top',
    group: 'Selection',
    when: editable,
    run: () => A.alignSelection('top'),
  },
  {
    id: 'sel.align-bottom',
    title: 'Align bottom',
    group: 'Selection',
    when: editable,
    run: () => A.alignSelection('bottom'),
  },
  {
    id: 'sel.align-cx',
    title: 'Align centres horizontally',
    group: 'Selection',
    when: editable,
    run: () => A.alignSelection('center-x'),
  },
  {
    id: 'sel.align-cy',
    title: 'Align centres vertically',
    group: 'Selection',
    when: editable,
    run: () => A.alignSelection('center-y'),
  },
  {
    id: 'sel.dist-x',
    title: 'Distribute horizontally',
    group: 'Selection',
    when: editable,
    run: () => A.alignSelection('distribute-x'),
  },
  {
    id: 'sel.dist-y',
    title: 'Distribute vertically',
    group: 'Selection',
    when: editable,
    run: () => A.alignSelection('distribute-y'),
  },

  // View
  {
    id: 'view.2d',
    title: 'View: 2D plan',
    group: 'View',
    shortcut: 'shift+digit1',
    run: () => E().setView('2d'),
  },
  { id: 'view.3d', title: 'View: 3D', group: 'View', shortcut: 'shift+digit2', run: () => E().setView('3d') },
  {
    id: 'view.split',
    title: 'View: split 2D / 3D',
    group: 'View',
    shortcut: 'shift+digit3',
    run: () => E().setView('split'),
  },
  {
    id: 'view.focus',
    title: 'Zoom to selection / fit',
    group: 'View',
    shortcut: 'z',
    run: () => {
      A.focusSelection();
      E().set({ planFit: Date.now() });
    },
  },
  { id: 'view.top', title: 'Camera: top', group: 'View', run: () => E().requestCamera({ preset: 'top' }) },
  {
    id: 'view.front',
    title: 'Camera: front',
    group: 'View',
    run: () => E().requestCamera({ preset: 'front' }),
  },
  {
    id: 'view.iso',
    title: 'Camera: isometric',
    group: 'View',
    run: () => E().requestCamera({ preset: 'iso' }),
  },
  {
    id: 'view.ui',
    title: 'Hide / show interface',
    group: 'View',
    shortcut: 'tab',
    run: () => E().set({ uiHidden: !E().uiHidden }),
  },
  {
    id: 'view.dims',
    title: 'Toggle dimension overlay',
    group: 'View',
    keywords: 'measurements lengths',
    run: () =>
      D().mutate('Toggle dimensions', (d) => void (d.settings.showDimensions = !d.settings.showDimensions)),
  },
  {
    id: 'view.snap',
    title: 'Toggle snapping',
    group: 'View',
    shortcut: 'shift+s',
    keywords: 'grid magnet',
    run: () => {
      D().mutate('Toggle snapping', (d) => void (d.settings.snapping = !d.settings.snapping));
      E().notify(
        D().project.settings.snapping ? 'Snapping on' : 'Snapping off (hold Alt to bypass temporarily)',
      );
    },
  },
  {
    id: 'view.units',
    title: 'Toggle metric / imperial',
    group: 'View',
    shortcut: 'u',
    keywords: 'feet inches meters units',
    run: () =>
      D().mutate(
        'Switch units',
        (d) => void (d.settings.units = d.settings.units === 'metric' ? 'imperial' : 'metric'),
      ),
  },
  {
    id: 'view.theme',
    title: 'Toggle dark theme',
    group: 'View',
    keywords: 'dark light appearance',
    run: () => {
      const t = readTheme();
      const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      applyTheme(dark ? 'light' : 'dark');
    },
  },

  // Project
  {
    id: 'project.list',
    title: 'Projects…',
    group: 'Project',
    shortcut: 'mod+o',
    keywords: 'open recent',
    run: () => E().set({ projectsOpen: true }),
  },
  {
    id: 'project.new',
    title: 'New project',
    group: 'Project',
    keywords: 'blank empty',
    run: () => newProjectFromTemplate('empty'),
  },
  {
    id: 'project.export',
    title: 'Export .modulo.json',
    group: 'Project',
    shortcut: 'mod+s',
    keywords: 'save download',
    run: () => downloadProject(D().project),
  },
  {
    id: 'project.import',
    title: 'Import .modulo.json…',
    group: 'Project',
    keywords: 'open upload file',
    run: importProjectFile,
  },
  {
    id: 'project.share',
    title: 'Share view-only link…',
    group: 'Project',
    keywords: 'guest walk link url',
    run: () => E().set({ shareOpen: true }),
  },

  // Help
  {
    id: 'help.palette',
    title: 'Command palette',
    group: 'Help',
    shortcut: 'mod+k',
    run: () => E().set({ paletteOpen: true }),
  },
  {
    id: 'help.shortcuts',
    title: 'Keyboard shortcuts',
    group: 'Help',
    shortcut: '?',
    run: () => E().set({ shortcutsOpen: true }),
  },
  {
    id: 'help.tour',
    title: 'Show the quick tour again',
    group: 'Help',
    run: () => {
      try {
        localStorage.removeItem('modulo:onboarded');
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('modulo:tour'));
    },
  },
];

function stepLevel(dir: number) {
  const levels = D().project.building.levels;
  const i = levels.findIndex((l) => l.id === E().activeLevelId);
  const next = levels[Math.max(0, Math.min(levels.length - 1, (i < 0 ? 0 : i) + dir))];
  if (next) E().setActiveLevel(next.id);
}

export const commandById = (id: string) => COMMANDS.find((c) => c.id === id);
export const shortcutOf = (id: string) => commandById(id)?.shortcut;
export const runCommand = (id: string) => commandById(id)?.run();
