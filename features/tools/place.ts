import type { Tool, Overlay } from './types';
import { activeLevel, doc, editor, project, stepFor } from './context';
import { toolUI } from './store';
import { placeItem, pointedWall } from './placement';
import { getElement } from '@/registry';
import * as ops from '@/core/model/ops';
import type { Item, Project } from '@/core/model/schema';
import { newItem } from '@/store/actions';
import { itemFootprint, itemIssues } from '@/core/model/footprint';

let rotation = 0;
let preview: Omit<Item, 'id'> | null = null;
let lastType: string | null = null;

function placeType(): string | null {
  const p = editor().place;
  return p?.kind === 'element' ? p.id : null;
}

function outdoor() {
  const id = placeType();
  return id ? getElement(id)?.kind === 'outdoor' || editor().mode === 'exterior' : false;
}

export const placeTool: Tool = {
  id: 'place',
  onActivate() {
    preview = null;
    toolUI().set({ cursor: 'copy' });
  },
  onDeactivate() {
    preview = null;
    toolUI().reset();
  },
  onPointerMove(e) {
    const type = placeType();
    const def = type ? getElement(type) : undefined;
    if (!def) return;
    if (type !== lastType) {
      rotation = 0;
      lastType = type;
    }
    const isOut = outdoor();
    const level = activeLevel();
    const base = newItem(def.id, e.point.x, e.point.y, rotation)!;
    const ground = isOut ? project().building.levels[0]! : level;
    const others = isOut ? project().exterior.items : level.items;
    // Pointing at a wall face in 3D: place against that face, not on the floor behind it.
    const pointed = pointedWall(ground, e.hitId, e.hitPoint);
    const pl = placeItem(pointed?.point ?? e.point, def, base.size, rotation, ground, {
      step: stepFor(e),
      disabled: e.alt,
      others,
    });
    preview = { ...base, x: pl.x, y: pl.y, rotation: pl.rotation };
    editor().setCursor({ x: pl.x, y: pl.y });
    const ghostItem = { ...preview, id: 'preview' };
    const issues = itemIssues(isOut ? null : level, others, ghostItem);
    const o: Overlay[] = [
      {
        kind: 'poly',
        pts: itemFootprint(ghostItem),
        style: issues.length ? 'danger' : 'accent',
        closed: true,
      },
    ];
    toolUI().set({
      ghost: { kind: 'item', item: ghostItem, levelId: isOut ? null : level.id, invalid: issues.length > 0 },
      overlay: o,
      snap: pl.label ? { label: pl.label, p: { x: pl.x, y: pl.y } } : null,
      tip: issues.length
        ? { text: issues[0]!.kind === 'blocks-door' ? 'Blocks a door' : 'Overlaps another item', p: e.point }
        : null,
      cursor: 'copy',
    });
  },
  onPointerDown(e) {
    if (e.button !== 0 || !preview) return false;
    const isOut = outdoor();
    const levelId = isOut ? null : activeLevel().id;
    const it = preview;
    let id = '';
    doc().mutate(`Add ${getElement(it.type)?.name.toLowerCase() ?? 'item'}`, (d) => {
      id = ops.addItem(d as Project, levelId, it);
    });
    editor().select([id]);
    if (editor().place?.dragging || !e.shift) editor().setTool('select');
    return true;
  },
  onPointerUp(e) {
    if (editor().place?.dragging && preview) placeTool.onPointerDown!({ ...e, button: 0 });
  },
  onKeyDown(e) {
    if (e.key === 'r' || e.key === 'R') {
      rotation += (e.shiftKey ? -1 : 1) * (e.altKey ? Math.PI / 12 : Math.PI / 2);
      return true;
    }
    if (e.key === 'Escape') {
      editor().setTool('select');
      return true;
    }
    return false;
  },
  hint() {
    const def = placeType() ? getElement(placeType()!) : undefined;
    if (!def) return 'Pick something from the catalog';
    return `Click to place the ${def.name.toLowerCase()} · snaps against walls · R rotates · Alt for free placement · Shift-click to keep placing`;
  },
};
