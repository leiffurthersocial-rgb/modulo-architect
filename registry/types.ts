import type { LucideIcon } from 'lucide-react';
import type { MaterialCategory } from './materials/types';
import type { Vec2 } from '@/core/geometry/vec2';

export type SnapSurface = 'floor' | 'wall' | 'ceiling' | 'ground';
export type ParamValue = number | string | boolean;

export interface ParamSpec {
  key: string;
  label: string;
  type: 'length' | 'number' | 'angle' | 'boolean' | 'select';
  default: ParamValue;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  /** Hidden under "More" in the inspector. */
  advanced?: boolean;
}

export interface MaterialSlot {
  label: string;
  default: string;
  category: MaterialCategory;
}

export type PartGeom =
  | { kind: 'box'; size: [number, number, number]; radius?: number }
  | { kind: 'cylinder'; radiusTop: number; radiusBottom: number; height: number; segments?: number }
  | { kind: 'sphere'; radius: number; scale?: [number, number, number] }
  | { kind: 'torus'; radius: number; tube: number; arc?: number };

/** A primitive in an element's local frame: origin at the footprint centre on the floor, y up, +z = front. */
export interface Part {
  geom: PartGeom;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** A slot name declared by the element, or a material id. */
  material: string;
  /** Excluded from shadow casting (glass, rugs, ...). */
  noShadow?: boolean;
}

export interface BuildContext {
  size: { w: number; d: number; h: number };
  params: Record<string, ParamValue>;
}

export interface ElementDef {
  id: string;
  name: string;
  kind: 'furniture' | 'outdoor';
  category: string;
  icon: LucideIcon;
  tags?: string[];
  size: { w: number; d: number; h: number };
  minSize?: { w?: number; d?: number; h?: number };
  /** Which dimensions the user may change. Defaults to all. */
  resizable?: { w?: boolean; d?: boolean; h?: boolean };
  params?: ParamSpec[];
  slots: Record<string, MaterialSlot>;
  snap: SnapSurface;
  /** Gap kept between the element's back and a wall when wall-snapping. */
  wallOffset?: number;
  /** Default base elevation (e.g. wall cabinets, pendant lights). */
  elevation?: number;
  /** Walk-mode collision. Defaults to true. */
  solid?: boolean;
  /** Custom footprint in local coordinates (x right, y = local z / front). Defaults to the size rect. */
  footprint?: (ctx: BuildContext) => Vec2[];
  build: (ctx: BuildContext) => Part[];
  /** Emits light when lamps are on. `y` is height above the base (negative = below the top). */
  light?: { y: number; x?: number; z?: number; intensity?: number; distance?: number };
  /** Future: replace procedural geometry with a GLB model. */
  model?: { url: string; scale?: number };
}

export interface OpeningBuildContext {
  width: number;
  height: number;
  thickness: number;
  params: Record<string, ParamValue>;
}

/**
 * Doors and windows. Parts use a wall-local frame: origin at the opening's bottom centre on the
 * wall centre line, x along the wall, y up, +z towards the wall's left face.
 */
export interface OpeningDef {
  id: string;
  name: string;
  kind: 'door' | 'window';
  icon: LucideIcon;
  defaults: { width: number; height: number; sill: number };
  params?: ParamSpec[];
  /** Door leaf swing in plan (for plan symbols & clearance checks). */
  swing?: 'single' | 'double' | 'sliding' | 'none';
  build: (ctx: OpeningBuildContext) => Part[];
}
