import type { Tool, Overlay } from './types';
import { activeLevel, doc, editor, snapRadius, stepFor, units } from './context';
import { toolUI } from './store';
import { placeOpening } from './placement';
import { getOpening, defaultParams } from '@/registry';
import * as ops from '@/core/model/ops';
import type { Opening, Project } from '@/core/model/schema';
import { add, scale } from '@/core/geometry/vec2';
import { formatLength } from '@/core/units/units';

let preview: Omit<Opening, 'id'> | null = null;

export function openingType(): string {
  const p = editor().place;
  return p?.kind === 'opening' ? p.id : 'door-single';
}

function clear() {
  preview = null;
  toolUI().set({ ghost: null, overlay: [] });
}

export const openingTool: Tool = {
  id: 'opening',
  onActivate() {
    clear();
    toolUI().set({ cursor: 'copy' });
  },
  onDeactivate() {
    preview = null;
    toolUI().reset();
  },
  onPointerMove(e) {
    const def = getOpening(openingType());
    if (!def) return;
    const level = activeLevel();
    editor().setCursor(e.point);
    const width = preview?.type === def.id ? preview.width : def.defaults.width;
    const pl = placeOpening(e.point, width, level, {
      step: stepFor(e),
      disabled: e.alt,
      radius: snapRadius(e) * 3,
    });
    if (!pl) {
      clear();
      toolUI().set({ cursor: 'not-allowed', tip: { text: 'Move over a wall', p: e.point } });
      return;
    }
    preview = {
      type: def.id,
      wallId: pl.wallId,
      offset: pl.offset,
      width,
      height: def.defaults.height,
      sill: def.defaults.sill,
      flip: def.kind === 'door' ? pl.flip : false,
      mirror: false,
      params: defaultParams(def),
    };
    const u = units();
    const e0 = add(pl.a, scale(pl.dir, pl.offset - width / 2));
    const e1 = add(pl.a, scale(pl.dir, pl.offset + width / 2));
    const end = add(pl.a, scale(pl.dir, pl.length));
    const o: Overlay[] = [
      {
        kind: 'dim',
        a: pl.a,
        b: e0,
        offset: pl.thickness / 2 + 0.35,
        text: formatLength(pl.offset - width / 2, u),
      },
      {
        kind: 'dim',
        a: e1,
        b: end,
        offset: pl.thickness / 2 + 0.35,
        text: formatLength(pl.length - pl.offset - width / 2, u),
      },
    ];
    toolUI().set({
      ghost: { kind: 'opening', opening: { ...preview, id: 'preview' }, levelId: level.id },
      overlay: o,
      cursor: 'copy',
      tip: null,
    });
  },
  onPointerDown(e) {
    if (e.button !== 0) return false;
    if (!preview) {
      editor().notify('Doors and windows go on walls: hover a wall first');
      return true;
    }
    const levelId = activeLevel().id;
    const p = preview;
    let id = '';
    doc().mutate(`Add ${getOpening(p.type)?.name.toLowerCase() ?? 'opening'}`, (d) => {
      id = ops.addOpening(d as Project, levelId, p);
    });
    editor().select([id]);
    if (editor().place?.dragging || !e.shift) {
      editor().setTool('select');
    }
    return true;
  },
  onPointerUp(e) {
    // Released after dragging from the catalog: place it.
    if (editor().place?.dragging && preview) openingTool.onPointerDown!({ ...e, button: 0 });
  },
  onKeyDown(e) {
    if (e.key === 'Escape') {
      editor().setTool('select');
      return true;
    }
    return false;
  },
  hint() {
    const def = getOpening(openingType());
    return preview
      ? `Click to place the ${def?.name.toLowerCase() ?? 'opening'} · it slides along the wall in round steps · Shift-click to keep placing`
      : `Hover a wall to place a ${def?.name.toLowerCase() ?? 'door'} · Esc to cancel`;
  },
};
