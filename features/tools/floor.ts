import type { Tool, Overlay } from './types';
import { activeLevel, doc, editor, snap, units } from './context';
import { toolUI } from './store';
import { typingKey } from './typing';
import * as ops from '@/core/model/ops';
import type { Project } from '@/core/model/schema';
import { formatArea, formatLength, parseDimensions } from '@/core/units/units';
import type { Vec2 } from '@/core/geometry/vec2';
import { pointInPolygon } from '@/core/geometry/polygon';
import { roomPolygon } from '@/core/geometry/graph';

let start: Vec2 | null = null;
let current: Vec2 | null = null;
let text = '';

const rectPts = (a: Vec2, b: Vec2): Vec2[] => {
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
};

function render() {
  const u = units();
  const o: Overlay[] = [];
  if (start && current) {
    const pts = rectPts(start, current);
    const w = pts[1]!.x - pts[0]!.x;
    const h = pts[2]!.y - pts[1]!.y;
    if (w > 0 && h > 0) {
      o.push({ kind: 'poly', pts, style: 'accent', fill: true, closed: true });
      o.push({ kind: 'dim', a: pts[0]!, b: pts[1]!, offset: -0.45, text: formatLength(w, u) });
      o.push({ kind: 'dim', a: pts[1]!, b: pts[2]!, offset: -0.45, text: formatLength(h, u) });
      o.push({
        kind: 'label',
        p: { x: (pts[0]!.x + pts[1]!.x) / 2, y: (pts[1]!.y + pts[2]!.y) / 2 },
        text: `Floor · ${formatArea(w * h, u)}`,
        style: 'accent',
      });
    }
  }
  if (current) o.push({ kind: 'point', p: current, style: 'draft' });
  toolUI().set({
    overlay: o,
    cursor: 'crosshair',
    input: text && current ? { label: 'Width × length', text, p: current } : null,
  });
}

function addRect(pts: Vec2[]) {
  const w = pts[1]!.x - pts[0]!.x;
  const h = pts[2]!.y - pts[1]!.y;
  if (w < 0.3 || h < 0.3) return false;
  const lid = activeLevel().id;
  let id = '';
  doc().mutate('Add floor', (d) => {
    id = ops.addSlab(d as Project, lid, pts);
  });
  editor().select([id]);
  editor().notify(`Floor added · ${formatArea(w * h, units())}`);
  return true;
}

/** Click inside a room: give it its floor back. */
function restoreFloorAt(p: Vec2) {
  const level = activeLevel();
  const room = level.rooms.find((r) => pointInPolygon(p, roomPolygon(level, r)));
  if (!room) {
    editor().notify('Drag to draw a floor, or click inside a room without a floor');
    return;
  }
  if (room.floor !== false) {
    editor().notify(`${room.name} already has a floor`);
    return;
  }
  doc().mutate('Add floor', (d) => {
    const r = (d as Project).building.levels
      .find((l) => l.id === level.id)!
      .rooms.find((x) => x.id === room.id)!;
    r.floor = true;
  });
  editor().select([room.id]);
  editor().notify(`Floor added to ${room.name}`);
}

export const floorTool: Tool = {
  id: 'floor',
  onActivate() {
    start = null;
    text = '';
    render();
  },
  onDeactivate() {
    start = null;
    toolUI().reset();
  },
  onPointerDown(e) {
    if (e.button !== 0) return false;
    start = snap(e).point;
    current = start;
    render();
    return true;
  },
  onPointerMove(e) {
    current = snap(e).point;
    editor().setCursor(current);
    render();
  },
  onPointerUp(e) {
    if (!start) return;
    const end = snap(e).point;
    const pts = rectPts(start, end);
    const tiny = pts[1]!.x - pts[0]!.x < 0.3 || pts[2]!.y - pts[1]!.y < 0.3;
    if (tiny) restoreFloorAt(start);
    else addRect(pts);
    start = null;
    render();
  },
  onKeyDown(e) {
    const t = typingKey(e, text);
    if (t?.kind === 'update') {
      text = t.text;
      render();
      return true;
    }
    if (t?.kind === 'cancel') {
      text = '';
      render();
      return true;
    }
    if (t?.kind === 'enter') {
      const dims = parseDimensions(t.text, units());
      text = '';
      if (dims && current) addRect(rectPts(current, { x: current.x + dims[0], y: current.y + dims[1] }));
      else editor().notify('Type a size like 4x3');
      render();
      return true;
    }
    if (e.key === 'Escape') {
      if (start) {
        start = null;
        render();
      } else editor().setTool('select');
      return true;
    }
    return false;
  },
  hint() {
    if (text) return 'Enter to add the floor (e.g. 4x3) · Esc to clear';
    if (start) return 'Release to add the floor';
    return 'Drag to add a floor (patio, landing…) · click a room without a floor to restore it · type 4x3 + Enter';
  },
};
