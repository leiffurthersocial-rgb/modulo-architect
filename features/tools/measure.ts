import type { Tool, Overlay } from './types';
import { editor, snap, units } from './context';
import { toolUI } from './store';
import { dist, type Vec2 } from '@/core/geometry/vec2';
import { formatLength } from '@/core/units/units';

let a: Vec2 | null = null;
let cursor: Vec2 | null = null;
const done: [Vec2, Vec2][] = [];

function render() {
  const u = units();
  const o: Overlay[] = [];
  for (const [p, q] of done) o.push({ kind: 'dim', a: p, b: q, offset: 0, text: formatLength(dist(p, q), u), style: 'accent' });
  if (a && cursor) o.push({ kind: 'dim', a, b: cursor, offset: 0, text: formatLength(dist(a, cursor), u), style: 'draft' });
  if (cursor) o.push({ kind: 'point', p: cursor, style: 'draft' });
  if (a) o.push({ kind: 'point', p: a, style: 'accent' });
  toolUI().set({ overlay: o, cursor: 'crosshair' });
}

export const measureTool: Tool = {
  id: 'measure',
  onActivate() {
    a = null;
    render();
  },
  onDeactivate() {
    a = null;
    done.length = 0;
    toolUI().reset();
  },
  onPointerDown(e) {
    if (e.button !== 0) return false;
    const p = snap(e, { anchor: a ?? undefined }).point;
    if (!a) a = p;
    else {
      done.push([a, p]);
      if (done.length > 12) done.shift();
      editor().notify(`Distance ${formatLength(dist(a, p), units())}`);
      a = null;
    }
    render();
    return true;
  },
  onPointerMove(e) {
    cursor = snap(e, { anchor: a ?? undefined }).point;
    editor().setCursor(cursor);
    render();
  },
  onKeyDown(e) {
    if (e.key === 'Escape') {
      if (a || done.length) {
        a = null;
        done.length = 0;
        render();
      } else editor().setTool('select');
      return true;
    }
    return false;
  },
  hint: () => (a ? 'Click the second point · Shift locks the axis' : 'Click two points to measure · Esc clears'),
};
