import type { Vec2 } from '@/core/geometry/vec2';

/** Small bridge so view-agnostic tools can ask the active view for screen-space queries. */
export interface ViewApi {
  /** Entity ids whose outline centre falls inside a client-space rectangle. */
  pickRect(
    rect: { x0: number; y0: number; x1: number; y1: number },
    filter: (id: string) => boolean,
  ): string[];
  /** Plan point → client coordinates. */
  toClient(p: Vec2): { x: number; y: number } | null;
  /** World point (plan x, plan y, height) → client coordinates (3D view only). */
  worldToClient?(p: { x: number; y: number; h: number }): { x: number; y: number } | null;
}

export const viewApis: Partial<Record<'2d' | '3d', ViewApi>> = {};
