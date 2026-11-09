import type { OpeningDef } from '../types';
import doorDouble from './door-double';
import doorSingle from './door-single';
import doorSliding from './door-sliding';
import windowCasement from './window-casement';
import windowFixed from './window-fixed';
import windowTall from './window-tall';

export const OPENINGS: OpeningDef[] = [
  doorSingle,
  doorDouble,
  doorSliding,
  windowCasement,
  windowFixed,
  windowTall,
];

/** Materials for the standard opening slots (overridable per opening via `material`). */
export const OPENING_SLOTS: Record<string, string> = {
  frame: 'lacquer-white',
  leaf: 'lacquer-white',
  glass: 'glass',
  handle: 'metal-black',
};
