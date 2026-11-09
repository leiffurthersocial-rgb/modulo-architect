import { FURNITURE } from './furniture';
import { OUTDOOR } from './outdoor';
import { OPENINGS } from './openings';
import type { ElementDef, OpeningDef } from './types';

export type { ElementDef, OpeningDef, Part, ParamSpec, SnapSurface, ParamValue } from './types';

/**
 * The element registry. Everything placeable is data-driven: catalogs, the inspector, snapping and
 * rendering all read from here. Register third-party elements with `registerElement`.
 */
const elements = new Map<string, ElementDef>();
const openings = new Map<string, OpeningDef>();

export function registerElement(def: ElementDef) {
  if (elements.has(def.id)) throw new Error(`Element "${def.id}" already registered`);
  elements.set(def.id, def);
}

export function registerOpening(def: OpeningDef) {
  if (openings.has(def.id)) throw new Error(`Opening "${def.id}" already registered`);
  openings.set(def.id, def);
}

FURNITURE.forEach(registerElement);
OUTDOOR.forEach(registerElement);
OPENINGS.forEach(registerOpening);

export const getElement = (id: string): ElementDef | undefined => elements.get(id);
export const getOpening = (id: string): OpeningDef | undefined => openings.get(id);
export const allElements = (): ElementDef[] => [...elements.values()];
export const allOpenings = (): OpeningDef[] => [...openings.values()];
export const elementsOfKind = (kind: ElementDef['kind']) => allElements().filter((e) => e.kind === kind);

export function defaultParams(def: { params?: { key: string; default: number | string | boolean }[] }) {
  return Object.fromEntries((def.params ?? []).map((p) => [p.key, p.default]));
}

export function searchElements(query: string, kind?: ElementDef['kind']): ElementDef[] {
  const q = query.trim().toLowerCase();
  const list = kind ? elementsOfKind(kind) : allElements();
  if (!q) return list;
  return list.filter((e) => [e.name, e.category, e.id, ...(e.tags ?? [])].some((s) => s.toLowerCase().includes(q)));
}
