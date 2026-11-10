'use client';
import { create } from 'zustand';
import { DEFAULTS } from '@/core/model/defaults';

/**
 * Personal preferences, stored in this browser (not in the project file).
 * Project-level settings (units, snapping, dimensions) live in `project.settings`.
 */
export interface Prefs {
  shadows: boolean;
  showGrid: boolean;
  /** 'auto' picks 5 cm … 1 m by zoom; a number fixes the step. */
  snapStep: 'auto' | number;
  wallThickness: number;
  walkSpeed: number;
  lookSensitivity: number;
  eyeHeight: number;
  autoDoors: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  shadows: true,
  showGrid: true,
  snapStep: 'auto',
  wallThickness: DEFAULTS.wallThickness,
  walkSpeed: 1,
  lookSensitivity: 1,
  eyeHeight: 1.7,
  autoDoors: true,
};

const KEY = 'modulo:prefs';

function load(): Prefs {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export const usePrefs = create<Prefs & { set: (p: Partial<Prefs>) => void; reset: () => void }>()(
  (set, get) => ({
    ...load(),
    set: (p) => {
      set(p);
      try {
        const { set: _s, reset: _r, ...rest } = get();
        localStorage.setItem(KEY, JSON.stringify(rest));
      } catch {
        /* storage unavailable */
      }
    },
    reset: () => {
      set(DEFAULT_PREFS);
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
    },
  }),
);

export const prefs = () => usePrefs.getState();
