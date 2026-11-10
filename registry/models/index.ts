import {
  Armchair,
  Box,
  LampCeiling,
  Sofa,
  Sprout,
  Table,
  TreeDeciduous,
  Archive,
  Lamp,
  Frame,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ElementDef, SnapSurface } from '../types';
import manifest from './models.generated.json';

/**
 * Real 3D models (CC0, Poly Haven), packed by scripts/fetch-models.mjs. Each becomes an ordinary
 * catalog element: same placement, snapping, inspector, collision and instancing as the
 * procedural pieces. To add one: list it in the script, run it, done.
 */
interface ModelMeta {
  id: string;
  asset: string;
  name: string;
  kind: 'furniture' | 'outdoor';
  category: string;
  tags?: string[];
  snap?: SnapSurface;
  elevation?: number;
  light?: boolean;
  solid?: boolean;
  url: string;
  thumb: string;
  size: { w: number; d: number; h: number };
  origin: { x: number; y: number; z: number };
  source: string;
}

function icon(m: ModelMeta): LucideIcon {
  if (m.tags?.includes('tree')) return TreeDeciduous;
  if (m.category === 'Lighting') return m.snap === 'ceiling' ? LampCeiling : Lamp;
  if (m.tags?.includes('plant')) return Sprout;
  if (/sofa/i.test(m.name)) return Sofa;
  if (/chair|stool/i.test(m.name)) return Armchair;
  if (/table/i.test(m.name)) return Table;
  if (/cabinet|drawer|shelf|shelves|nightstand/i.test(m.name)) return Archive;
  if (m.snap === 'wall') return Frame;
  return Box;
}

const TREE_TRUNK = () =>
  Array.from({ length: 8 }, (_, i) => ({
    x: Math.cos((i / 8) * Math.PI * 2) * 0.25,
    y: Math.sin((i / 8) * Math.PI * 2) * 0.25,
  }));

export const MODELS: ElementDef[] = Object.values(manifest as unknown as Record<string, ModelMeta>).map(
  (m) => {
    const snap: SnapSurface = m.snap ?? (m.kind === 'outdoor' ? 'ground' : 'floor');
    const isTree = !!m.tags?.includes('tree');
    return {
      id: m.id,
      name: m.name,
      kind: m.kind,
      category: m.category,
      icon: icon(m),
      tags: [...(m.tags ?? []), 'model', 'realistic'],
      size: { ...m.size },
      minSize: { w: m.size.w * 0.3, d: m.size.d * 0.3, h: m.size.h * 0.3 },
      slots: {},
      snap,
      elevation: m.elevation ?? (snap === 'ceiling' ? Math.max(0.3, 2.75 - m.size.h) : undefined),
      solid: m.solid ?? (snap === 'ceiling' || snap === 'wall' ? false : undefined),
      wallOffset: 0.03,
      light: m.light
        ? {
            y: snap === 'ceiling' ? m.size.h * 0.25 : -Math.min(0.2, m.size.h * 0.3),
            intensity: snap === 'ceiling' ? 10 : 5,
            distance: 10,
          }
        : undefined,
      footprint: isTree ? TREE_TRUNK : undefined,
      build: () => [],
      model: { url: m.url, origin: m.origin, size: m.size },
      thumb: m.thumb,
      source: m.source,
    } satisfies ElementDef;
  },
);
