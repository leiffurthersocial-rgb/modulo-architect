'use client';
import { create } from 'zustand';

/** 2D view transform: centre (plan meters) and scale (screen px per meter). */
export interface PlanViewState {
  cx: number;
  cy: number;
  scale: number;
  set: (p: Partial<Pick<PlanViewState, 'cx' | 'cy' | 'scale'>>) => void;
}

export const usePlanView = create<PlanViewState>()((set) => ({
  cx: 0,
  cy: 0,
  scale: 40,
  set: (p) => set(p),
}));
