'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { entityOutline, itemIssues } from '@/core/model/footprint';
import { findEntity } from '@/core/model/entities';

/** Accent outlines for the selection and hover (consistent for every entity kind). */
export function Highlights({ accent, danger }: { accent: string; danger: string }) {
  const project = useDocument((s) => s.project);
  const selection = useEditor((s) => s.selection);
  const hover = useEditor((s) => s.hover);
  const geo = useMemo(() => {
    const build = (ids: string[]) => {
      const pts: number[] = [];
      for (const id of ids) {
        const o = entityOutline(project, id);
        if (!o) continue;
        for (const poly of o.polygons) {
          for (let i = 0; i < poly.length; i++) {
            const a = poly[i]!;
            const b = poly[(i + 1) % poly.length]!;
            for (const y of [o.y0 + 0.01, o.y1]) pts.push(a.x, y, a.y, b.x, y, b.y);
            pts.push(a.x, o.y0 + 0.01, a.y, a.x, o.y1, a.y);
          }
        }
      }
      return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    };
    const warn = selection.filter((id) => {
      const ref = findEntity(project, id);
      return ref?.kind === 'item' && itemIssues(ref.level, ref.level ? ref.level.items : project.exterior.items, ref.entity).length > 0;
    });
    return {
      sel: build(selection.filter((id) => !warn.includes(id))),
      warn: build(warn),
      hover: build(hover && !selection.includes(hover) ? [hover] : []),
    };
  }, [project, selection, hover]);
  return (
    <group renderOrder={10}>
      <lineSegments geometry={geo.sel}>
        <lineBasicMaterial color={accent} depthTest={false} transparent opacity={0.95} />
      </lineSegments>
      <lineSegments geometry={geo.warn}>
        <lineBasicMaterial color={danger} depthTest={false} transparent opacity={0.95} />
      </lineSegments>
      <lineSegments geometry={geo.hover}>
        <lineBasicMaterial color={accent} depthTest={false} transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}
