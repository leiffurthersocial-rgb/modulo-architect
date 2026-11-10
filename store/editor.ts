'use client';
import { create } from 'zustand';
import type { Vec2 } from '@/core/geometry/vec2';

export type Mode = 'plan' | 'build' | 'furnish' | 'exterior' | 'walk';
export type ViewKind = '2d' | '3d' | 'split';
export type LevelDisplay = 'all' | 'isolate' | 'ghost';
export type CameraPreset = 'top' | 'front' | 'iso' | 'fit';

export type ToolId = 'select' | 'wall' | 'room' | 'floor' | 'opening' | 'stair' | 'place' | 'measure' | 'pan';

export interface PlaceSpec {
  kind: 'element' | 'opening' | 'room-template';
  id: string;
  /** True while dragging from the catalog (release places). */
  dragging?: boolean;
}

export interface CameraRequest {
  preset?: CameraPreset;
  focus?: { center: [number, number, number]; radius: number };
  nonce: number;
}

export interface EditorState {
  mode: Mode;
  view: ViewKind;
  tool: ToolId;
  place: PlaceSpec | null;
  activeLevelId: string | null;
  levelDisplay: LevelDisplay;
  selection: string[];
  hover: string | null;
  uiHidden: boolean;
  inspectorOpen: boolean;
  catalogOpen: boolean;
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  projectsOpen: boolean;
  shareOpen: boolean;
  settingsOpen: boolean;
  camera: CameraRequest | null;
  /** Live cursor position on the active level (plan space), for the status bar. */
  cursor: Vec2 | null;
  /** Transient message shown in the status bar ("Copied 3 items"). */
  toast: { text: string; nonce: number } | null;
  /** A 2D plan-view zoom request. */
  planFit: number;
  /** Walk-mode return target. */
  modeBeforeWalk: Mode;

  setMode: (m: Mode) => void;
  setView: (v: ViewKind) => void;
  setTool: (t: ToolId, place?: PlaceSpec | null) => void;
  setActiveLevel: (id: string) => void;
  setLevelDisplay: (d: LevelDisplay) => void;
  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setHover: (id: string | null) => void;
  requestCamera: (r: Omit<CameraRequest, 'nonce'>) => void;
  setCursor: (p: Vec2 | null) => void;
  notify: (text: string) => void;
  set: (patch: Partial<EditorState>) => void;
}

/** Tools offered by each mode (the rail shows these). */
export const MODE_TOOLS: Record<Mode, ToolId[]> = {
  plan: ['select', 'wall', 'room', 'floor', 'opening', 'stair', 'measure'],
  build: ['select', 'wall', 'room', 'floor', 'opening', 'stair', 'measure'],
  furnish: ['select', 'place', 'measure'],
  exterior: ['select', 'place', 'measure'],
  walk: [],
};

export const useEditor = create<EditorState>()((set) => ({
  mode: 'build',
  view: '3d',
  tool: 'select',
  place: null,
  activeLevelId: null,
  levelDisplay: 'ghost',
  selection: [],
  hover: null,
  uiHidden: false,
  inspectorOpen: true,
  catalogOpen: true,
  paletteOpen: false,
  shortcutsOpen: false,
  projectsOpen: false,
  shareOpen: false,
  settingsOpen: false,
  camera: null,
  cursor: null,
  toast: null,
  planFit: 0,
  modeBeforeWalk: 'build',

  setMode: (mode) =>
    set((s) => {
      if (mode === s.mode) return {};
      const patch: Partial<EditorState> = { mode, tool: 'select', place: null };
      if (mode === 'walk') patch.modeBeforeWalk = s.mode;
      if (mode === 'plan') patch.view = '2d';
      else if (
        (mode === 'furnish' || mode === 'exterior' || mode === 'build') &&
        s.view === '2d' &&
        s.mode === 'plan'
      )
        patch.view = '3d';
      // Keep selection when it still makes sense; furnish/exterior focus on items.
      return patch;
    }),
  setView: (view) => set({ view }),
  setTool: (tool, place = null) => set({ tool, place }),
  setActiveLevel: (activeLevelId) => set({ activeLevelId, selection: [] }),
  setLevelDisplay: (levelDisplay) => set({ levelDisplay }),
  select: (selection) => set({ selection }),
  toggleSelect: (id) =>
    set((s) => ({
      selection: s.selection.includes(id) ? s.selection.filter((x) => x !== id) : [...s.selection, id],
    })),
  clearSelection: () => set({ selection: [] }),
  setHover: (hover) => set((s) => (s.hover === hover ? {} : { hover })),
  requestCamera: (r) => set({ camera: { ...r, nonce: Date.now() + Math.random() } }),
  setCursor: (cursor) => set({ cursor }),
  notify: (text) => set({ toast: { text, nonce: Date.now() } }),
  set: (patch) => set(patch),
}));
