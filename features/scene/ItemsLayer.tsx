'use client';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { Item } from '@/core/model/schema';
import { getElement, type ElementDef, type Part } from '@/registry';
import { partGeometry } from './parts';
import { getThreeMaterial } from './materials';

interface Batch {
  key: string;
  def: ElementDef;
  parts: Part[];
  items: Item[];
}

export function itemBatchKey(it: Item) {
  return `${it.type}|${it.size.w.toFixed(3)},${it.size.d.toFixed(3)},${it.size.h.toFixed(3)}|${JSON.stringify(it.params)}|${JSON.stringify(it.materials)}`;
}

export function resolveSlot(def: ElementDef, item: Pick<Item, 'materials'>, slot: string) {
  return item.materials[slot] ?? def.slots[slot]?.default ?? slot;
}

/**
 * Furniture / outdoor items, instanced: identical items (type + size + params + materials) share
 * one InstancedMesh per part, so 100 chairs cost the same draw calls as one.
 */
export function ItemsLayer({
  items,
  baseY,
  variant,
  ceilingY,
  pickable = true,
}: {
  items: Item[];
  baseY: number;
  variant: 'normal' | 'ghost';
  ceilingY?: number;
  /** Decorative items (environment scatter) are not selectable. */
  pickable?: boolean;
}) {
  const batches = useMemo(() => {
    const map = new Map<string, Batch>();
    for (const it of items) {
      if (it.hidden) continue;
      const def = getElement(it.type);
      if (!def) continue;
      const key = itemBatchKey(it);
      let b = map.get(key);
      if (!b) {
        b = { key, def, parts: def.build({ size: it.size, params: { ...it.params } }), items: [] };
        map.set(key, b);
      }
      b.items.push(it);
    }
    return [...map.values()];
  }, [items]);

  return (
    <>
      {batches.map((b) => (
        <BatchMeshes
          key={b.key}
          batch={b}
          baseY={baseY}
          variant={variant}
          ceilingY={ceilingY}
          pickable={pickable}
        />
      ))}
    </>
  );
}

const tmpItem = new THREE.Matrix4();
const tmpPart = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpV = new THREE.Vector3();
const one = new THREE.Vector3(1, 1, 1);

export function itemMatrix(
  it: Item,
  baseY: number,
  def: ElementDef,
  ceilingY: number | undefined,
  out = new THREE.Matrix4(),
) {
  let y = baseY + it.z;
  if (def.snap === 'ceiling' && ceilingY !== undefined) y = Math.max(baseY, ceilingY - it.size.h);
  tmpQ.setFromEuler(tmpE.set(0, -it.rotation, 0));
  return out.compose(tmpV.set(it.x, y, it.y), tmpQ, one);
}

function BatchMeshes({
  batch,
  baseY,
  variant,
  ceilingY,
  pickable,
}: {
  batch: Batch;
  baseY: number;
  variant: 'normal' | 'ghost';
  ceilingY?: number;
  pickable: boolean;
}) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const invalidate = useThree((s) => s.invalidate);
  const ids = useMemo(() => batch.items.map((i) => i.id), [batch.items]);

  useLayoutEffect(() => {
    batch.parts.forEach((p, pi) => {
      const mesh = refs.current[pi];
      if (!mesh) return;
      tmpQ.setFromEuler(tmpE.set(...(p.rotation ?? [0, 0, 0])));
      tmpPart.compose(tmpV.set(...p.position), tmpQ, one);
      batch.items.forEach((it, ii) => {
        itemMatrix(it, baseY, batch.def, ceilingY, tmpItem);
        mesh.setMatrixAt(ii, tmpItem.clone().multiply(tmpPart));
      });
      mesh.count = batch.items.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.computeBoundingBox();
    });
    invalidate();
  }, [batch, baseY, ceilingY, invalidate]);

  const first = batch.items[0]!;
  return (
    <>
      {batch.parts.map((p, pi) => (
        <instancedMesh
          key={`${pi}-${batch.items.length}`}
          ref={(m) => {
            refs.current[pi] = m;
          }}
          args={[
            partGeometry(p.geom),
            getThreeMaterial(resolveSlot(batch.def, first, p.material), variant),
            batch.items.length,
          ]}
          castShadow={!p.noShadow && variant === 'normal'}
          receiveShadow={variant === 'normal'}
          userData={pickable ? { pick: true, instanceIds: ids } : undefined}
          frustumCulled={false}
        />
      ))}
    </>
  );
}
