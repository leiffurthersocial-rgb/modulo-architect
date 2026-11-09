'use client';
import { create } from 'zustand';
import type { Vec2 } from '@/core/geometry/vec2';
import type { Ghost, Overlay } from './types';

export interface ToolUIState {
  overlay: Overlay[];
  ghost: Ghost | null;
  /** Small floating "snap type" chip. */
  snap: { label: string; p: Vec2 } | null;
  /** Typed numeric entry while drawing ("3.5" ↵). */
  input: { label: string; text: string; p: Vec2 } | null;
  cursor: string;
  /** Bumps whenever the tool's hint may have changed. */
  tick: number;
  /** Live tooltip next to the cursor during drags. */
  tip: { text: string; p: Vec2 } | null;
  set: (patch: Partial<Omit<ToolUIState, 'set' | 'reset'>>) => void;
  reset: () => void;
}

export const useToolUI = create<ToolUIState>()((set) => ({
  overlay: [],
  ghost: null,
  snap: null,
  input: null,
  cursor: 'default',
  tick: 0,
  tip: null,
  set: (patch) => set((s) => ({ ...patch, tick: s.tick + 1 })),
  reset: () => set((s) => ({ overlay: [], ghost: null, snap: null, input: null, tip: null, cursor: 'default', tick: s.tick + 1 })),
}));

export const toolUI = () => useToolUI.getState();
