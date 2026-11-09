import type { Tool, Overlay } from './types';
import { activeLevel, doc, editor, snap, units } from './context';
import { toolUI } from './store';
import { typingKey } from './typing';
import * as ops from '@/core/model/ops';
import type { Project } from '@/core/model/schema';
import { formatArea, formatLength, parseDimensions } from '@/core/units/units';
import type { Vec2 } from '@/core/geometry/vec2';

export interface RoomTemplate {
  id: string;
  name: string;
  w: number;
  h: number;
  floor: string;
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  { id: 'bedroom', name: 'Bedroom', w: 3.6, h: 3.4, floor: 'floor-ash' },
  { id: 'bathroom', name: 'Bathroom', w: 2.4, h: 2.2, floor: 'floor-tile-white' },
  { id: 'kitchen', name: 'Kitchen', w: 3.6, h: 3.0, floor: 'floor-terrazzo' },
  { id: 'living', name: 'Living room', w: 5.0, h: 4.2, floor: 'floor-oak' },
  { id: 'office', name: 'Office', w: 3.0, h: 2.8, floor: 'floor-oak' },
  { id: 'hallway', name: 'Hallway', w: 1.4, h: 4.0, floor: 'floor-concrete' },
];

let start: Vec2 | null = null;
let current: Vec2 | null = null;
let dragging = false;
let text = '';

const rect = (a: Vec2, b: Vec2) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });

function template(): RoomTemplate | null {
  const place = editor().place;
  return place?.kind === 'room-template' ? (ROOM_TEMPLATES.find((t) => t.id === place.id) ?? null) : null;
}

function render() {
  const u = units();
  const o: Overlay[] = [];
  const t = template();
  let r: { x: number; y: number; w: number; h: number } | null = null;
  if (t && current) r = { x: current.x, y: current.y, w: t.w, h: t.h };
  else if (start && current) r = rect(start, current);
  if (r && r.w > 0 && r.h > 0) {
    const pts = [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
    ];
    o.push({ kind: 'poly', pts, style: 'accent', fill: true, closed: true });
    o.push({ kind: 'dim', a: pts[0]!, b: pts[1]!, offset: -0.45, text: formatLength(r.w, u) });
    o.push({ kind: 'dim', a: pts[1]!, b: pts[2]!, offset: -0.45, text: formatLength(r.h, u) });
    o.push({ kind: 'label', p: { x: r.x + r.w / 2, y: r.y + r.h / 2 }, text: `${t?.name ?? 'Room'} · ${formatArea(r.w * r.h, u)}`, style: 'accent' });
  }
  if (current) o.push({ kind: 'point', p: current, style: 'draft' });
  toolUI().set({ overlay: o, cursor: 'crosshair', input: text && current ? { label: 'Width × length', text, p: current } : null });
}

function create(x: number, y: number, w: number, h: number, name?: string, floor?: string) {
  if (w < 0.3 || h < 0.3) return;
  const levelId = activeLevel().id;
  let id: string | null = null;
  doc().mutate(name ? `Add ${name.toLowerCase()}` : 'Add room', (d) => {
    id = ops.addRectRoom(d as Project, levelId, x, y, w, h, name, floor);
  });
  if (id) editor().select([id]);
  editor().notify(`${name ?? 'Room'} added · ${formatLength(w, units())} × ${formatLength(h, units())}`);
}

export const roomTool: Tool = {
  id: 'room',
  onActivate() {
    start = null;
    current = null;
    text = '';
    render();
  },
  onDeactivate() {
    start = null;
    toolUI().reset();
  },
  onPointerDown(e) {
    if (e.button !== 0) return false;
    const p = snap(e).point;
    const t = template();
    if (t) {
      create(p.x, p.y, t.w, t.h, t.name, t.floor);
      if (!e.shift) editor().setTool('select');
      return true;
    }
    if (!start) {
      start = p;
      current = p;
      dragging = true;
    } else {
      const r = rect(start, p);
      create(r.x, r.y, r.w, r.h);
      start = null;
    }
    render();
    return true;
  },
  onPointerMove(e) {
    current = snap(e, { anchor: undefined }).point;
    editor().setCursor(current);
    render();
  },
  onPointerUp(e) {
    if (!dragging || !start) return;
    dragging = false;
    const p = snap(e).point;
    const r = rect(start, p);
    if (r.w >= 0.3 && r.h >= 0.3) {
      create(r.x, r.y, r.w, r.h);
      start = null;
    }
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
      if (dims) {
        const at = start ?? current ?? { x: 0, y: 0 };
        create(at.x, at.y, dims[0], dims[1]);
        start = null;
      } else editor().notify('Type a size like 4x3 or 4.5 × 3.2');
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
    if (template()) return `Click to place the ${template()!.name.toLowerCase()} · Shift-click to keep placing · Esc to cancel`;
    if (text) return 'Enter to create the room (e.g. 4x3) · Esc to clear';
    if (start) return 'Click or release to set the opposite corner · Esc to cancel';
    return 'Drag to draw a room, or type its size (4x3) and press Enter';
  },
};
