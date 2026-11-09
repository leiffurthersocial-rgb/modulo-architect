import type { Tool, ToolPointerEvent, Overlay } from './types';
import { activeLevel, doc, editor, snap, snapTargets, units } from './context';
import { toolUI } from './store';
import { typingKey } from './typing';
import * as ops from '@/core/model/ops';
import type { Project } from '@/core/model/schema';
import { add, angleOf, dist, equals, normalize, scale, sub, type Vec2 } from '@/core/geometry/vec2';
import { formatAngle, formatLength, parseValue } from '@/core/units/units';
import { DEFAULTS, defaultWallProps } from '@/core/model/defaults';

let points: Vec2[] = [];
let cursor: Vec2 | null = null;
let text = '';
let lastEvent: ToolPointerEvent | null = null;
let thickness: number = DEFAULTS.wallThickness;

export function setWallThickness(t: number) {
  thickness = t;
}
export const getWallThickness = () => thickness;

function render() {
  const o: Overlay[] = [];
  const u = units();
  for (let i = 0; i < points.length - 1; i++) o.push({ kind: 'line', a: points[i]!, b: points[i + 1]!, style: 'accent' });
  const last = points[points.length - 1];
  if (last && cursor) {
    o.push({ kind: 'line', a: last, b: cursor, style: 'draft' });
    const L = dist(last, cursor);
    if (L > 0.01) {
      o.push({ kind: 'dim', a: last, b: cursor, offset: 0.45, text: formatLength(L, u) });
      const ang = -angleOf(sub(cursor, last));
      o.push({ kind: 'label', p: add(last, { x: 0.35, y: -0.35 }), text: formatAngle(((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)), style: 'dim' });
    }
  }
  for (const p of points) o.push({ kind: 'point', p, style: 'accent' });
  if (cursor) o.push({ kind: 'point', p: cursor, style: 'draft' });
  const s = toolUI().snap;
  toolUI().set({
    overlay: [...o, ...(lastGuides ?? []).map((g) => ({ kind: 'line' as const, a: g.a, b: g.b, style: 'guide' as const, dashed: true }))],
    input: text && cursor ? { label: 'Length', text, p: cursor } : null,
    snap: s,
    cursor: 'crosshair',
  });
}

let lastGuides: { a: Vec2; b: Vec2 }[] | null = null;

function commitSegment(a: Vec2, b: Vec2) {
  const levelId = activeLevel().id;
  const before = activeLevel().rooms.length;
  doc().mutate('Draw wall', (d) => {
    ops.addWallChain(d as Project, levelId, [a, b], defaultWallProps(thickness));
  });
  const after = activeLevel().rooms.length;
  if (after > before) {
    editor().notify('Room created');
    return true;
  }
  return false;
}

function finish() {
  points = [];
  text = '';
  render();
}

function place(p: Vec2) {
  const last = points[points.length - 1];
  if (!last) {
    points = [p];
    render();
    return;
  }
  if (dist(last, p) < 0.05) return;
  const closedRoom = commitSegment(last, p);
  if (equals(p, points[0]!, 1e-3) || closedRoom) {
    finish();
    return;
  }
  points.push(p);
  render();
}

export const wallTool: Tool = {
  id: 'wall',
  onActivate() {
    points = [];
    text = '';
    cursor = null;
    render();
  },
  onDeactivate() {
    points = [];
    text = '';
    toolUI().reset();
  },
  onPointerDown(e) {
    if (e.button !== 0) return false;
    const r = snap(e, { anchor: points[points.length - 1] });
    place(r.point);
    return true;
  },
  onPointerMove(e) {
    lastEvent = e;
    const anchor = points[points.length - 1];
    const r = snap(e, { anchor, target: snapTargets(activeLevel()) });
    cursor = r.point;
    lastGuides = r.guides.length && anchor ? r.guides.filter((g) => !(equals(g.a, anchor) && equals(g.b, r.point))) : r.guides;
    if (!anchor) lastGuides = r.guides;
    editor().setCursor(cursor);
    render();
  },
  onDoubleClick() {
    finish();
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
      const L = parseValue(t.text, 'length', units());
      const last = points[points.length - 1];
      text = '';
      if (L && L > 0 && last && cursor) {
        let dir = normalize(sub(cursor, last));
        if (dir.x === 0 && dir.y === 0) dir = { x: 1, y: 0 };
        place(add(last, scale(dir, L)));
      } else if (L && L > 0 && !last && cursor) {
        points = [cursor];
        place(add(cursor, { x: L, y: 0 }));
      } else editor().notify('Type a length like 3.5, 350cm or 2.5*3');
      if (lastEvent) wallTool.onPointerMove!(lastEvent);
      render();
      return true;
    }
    if (e.key === 'Enter' && points.length) {
      finish();
      return true;
    }
    if (e.key === 'Escape') {
      if (points.length) finish();
      else editor().setTool('select');
      return true;
    }
    if (e.key === 'Backspace' && points.length > 1) {
      // Step back: undo the last segment.
      doc().undo();
      points.pop();
      render();
      return true;
    }
    return false;
  },
  hint() {
    if (text) return 'Enter to apply the typed length · Esc to clear';
    if (points.length === 0) return 'Click to start a wall · type a length after the first point · Alt disables snapping';
    if (points.length === 1) return 'Click the next point, or type a length and press Enter · Shift locks the axis · Esc to stop';
    return 'Keep clicking · close the loop to create a room · double-click or Esc to finish';
  },
};
