import type { Overlay } from './types';
import type { Project } from '@/core/model/schema';
import { findEntity } from '@/core/model/entities';
import { getElement } from '@/registry';
import { itemToPlan } from '@/core/model/footprint';

/** On-canvas handles for the current selection. */
export function selectionHandles(project: Project, selection: string[], mode: string): Overlay[] {
  if (selection.length !== 1) return [];
  const ref = findEntity(project, selection[0]!);
  if (!ref) return [];
  const out: Overlay[] = [];
  if ((ref.entity as { locked?: boolean }).locked) return out;
  if (ref.kind === 'item') {
    const it = ref.entity;
    const def = getElement(it.type);
    out.push({ kind: 'handle', id: `rot:${it.id}`, p: itemToPlan(it, { x: 0, y: it.size.d / 2 + 0.4 }), shape: 'rotate', cursor: 'grab' });
    const rs = def?.resizable ?? {};
    const canW = rs.w !== false;
    const canD = rs.d !== false;
    if (canW || canD) {
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          out.push({
            kind: 'handle',
            id: `res:${it.id}:${sx}:${sz}`,
            p: itemToPlan(it, { x: (sx * it.size.w) / 2, y: (sz * it.size.d) / 2 }),
            shape: 'square',
            cursor: 'nwse-resize',
          });
    }
  } else if (ref.kind === 'wall' && (mode === 'build' || mode === 'plan')) {
    for (const nid of [ref.entity.a, ref.entity.b]) {
      const n = ref.level.nodes.find((x) => x.id === nid);
      if (n) out.push({ kind: 'handle', id: `node:${nid}`, p: { x: n.x, y: n.y }, shape: 'circle', cursor: 'move' });
    }
  } else if (ref.kind === 'room' && (mode === 'build' || mode === 'plan')) {
    for (const nid of ref.entity.nodes) {
      const n = ref.level.nodes.find((x) => x.id === nid);
      if (n) out.push({ kind: 'handle', id: `node:${nid}`, p: { x: n.x, y: n.y }, shape: 'circle', cursor: 'move' });
    }
  } else if (ref.kind === 'stair') {
    const s = ref.entity;
    out.push({ kind: 'handle', id: `srot:${s.id}`, p: itemToPlan(s, { x: 0, y: s.length / 2 + 0.4 }), shape: 'rotate', cursor: 'grab' });
  }
  return out;
}
