'use client';
/**
 * User-level actions: combine document mutations with selection/UI updates. Commands, tools,
 * the inspector and keyboard shortcuts all call these, so behaviour stays consistent.
 */
import { useDocument } from './document';
import { useEditor } from './editor';
import * as ops from '@/core/model/ops';
import { findEntity, kindOf } from '@/core/model/entities';
import type { Item, Project } from '@/core/model/schema';
import { getElement, defaultParams } from '@/registry';
import { entityOutline } from '@/core/model/footprint';
import { bounds, pointInPolygon } from '@/core/geometry/polygon';
import { roomPolygon } from '@/core/geometry/graph';

const D = () => useDocument.getState();
const E = () => useEditor.getState();

export function activeLevelId(): string {
  const p = D().project;
  const id = E().activeLevelId;
  return p.building.levels.some((l) => l.id === id) ? id! : p.building.levels[0]!.id;
}

/** Drop selected ids that no longer exist (after undo, delete, ...). */
export function pruneSelection() {
  const p = D().project;
  const sel = E().selection.filter((id) => id === 'site' || findEntity(p, id));
  if (sel.length !== E().selection.length) E().select(sel);
}

export function undo() {
  D().undo();
  pruneSelection();
}

export function redo() {
  D().redo();
  pruneSelection();
}

export function deleteSelection() {
  const ids = E().selection.filter((id) => {
    const ref = findEntity(D().project, id);
    return ref && !(ref.entity as { locked?: boolean }).locked && ref.kind !== 'level';
  });
  if (ids.length === 0) return;
  D().mutate(ids.length === 1 ? 'Delete' : `Delete ${ids.length} objects`, (d) => ops.deleteEntities(d as Project, ids));
  E().clearSelection();
  E().notify(ids.length === 1 ? 'Deleted' : `Deleted ${ids.length} objects`);
}

let clipboard: ops.ClipboardData | null = null;

export function copySelection(): boolean {
  const data = ops.copyEntities(D().project, E().selection);
  const n = data.items.length + data.stairs.length + data.outdoor.length;
  if (n === 0) {
    E().notify('Only furniture, outdoor items and stairs can be copied');
    return false;
  }
  clipboard = data;
  E().notify(n === 1 ? 'Copied' : `Copied ${n} objects`);
  return true;
}

export function cutSelection() {
  if (copySelection()) deleteSelection();
}

export function paste(offset = { x: 0.5, y: 0.5 }) {
  if (!clipboard) return;
  const data = clipboard;
  let ids: string[] = [];
  D().mutate('Paste', (d) => {
    ids = ops.pasteEntities(d as Project, activeLevelId(), data, offset);
  });
  E().select(ids);
  // Successive pastes cascade.
  clipboard = {
    items: data.items.map((i) => ({ ...i, x: i.x + offset.x, y: i.y + offset.y })),
    stairs: data.stairs.map((s) => ({ ...s, x: s.x + offset.x, y: s.y + offset.y })),
    outdoor: data.outdoor.map((i) => ({ ...i, x: i.x + offset.x, y: i.y + offset.y })),
  };
}

export function duplicateSelection() {
  const data = ops.copyEntities(D().project, E().selection);
  if (data.items.length + data.stairs.length + data.outdoor.length === 0) {
    E().notify('Select furniture, outdoor items or stairs to duplicate');
    return;
  }
  let ids: string[] = [];
  D().mutate('Duplicate', (d) => {
    ids = ops.pasteEntities(d as Project, activeLevelId(), data, { x: 0.5, y: 0.5 });
  });
  E().select(ids);
}

export function selectAll() {
  const p = D().project;
  const mode = E().mode;
  if (mode === 'exterior') {
    E().select(p.exterior.items.filter((i) => !i.hidden).map((i) => i.id));
    return;
  }
  const level = p.building.levels.find((l) => l.id === activeLevelId())!;
  if (mode === 'furnish') E().select(level.items.filter((i) => !i.hidden).map((i) => i.id));
  else E().select([...level.walls, ...level.openings, ...level.stairs, ...level.items].filter((e) => !e.hidden).map((e) => e.id));
}

/** Select every item/opening/stair inside a room (or the room under the selection). */
export function selectAllInRoom(roomId?: string) {
  const p = D().project;
  const id = roomId ?? E().selection.find((s) => kindOf(s) === 'room');
  if (!id) {
    E().notify('Select a room first');
    return;
  }
  const ref = findEntity(p, id);
  if (!ref || ref.kind !== 'room') return;
  const poly = roomPolygon(ref.level, ref.entity);
  const inside = [...ref.level.items, ...ref.level.stairs].filter((e) => pointInPolygon({ x: e.x, y: e.y }, poly)).map((e) => e.id);
  E().select(inside);
  E().notify(inside.length ? `Selected ${inside.length} objects in ${ref.entity.name}` : `${ref.entity.name} is empty`);
}

export function toggleFlag(flag: 'locked' | 'hidden') {
  const ids = E().selection;
  if (!ids.length) return;
  const p = D().project;
  const first = findEntity(p, ids[0]!);
  const next = !(first?.entity as { locked?: boolean; hidden?: boolean } | undefined)?.[flag];
  D().mutate(flag === 'locked' ? (next ? 'Lock' : 'Unlock') : next ? 'Hide' : 'Show', (d) => {
    for (const id of ids) {
      const ref = findEntity(d as Project, id);
      if (ref && ref.kind !== 'level') (ref.entity as { locked?: boolean; hidden?: boolean })[flag] = next || undefined;
    }
  });
  if (flag === 'hidden' && next) E().clearSelection();
  E().notify(`${flag === 'locked' ? (next ? 'Locked' : 'Unlocked') : next ? 'Hidden' : 'Shown'}`);
}

export function showAllHidden() {
  D().mutate('Show all', (d) => {
    for (const l of d.building.levels) for (const list of [l.walls, l.rooms, l.openings, l.stairs, l.items]) for (const e of list) delete e.hidden;
    for (const i of d.exterior.items) delete i.hidden;
    for (const r of d.building.roofs) delete r.hidden;
  });
}

/** Align or distribute selected items/stairs (plan space). */
export function alignSelection(how: 'left' | 'right' | 'top' | 'bottom' | 'center-x' | 'center-y' | 'distribute-x' | 'distribute-y') {
  const p = D().project;
  const ids = E().selection.filter((id) => kindOf(id) === 'item' || kindOf(id) === 'stair');
  if (ids.length < 2) {
    E().notify('Select two or more objects to align');
    return;
  }
  const boxes = ids.map((id) => ({ id, b: bounds(entityOutline(p, id)!.polygons.flat()) }));
  const all = bounds(boxes.flatMap((x) => [
    { x: x.b.minX, y: x.b.minY },
    { x: x.b.maxX, y: x.b.maxY },
  ]));
  const delta = new Map<string, { x: number; y: number }>();
  if (how.startsWith('distribute')) {
    const axis = how === 'distribute-x' ? 'x' : 'y';
    const sorted = [...boxes].sort((a, b) => (axis === 'x' ? a.b.minX + a.b.maxX - b.b.minX - b.b.maxX : a.b.minY + a.b.maxY - b.b.minY - b.b.maxY));
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const c0 = axis === 'x' ? (first.b.minX + first.b.maxX) / 2 : (first.b.minY + first.b.maxY) / 2;
    const c1 = axis === 'x' ? (last.b.minX + last.b.maxX) / 2 : (last.b.minY + last.b.maxY) / 2;
    sorted.forEach((s, i) => {
      const target = c0 + ((c1 - c0) * i) / (sorted.length - 1);
      const c = axis === 'x' ? (s.b.minX + s.b.maxX) / 2 : (s.b.minY + s.b.maxY) / 2;
      delta.set(s.id, axis === 'x' ? { x: target - c, y: 0 } : { x: 0, y: target - c });
    });
  } else {
    for (const { id, b } of boxes) {
      const d = { x: 0, y: 0 };
      if (how === 'left') d.x = all.minX - b.minX;
      if (how === 'right') d.x = all.maxX - b.maxX;
      if (how === 'top') d.y = all.minY - b.minY;
      if (how === 'bottom') d.y = all.maxY - b.maxY;
      if (how === 'center-x') d.x = (all.minX + all.maxX) / 2 - (b.minX + b.maxX) / 2;
      if (how === 'center-y') d.y = (all.minY + all.maxY) / 2 - (b.minY + b.maxY) / 2;
      delta.set(id, d);
    }
  }
  D().mutate(how.startsWith('distribute') ? 'Distribute' : 'Align', (d) => {
    for (const [id, dv] of delta) {
      const ref = findEntity(d as Project, id);
      if (!ref || (ref.kind !== 'item' && ref.kind !== 'stair') || ref.entity.locked) continue;
      ref.entity.x += dv.x;
      ref.entity.y += dv.y;
    }
  });
}

/** Nudge selection with the arrow keys. */
export function nudgeSelection(dx: number, dy: number) {
  const ids = E().selection;
  if (!ids.length) return false;
  D().mutate(
    'Nudge',
    (d) => {
      for (const id of ids) {
        const ref = findEntity(d as Project, id);
        if (!ref || (ref.entity as { locked?: boolean }).locked) continue;
        if (ref.kind === 'item' || ref.kind === 'stair') {
          ref.entity.x += dx;
          ref.entity.y += dy;
        } else if (ref.kind === 'wall') {
          ops.translateNodes(ref.level, [ref.entity.a, ref.entity.b], { x: dx, y: dy });
        } else if (ref.kind === 'room') {
          ops.translateNodes(ref.level, ref.entity.nodes, { x: dx, y: dy });
        } else if (ref.kind === 'node') {
          ref.entity.x += dx;
          ref.entity.y += dy;
        }
      }
    },
    { mergeKey: `nudge:${ids.join(',')}` },
  );
  return true;
}

export function rotateSelection(delta: number) {
  const ids = E().selection.filter((id) => kindOf(id) === 'item' || kindOf(id) === 'stair');
  if (!ids.length) return false;
  D().mutate(
    'Rotate',
    (d) => {
      for (const id of ids) {
        const ref = findEntity(d as Project, id);
        if (ref && (ref.kind === 'item' || ref.kind === 'stair') && !ref.entity.locked) ref.entity.rotation = normAngle(ref.entity.rotation + delta);
      }
    },
    { mergeKey: `rotate:${ids.join(',')}` },
  );
  return true;
}

const normAngle = (a: number) => {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  if (r <= -Math.PI) r += Math.PI * 2;
  return Math.round(r * 1e9) / 1e9;
};

export function newItem(type: string, x: number, y: number, rotation = 0): Omit<Item, 'id'> | null {
  const def = getElement(type);
  if (!def) return null;
  return { type, x, y, z: def.elevation ?? 0, rotation, size: { ...def.size }, params: defaultParams(def), materials: {} };
}

export function addLevel(copyWalls = false) {
  let id = '';
  D().mutate('Add level', (d) => {
    id = ops.addLevel(d as Project, { copyWalls });
  });
  E().setActiveLevel(id);
  E().notify(copyWalls ? 'Added a level with the same walls' : 'Added a level');
}

export function removeLevel(levelId: string) {
  const p = D().project;
  if (p.building.levels.length <= 1) {
    E().notify('A building needs at least one level');
    return;
  }
  D().mutate('Remove level', (d) => ops.removeLevel(d as Project, levelId));
  const levels = D().project.building.levels;
  E().setActiveLevel(levels[Math.min(levels.length - 1, Math.max(0, p.building.levels.findIndex((l) => l.id === levelId) - 1))]!.id);
}

export function addRoof(type: 'flat' | 'gable' | 'hip' | 'shed' = 'gable') {
  const p = D().project;
  const top = p.building.levels.filter((l) => l.walls.length > 0).pop();
  if (!top) {
    E().notify('Draw some walls first, then add a roof');
    return;
  }
  let id: string | null = null;
  D().mutate('Add roof', (d) => {
    id = ops.addRoof(d as Project, top.id, type);
  });
  if (id) {
    E().select([id]);
    E().set({ levelDisplay: 'all' });
  }
}

export function focusSelection() {
  const p = D().project;
  const ids = E().selection;
  const outlines = ids.map((id) => entityOutline(p, id)).filter((o): o is NonNullable<typeof o> => !!o);
  if (!outlines.length) {
    E().requestCamera({ preset: 'fit' });
    return;
  }
  const pts = outlines.flatMap((o) => o.polygons.flat());
  const b = bounds(pts);
  const y0 = Math.min(...outlines.map((o) => o.y0));
  const y1 = Math.max(...outlines.map((o) => o.y1));
  E().requestCamera({
    focus: { center: [(b.minX + b.maxX) / 2, (y0 + y1) / 2, (b.minY + b.maxY) / 2], radius: Math.max(1, Math.hypot(b.width, b.height, y1 - y0) / 2) },
  });
}
