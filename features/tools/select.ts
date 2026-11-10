import type { Tool, ToolPointerEvent, Overlay } from './types';
import { activeLevel, doc, editor, project, snap, snapTargets, stepFor, units, snapRadius } from './context';
import { toolUI } from './store';
import { selectionHandles } from './handles';
import { viewApis } from './viewApi';
import { placeItem, placeOpening, pointedWall } from './placement';
import { findEntity, kindOf } from '@/core/model/entities';
import type { Item, Project, Stair } from '@/core/model/schema';
import * as ops from '@/core/model/ops';
import { getElement } from '@/registry';
import { snapAngle, snapDelta, roundTo } from '@/core/snapping/snap';
import { angleOf, dist, dot, normalize, perp, sub, type Vec2 } from '@/core/geometry/vec2';
import { formatAngle, formatLength } from '@/core/units/units';
import { entityOutline, itemIssues } from '@/core/model/footprint';
import { nodePos } from '@/core/geometry/graph';
import { focusSelection } from '@/store/actions';

type Drag =
  | { kind: 'pending'; start: Vec2; client: { x: number; y: number }; id: string; additive: boolean }
  | {
      kind: 'move';
      start: Vec2;
      ids: string[];
      orig: Map<string, { x: number; y: number; rotation?: number }>;
      nodes: Map<string, Vec2>;
      levelId: string;
      slabs: Map<string, Vec2[]>;
    }
  | { kind: 'node'; nodeId: string; levelId: string }
  | { kind: 'rotate'; id: string; center: Vec2; startAngle: number; orig: number }
  | { kind: 'resize'; id: string; sx: number; sz: number; orig: Item }
  | {
      kind: 'marquee';
      startClient: { x: number; y: number };
      start: Vec2;
      additive: boolean;
      current: Vec2;
      currentClient: { x: number; y: number };
    };

let drag: Drag | null = null;
let hoverHandle: string | null = null;

/** Kinds the user can pick and move in each mode. */
function pickable(id: string): boolean {
  const mode = editor().mode;
  const k = kindOf(id);
  if (k === 'level') return false;
  if (mode === 'furnish') return k === 'item' || k === 'stair' || k === 'opening';
  if (mode === 'exterior')
    return k === 'item' || k === 'wall' || k === 'roof' || k === 'slab' || id === 'site';
  return id !== 'site';
}

function movable(id: string): boolean {
  if (doc().readOnly) return false;
  const mode = editor().mode;
  const k = kindOf(id);
  const ref = findEntity(project(), id);
  if (!ref || (ref.entity as { locked?: boolean }).locked) return false;
  if (mode === 'exterior') return k === 'item';
  if (mode === 'furnish') return k === 'item' || k === 'stair' || k === 'opening';
  return (
    k === 'item' ||
    k === 'stair' ||
    k === 'wall' ||
    k === 'room' ||
    k === 'slab' ||
    k === 'opening' ||
    k === 'node'
  );
}

export function refreshSelectionOverlay() {
  if (editor().tool !== 'select') return;
  const o: Overlay[] = [];
  if (drag?.kind === 'marquee') {
    const a = drag.start;
    const b = drag.current;
    o.push({
      kind: 'poly',
      pts: [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }],
      style: 'accent',
      fill: true,
      closed: true,
    });
  }
  o.push(...selectionHandles(project(), editor().selection, editor().mode, doc().readOnly));
  toolUI().set({ overlay: o });
}

function beginMove(e: ToolPointerEvent, ids: string[]) {
  const p = project();
  const orig = new Map<string, { x: number; y: number; rotation?: number }>();
  const nodes = new Map<string, Vec2>();
  const slabs = new Map<string, Vec2[]>();
  let levelId = activeLevel().id;
  for (const id of ids) {
    const ref = findEntity(p, id);
    if (!ref) continue;
    if (ref.level) levelId = ref.level.id;
    if (ref.kind === 'item' || ref.kind === 'stair')
      orig.set(id, { x: ref.entity.x, y: ref.entity.y, rotation: ref.entity.rotation });
    else if (ref.kind === 'opening') orig.set(id, { x: ref.entity.offset, y: 0 });
    else if (ref.kind === 'wall')
      for (const nid of [ref.entity.a, ref.entity.b]) nodes.set(nid, nodePos(ref.level, nid)!);
    else if (ref.kind === 'room')
      for (const nid of ref.entity.nodes) nodes.set(nid, nodePos(ref.level, nid)!);
    else if (ref.kind === 'node') nodes.set(id, { x: ref.entity.x, y: ref.entity.y });
    else if (ref.kind === 'slab')
      slabs.set(
        id,
        ref.entity.points.map((q) => ({ ...q })),
      );
  }
  doc().begin('Move');
  drag = { kind: 'move', start: e.point, ids, orig, nodes, levelId, slabs };
}

function updateMove(e: ToolPointerEvent, d: Extract<Drag, { kind: 'move' }>) {
  const p = project();
  const raw = sub(e.point, d.start);
  const step = stepFor(e);
  const disabled = e.alt || !p.settings.snapping;
  const u = units();
  let tip = '';
  const single = d.ids.length === 1 ? d.ids[0]! : null;
  const singleRef = single ? findEntity(p, single) : null;

  // A single item moves with full placement snapping (walls, alignment).
  if (singleRef?.kind === 'item') {
    const it = singleRef.entity;
    const def = getElement(it.type);
    const o = d.orig.get(it.id)!;
    const target = { x: o.x + raw.x, y: o.y + raw.y };
    const ground = singleRef.level ?? p.building.levels[0]!;
    const others = (singleRef.level ? singleRef.level.items : p.exterior.items).filter((x) => x.id !== it.id);
    const pl = def
      ? placeItem(target, def, it.size, o.rotation ?? 0, ground, { step, disabled, others })
      : { ...target, rotation: o.rotation ?? 0, wallId: null, label: null };
    let pos = { x: pl.x, y: pl.y };
    if (e.shift) {
      const dd = snapDelta(raw, step, { axisLock: true, disabled });
      pos = { x: o.x + dd.x, y: o.y + dd.y };
    }
    doc().mutate('Move', (draft) => {
      const ref = findEntity(draft as Project, it.id);
      if (ref?.kind !== 'item') return;
      ref.entity.x = pos.x;
      ref.entity.y = pos.y;
      if (pl.wallId && !e.shift) ref.entity.rotation = pl.rotation;
    });
    const moved = findEntity(project(), it.id);
    const issues =
      moved?.kind === 'item'
        ? itemIssues(moved.level, moved.level ? moved.level.items : project().exterior.items, moved.entity)
        : [];
    tip = issues.length
      ? issues[0]!.kind === 'blocks-door'
        ? 'Blocks a door'
        : 'Overlaps another item'
      : `${formatLength(pos.x - o.x, u)}, ${formatLength(pos.y - o.y, u)}`;
    toolUI().set({ tip: { text: tip, p: e.point }, snap: pl.label ? { label: pl.label, p: pos } : null });
    return;
  }

  if (singleRef?.kind === 'opening') {
    const o = singleRef.entity;
    const pointed = pointedWall(singleRef.level, e.hitId === o.id ? null : e.hitId, e.hitPoint);
    const pl = placeOpening(pointed?.point ?? e.point, o.width, singleRef.level, {
      step,
      disabled,
      radius: snapRadius(e) * 3,
      preferWallId: pointed?.wallId ?? (e.view === '3d' ? o.wallId : null),
    });
    if (pl) {
      doc().mutate('Move', (draft) => {
        const ref = findEntity(draft as Project, o.id);
        if (ref?.kind !== 'opening') return;
        ref.entity.wallId = pl.wallId;
        ref.entity.offset = pl.offset;
      });
      toolUI().set({
        tip: { text: `${formatLength(pl.offset - o.width / 2, u)} from wall end`, p: e.point },
      });
    }
    return;
  }

  // Walls move perpendicular to themselves (so the room stays rectangular).
  let delta = snapDelta(raw, step, { axisLock: e.shift, disabled });
  if (singleRef?.kind === 'wall') {
    const a = d.nodes.get(singleRef.entity.a)!;
    const b = d.nodes.get(singleRef.entity.b)!;
    const n = perp(normalize(sub(b, a)));
    const along = dot(raw, n);
    const snapped = disabled ? along : roundTo(along, step);
    delta = { x: n.x * snapped, y: n.y * snapped };
    tip = `Moved ${formatLength(Math.abs(snapped), u)}`;
  } else tip = `${formatLength(delta.x, u)}, ${formatLength(delta.y, u)}`;

  doc().mutate('Move', (draft) => {
    const dp = draft as Project;
    const level = dp.building.levels.find((l) => l.id === d.levelId);
    if (level)
      for (const [nid, orig] of d.nodes) {
        const n = level.nodes.find((x) => x.id === nid);
        if (n) {
          n.x = orig.x + delta.x;
          n.y = orig.y + delta.y;
        }
      }
    for (const [id, pts] of d.slabs) {
      const ref = findEntity(dp, id);
      if (ref?.kind === 'slab') ref.entity.points = pts.map((q) => ({ x: q.x + delta.x, y: q.y + delta.y }));
    }
    for (const [id, o] of d.orig) {
      const ref = findEntity(dp, id);
      if (ref && (ref.kind === 'item' || ref.kind === 'stair')) {
        ref.entity.x = o.x + delta.x;
        ref.entity.y = o.y + delta.y;
      }
    }
  });
  toolUI().set({ tip: { text: tip, p: e.point } });
}

function hitSelectable(e: ToolPointerEvent): string | null {
  if (!e.hitId) return null;
  if (!pickable(e.hitId)) return null;
  return e.hitId;
}

export const selectTool: Tool = {
  id: 'select',
  onActivate() {
    drag = null;
    toolUI().reset();
    refreshSelectionOverlay();
  },
  onDeactivate() {
    if (drag && drag.kind !== 'pending' && drag.kind !== 'marquee') doc().commit();
    drag = null;
    toolUI().reset();
  },
  onPointerDown(e) {
    if (e.button !== 0) return false;
    const ed = editor();
    if (e.handle) {
      const [kind, id, a, b] = e.handle.split(':');
      const ref = id ? findEntity(project(), id) : null;
      if (kind === 'node' && id) {
        const lvl = project().building.levels.find((l) => l.nodes.some((n) => n.id === id));
        if (!lvl) return true;
        doc().begin('Move corner');
        drag = { kind: 'node', nodeId: id, levelId: lvl.id };
        return true;
      }
      if ((kind === 'rot' || kind === 'srot') && ref && (ref.kind === 'item' || ref.kind === 'stair')) {
        doc().begin('Rotate');
        const c = { x: ref.entity.x, y: ref.entity.y };
        drag = {
          kind: 'rotate',
          id: ref.entity.id,
          center: c,
          startAngle: angleOf(sub(e.point, c)),
          orig: ref.entity.rotation,
        };
        return true;
      }
      if (kind === 'res' && ref?.kind === 'item') {
        doc().begin('Resize');
        drag = {
          kind: 'resize',
          id: ref.entity.id,
          sx: Number(a),
          sz: Number(b),
          orig: structuredClone(ref.entity),
        };
        return true;
      }
    }
    const hit = hitSelectable(e);
    if (hit) {
      const additive = e.shift || e.mod;
      if (!ed.selection.includes(hit)) {
        if (additive) ed.toggleSelect(hit);
        else ed.select([hit]);
      }
      drag = { kind: 'pending', start: e.point, client: { x: e.clientX, y: e.clientY }, id: hit, additive };
      refreshSelectionOverlay();
      return true;
    }
    // Empty space: marquee in 2D (or with Shift in 3D); otherwise let the camera orbit.
    if (e.view === '2d' || e.shift) {
      drag = {
        kind: 'marquee',
        startClient: { x: e.clientX, y: e.clientY },
        start: e.point,
        current: e.point,
        currentClient: { x: e.clientX, y: e.clientY },
        additive: e.shift || e.mod,
      };
      return true;
    }
    drag = null;
    // A click (not an orbit) on empty space clears the selection; resolved on pointer up.
    emptyDown = { x: e.clientX, y: e.clientY };
    return false;
  },
  onPointerMove(e) {
    editor().setCursor(e.point);
    if (!drag) {
      const h = e.handle;
      if (h !== hoverHandle) {
        hoverHandle = h;
        const cur = h
          ? (
              selectionHandles(project(), editor().selection, editor().mode, doc().readOnly).find(
                (x) => x.kind === 'handle' && x.id === h,
              ) as { cursor?: string } | undefined
            )?.cursor
          : undefined;
        toolUI().set({ cursor: cur ?? 'default' });
      }
      const hit = hitSelectable(e);
      editor().setHover(hit);
      if (!h) toolUI().set({ cursor: hit && movable(hit) ? 'move' : hit ? 'pointer' : 'default' });
      return;
    }
    if (drag.kind === 'pending') {
      if (Math.hypot(e.clientX - drag.client.x, e.clientY - drag.client.y) < 4) return;
      const ids = editor().selection.filter(movable);
      if (ids.length === 0) {
        drag = null;
        return;
      }
      const start = drag.start;
      beginMove({ ...e, point: start }, ids);
    }
    if (drag.kind === 'move') {
      updateMove(e, drag);
    } else if (drag.kind === 'node') {
      const nd = drag;
      const level = project().building.levels.find((l) => l.id === nd.levelId)!;
      const r = snap(e, { target: snapTargets(level, [drag.nodeId]) });
      const nid = drag.nodeId;
      const lid = drag.levelId;
      doc().mutate('Move corner', (d) => ops.moveNode(d as Project, lid, nid, r.point));
      toolUI().set({
        tip: { text: `${formatLength(r.point.x, units())}, ${formatLength(r.point.y, units())}`, p: e.point },
      });
    } else if (drag.kind === 'rotate') {
      const a = angleOf(sub(e.point, drag.center));
      const raw = drag.orig + (a - drag.startAngle);
      const rot = snapAngle(raw, project().settings.angleStep, e.alt);
      const id = drag.id;
      doc().mutate('Rotate', (d) => {
        const ref = findEntity(d as Project, id);
        if (ref && (ref.kind === 'item' || ref.kind === 'stair')) (ref.entity as Item | Stair).rotation = rot;
      });
      const deg = ((((-rot * 180) / Math.PI) % 360) + 360) % 360;
      toolUI().set({ tip: { text: formatAngle((deg * Math.PI) / 180), p: e.point } });
    } else if (drag.kind === 'resize') {
      const it = drag.orig;
      const def = getElement(it.type);
      // Opposite corner stays fixed.
      const c = Math.cos(it.rotation);
      const s = Math.sin(it.rotation);
      const fixed = {
        x: it.x - (drag.sx * it.size.w * c) / 2 + (drag.sz * it.size.d * s) / 2,
        y: it.y - (drag.sx * it.size.w * s) / 2 - (drag.sz * it.size.d * c) / 2,
      };
      const v = sub(e.point, fixed);
      const lx = v.x * c + v.y * s;
      const lz = -v.x * s + v.y * c;
      const step = stepFor(e);
      const min = def?.minSize ?? {};
      const rs = def?.resizable ?? {};
      let w = rs.w === false ? it.size.w : Math.max(min.w ?? 0.1, Math.abs(lx));
      let dd = rs.d === false ? it.size.d : Math.max(min.d ?? 0.1, Math.abs(lz));
      if (!e.alt) {
        w = Math.max(step, roundTo(w, step));
        dd = Math.max(step, roundTo(dd, step));
      }
      if (e.shift) {
        const k = Math.max(w / it.size.w, dd / it.size.d);
        w = it.size.w * k;
        dd = it.size.d * k;
      }
      const cx = fixed.x + (drag.sx * w * c) / 2 - (drag.sz * dd * s) / 2;
      const cy = fixed.y + (drag.sx * w * s) / 2 + (drag.sz * dd * c) / 2;
      const id = drag.id;
      doc().mutate('Resize', (d) => {
        const ref = findEntity(d as Project, id);
        if (ref?.kind !== 'item') return;
        ref.entity.size.w = w;
        ref.entity.size.d = dd;
        ref.entity.x = cx;
        ref.entity.y = cy;
      });
      toolUI().set({
        tip: { text: `${formatLength(w, units())} × ${formatLength(dd, units())}`, p: e.point },
      });
    } else if (drag.kind === 'marquee') {
      drag.current = e.point;
      drag.currentClient = { x: e.clientX, y: e.clientY };
    }
    refreshSelectionOverlay();
  },
  onPointerUp(e) {
    const d = drag;
    drag = null;
    if (!d) {
      if (emptyDown && Math.hypot(e.clientX - emptyDown.x, e.clientY - emptyDown.y) < 4 && !e.shift)
        editor().clearSelection();
      emptyDown = null;
      refreshSelectionOverlay();
      return;
    }
    if (d.kind === 'pending') {
      // Plain click on an already-selected item in a multi-selection narrows to it.
      if (!d.additive && editor().selection.length > 1) editor().select([d.id]);
      else if (d.additive && editor().selection.includes(d.id) && editor().selection.length > 1) {
        /* toggled on down */
      }
    } else if (d.kind === 'marquee') {
      const rect = { x0: d.startClient.x, y0: d.startClient.y, x1: d.currentClient.x, y1: d.currentClient.y };
      const small = Math.abs(rect.x1 - rect.x0) < 4 && Math.abs(rect.y1 - rect.y0) < 4;
      if (small) {
        if (!d.additive) editor().clearSelection();
      } else {
        const api = viewApis[e.view];
        const ids = api ? api.pickRect(rect, (id) => pickable(id) && kindOf(id) !== 'room') : [];
        editor().select(d.additive ? Array.from(new Set([...editor().selection, ...ids])) : ids);
      }
    } else {
      doc().commit();
    }
    toolUI().set({ tip: null, snap: null });
    refreshSelectionOverlay();
  },
  onDoubleClick(e) {
    const hit = hitSelectable(e);
    if (hit) {
      editor().select([hit]);
      focusSelection();
    }
  },
  onKeyDown(e) {
    if (e.key === 'Escape') {
      if (drag && drag.kind !== 'pending' && drag.kind !== 'marquee') {
        doc().cancel();
        drag = null;
        toolUI().set({ tip: null });
        return true;
      }
      if (editor().selection.length) {
        editor().clearSelection();
        return true;
      }
    }
    return false;
  },
  hint() {
    const sel = editor().selection;
    if (drag?.kind === 'move')
      return 'Drag to move · Shift locks the axis · Alt disables snapping · Esc cancels';
    if (drag?.kind === 'rotate') return 'Rotating in 15° steps · Alt for free rotation';
    if (drag?.kind === 'resize') return 'Resizing · Shift keeps proportions · Alt disables snapping';
    if (sel.length === 0) {
      const mode = editor().mode;
      if (mode === 'furnish')
        return 'Pick furniture from the catalog, or click an item to edit it · Shift-drag to box-select';
      if (mode === 'exterior')
        return 'Click a wall to change its facade, or add outdoor elements from the catalog';
      return 'Click to select · drag to move · Shift-drag for box select · double-click to focus';
    }
    return `${sel.length} selected · drag to move · Del deletes · ⌘D duplicates · double-click to focus`;
  },
};

let emptyDown: { x: number; y: number } | null = null;

/** For marquee in the 3D view: centres of entity outlines. */
export function outlineCenter(p: Project, id: string): { x: number; y: number; z: number } | null {
  const o = entityOutline(p, id);
  if (!o) return null;
  const pts = o.polygons.flat();
  const x = pts.reduce((s, q) => s + q.x, 0) / pts.length;
  const y = pts.reduce((s, q) => s + q.y, 0) / pts.length;
  return { x, y, z: (o.y0 + o.y1) / 2 };
}

export const _dist = dist;
