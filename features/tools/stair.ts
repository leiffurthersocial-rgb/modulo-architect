import type { Tool } from './types';
import { activeLevel, doc, editor, snap } from './context';
import { toolUI } from './store';
import * as ops from '@/core/model/ops';
import type { Project, Stair } from '@/core/model/schema';
import { DEFAULTS } from '@/core/model/defaults';
import { DEFAULT_MATERIALS } from '@/registry/materials';

let rotation = 0;
let preview: Omit<Stair, 'id'> | null = null;

function stairType(): Stair['type'] {
  const p = editor().place;
  return p?.kind === 'element' && p.id === 'l-shaped' ? 'l-shaped' : 'straight';
}

export const stairTool: Tool = {
  id: 'stair',
  onActivate() {
    preview = null;
    toolUI().set({ cursor: 'copy' });
  },
  onDeactivate() {
    toolUI().reset();
  },
  onPointerMove(e) {
    const p = snap(e).point;
    editor().setCursor(p);
    const level = activeLevel();
    const type = stairType();
    preview = {
      type,
      x: p.x,
      y: p.y,
      rotation,
      width: DEFAULTS.stairWidth,
      length: type === 'straight' ? Math.round(((level.height / 0.18) * 0.26) * 10) / 10 : 2.2,
      length2: 1.6,
      turn: 'left',
      rise: null,
      material: DEFAULT_MATERIALS.stair,
    };
    toolUI().set({ ghost: { kind: 'stair', stair: { ...preview, id: 'preview' }, levelId: level.id }, cursor: 'copy' });
  },
  onPointerDown(e) {
    if (e.button !== 0 || !preview) return false;
    const lid = activeLevel().id;
    const s = preview;
    let id = '';
    doc().mutate('Add stairs', (d) => {
      id = ops.addStair(d as Project, lid, s);
    });
    editor().select([id]);
    const levels = doc().project.building.levels;
    if (levels[levels.length - 1]!.id === lid) editor().notify('Stairs added · add a level above to climb to');
    editor().setTool('select');
    return true;
  },
  onKeyDown(e) {
    if (e.key === 'r' || e.key === 'R') {
      rotation += e.shiftKey ? -Math.PI / 2 : Math.PI / 2;
      if (preview) {
        preview.rotation = rotation;
        toolUI().set({ ghost: { kind: 'stair', stair: { ...preview, id: 'preview' }, levelId: activeLevel().id } });
      }
      return true;
    }
    if (e.key === 'Escape') {
      editor().setTool('select');
      return true;
    }
    return false;
  },
  hint: () => 'Click to place stairs (they climb to the level above) · R rotates 90° · Esc to cancel',
};
