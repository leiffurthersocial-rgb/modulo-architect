import type { OpeningDef } from '../types';
import doorDouble from './door-double';
import doorSingle from './door-single';
import doorSliding from './door-sliding';
import windowCasement from './window-casement';
import windowFixed from './window-fixed';
import windowTall from './window-tall';
import garageDoor from './garage-door';
import windowSmall from './window-small';
import doorFrench from './door-french';

export const OPENINGS: OpeningDef[] = [
  doorSingle,
  doorDouble,
  doorSliding,
  windowCasement,
  windowFixed,
  windowTall,
  doorFrench,
  garageDoor,
  windowSmall,
];

/** Materials for the standard opening slots (overridable per opening via `material`). */
export const OPENING_SLOTS: Record<string, string> = {
  frame: 'lacquer-white',
  leaf: 'lacquer-white',
  glass: 'glass',
  handle: 'metal-black',
};
