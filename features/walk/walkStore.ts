'use client';
import { create } from 'zustand';

export interface WalkState {
  slow: boolean;
  locked: boolean;
  /** Touch joystick vector (-1..1), y forward. */
  joy: { x: number; y: number };
  /** Accumulated touch look delta (pixels), consumed each frame. */
  look: { x: number; y: number };
  levelName: string;
  set: (p: Partial<Omit<WalkState, 'set'>>) => void;
}

export const useWalk = create<WalkState>()((set) => ({
  slow: false,
  locked: false,
  joy: { x: 0, y: 0 },
  look: { x: 0, y: 0 },
  levelName: '',
  set: (p) => set(p),
}));
