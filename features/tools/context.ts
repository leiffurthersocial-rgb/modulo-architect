/**
 * Helpers shared by tools: the active level, snap targets, step sizes and document access.
 */
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import type { Level, Project } from '@/core/model/schema';
import { nodeMap } from '@/core/geometry/graph';
import { mid, type Vec2 } from '@/core/geometry/vec2';
import { smartStep, snapPoint, type SnapResult, type SnapTarget, SNAP_LABEL } from '@/core/snapping/snap';
import type { ToolPointerEvent } from './types';
import { toolUI } from './store';
import { prefs } from '@/store/prefs';

export const doc = () => useDocument.getState();
export const editor = () => useEditor.getState();
export const project = (): Project => useDocument.getState().project;

export function activeLevel(): Level {
  const p = project();
  const id = editor().activeLevelId;
  return p.building.levels.find((l) => l.id === id) ?? p.building.levels[0]!;
}

/** Elevation of the working plane: terrain in Exterior mode, else the active floor. */
export function planeY(): number {
  return editor().mode === 'exterior' ? 0 : activeLevel().elevation;
}

export const PICK_PX = 10;

export function snapRadius(e: ToolPointerEvent) {
  return e.metersPerPixel * (e.pointerType === 'touch' ? 22 : PICK_PX);
}

/** Snap step: by zoom ("auto") or the fixed step chosen in Settings. */
export function stepFor(e: ToolPointerEvent) {
  const fixed = prefs().snapStep;
  return fixed === 'auto' ? smartStep(e.metersPerPixel) : fixed;
}

const targetCache = new WeakMap<Level['nodes'], { walls: Level['walls']; t: SnapTarget }>();

export function snapTargets(level: Level, excludeNodes: string[] = []): SnapTarget {
  let t: SnapTarget;
  const hit = targetCache.get(level.nodes);
  if (hit && hit.walls === level.walls) t = hit.t;
  else {
    const nodes = nodeMap(level);
    const segments = level.walls
      .map((w) => ({ a: nodes.get(w.a)!, b: nodes.get(w.b)! }))
      .filter((s) => s.a && s.b);
    t = { points: [...nodes.values()], midpoints: segments.map((s) => mid(s.a, s.b)), segments };
    targetCache.set(level.nodes, { walls: level.walls, t });
  }
  if (excludeNodes.length === 0) return t;
  const ex = new Set(
    excludeNodes
      .map((id) => level.nodes.find((n) => n.id === id))
      .filter(Boolean)
      .map((n) => `${n!.x},${n!.y}`),
  );
  return {
    points: t.points.filter((p) => !ex.has(`${p.x},${p.y}`)),
    midpoints: t.midpoints,
    segments: t.segments.filter((s) => !ex.has(`${s.a.x},${s.a.y}`) && !ex.has(`${s.b.x},${s.b.y}`)),
  };
}

export function snap(e: ToolPointerEvent, opts: { anchor?: Vec2; target?: SnapTarget } = {}): SnapResult {
  const settings = project().settings;
  const res = snapPoint(e.point, opts.target ?? snapTargets(activeLevel()), {
    step: stepFor(e),
    radius: snapRadius(e),
    anchor: opts.anchor,
    angleStep: settings.angleStep,
    axisLock: e.shift,
    disabled: e.alt || !settings.snapping,
  });
  toolUI().set({
    snap: res.kind === 'free' || res.kind === 'grid' ? null : { label: SNAP_LABEL[res.kind], p: res.point },
  });
  return res;
}

export function units() {
  return project().settings.units;
}
