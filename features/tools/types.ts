import type { Vec2 } from '@/core/geometry/vec2';
import type { ToolId } from '@/store/editor';
import type { Item, Opening, Stair } from '@/core/model/schema';

export interface ToolPointerEvent {
  /** Raw pointer position on the working plane, plan space (meters). */
  point: Vec2;
  /** Entity under the pointer. */
  hitId: string | null;
  /** Overlay handle under the pointer. */
  handle: string | null;
  shift: boolean;
  alt: boolean;
  mod: boolean;
  button: number;
  /** Screen pixel size in meters at the pointer: drives snap radius and smart steps. */
  metersPerPixel: number;
  view: '2d' | '3d';
  clientX: number;
  clientY: number;
  pointerType: string;
}

/**
 * The common tool interface. Tools are view-agnostic: the 2D and 3D views translate raw input
 * into ToolPointerEvents on the plan, and render the overlay the tool publishes.
 */
export interface Tool {
  id: ToolId;
  onActivate?(): void;
  onDeactivate?(): void;
  /** Return true to capture the gesture (in 3D this stops the camera from orbiting). */
  onPointerDown?(e: ToolPointerEvent): boolean | void;
  onPointerMove?(e: ToolPointerEvent): void;
  onPointerUp?(e: ToolPointerEvent): void;
  onDoubleClick?(e: ToolPointerEvent): void;
  /** Return true when the key was handled. */
  onKeyDown?(e: KeyboardEvent): boolean;
  /** Short status-bar hint for the current tool state. */
  hint(): string;
}

export type OverlayStyle = 'draft' | 'guide' | 'accent' | 'danger' | 'muted' | 'ghost';

export type Overlay =
  | { kind: 'line'; a: Vec2; b: Vec2; style: OverlayStyle; dashed?: boolean }
  | { kind: 'poly'; pts: Vec2[]; style: OverlayStyle; fill?: boolean; closed?: boolean }
  | { kind: 'point'; p: Vec2; style: OverlayStyle }
  | { kind: 'label'; p: Vec2; text: string; style?: 'tip' | 'dim' | 'accent' }
  | { kind: 'dim'; a: Vec2; b: Vec2; offset: number; text: string; style?: OverlayStyle }
  | { kind: 'handle'; id: string; p: Vec2; shape: 'square' | 'circle' | 'rotate'; cursor?: string };

/** A 3D preview of what a tool is about to place. */
export type Ghost =
  | { kind: 'item'; item: Item; levelId: string | null; invalid?: boolean }
  | { kind: 'opening'; opening: Opening; levelId: string }
  | { kind: 'stair'; stair: Stair; levelId: string };
