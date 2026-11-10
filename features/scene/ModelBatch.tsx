'use client';
import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Item } from '@/core/model/schema';
import type { ElementDef } from '@/registry';

type Variant = 'normal' | 'ghost' | 'preview' | 'danger';

interface ModelPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  /** Mesh transform relative to the model root. */
  matrix: THREE.Matrix4;
}

/** Flatten a loaded glTF into mesh parts with their local transforms (cached per URL). */
const partsCache = new Map<string, ModelPart[]>();
function modelParts(url: string, scene: THREE.Object3D): ModelPart[] {
  const hit = partsCache.get(url);
  if (hit) return hit;
  scene.updateMatrixWorld(true);
  const root = new THREE.Matrix4().copy(scene.matrixWorld).invert();
  const parts: ModelPart[] = [];
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      // Keep PBR maps but let the scene's environment light it.
      if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial)
        (m as THREE.MeshStandardMaterial).envMapIntensity = 1;
      parts.push({
        geometry: mesh.geometry,
        material: m,
        matrix: new THREE.Matrix4().multiplyMatrices(root, mesh.matrixWorld),
      });
    }
  });
  partsCache.set(url, parts);
  return parts;
}

const variantCache = new WeakMap<THREE.Material, Map<Variant, THREE.Material>>();
function variantMaterial(m: THREE.Material, v: Variant): THREE.Material {
  if (v === 'normal') return m;
  let byV = variantCache.get(m);
  if (!byV) variantCache.set(m, (byV = new Map()));
  let out = byV.get(v);
  if (!out) {
    out = m.clone();
    out.transparent = true;
    out.depthWrite = false;
    out.opacity = v === 'ghost' ? 0.18 : 0.6;
    if (v === 'danger' && (out as THREE.MeshStandardMaterial).color)
      (out as THREE.MeshStandardMaterial).color.lerp(new THREE.Color('#e5484d'), 0.55);
    byV.set(v, out);
  }
  return out;
}

const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();

/** World matrix that maps model space onto an item (position, rotation, resized footprint). */
export function modelItemMatrix(def: ElementDef, it: Item, baseY: number, out = new THREE.Matrix4()) {
  const m = def.model!;
  tmpQ.setFromEuler(tmpE.set(0, -it.rotation, 0));
  tmpS.set(it.size.w / m.size.w, it.size.h / m.size.h, it.size.d / m.size.d);
  out.compose(tmpV.set(it.x, baseY + it.z, it.y), tmpQ, tmpS);
  return out.multiply(new THREE.Matrix4().makeTranslation(-m.origin.x, -m.origin.y, -m.origin.z));
}

function Instanced({
  def,
  items,
  baseY,
  variant,
  pickable,
}: {
  def: ElementDef;
  items: Item[];
  baseY: number;
  variant: Variant;
  pickable: boolean;
}) {
  const gltf = useGLTF(def.model!.url, false, true);
  const parts = useMemo(() => modelParts(def.model!.url, gltf.scene), [def, gltf.scene]);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const invalidate = useThree((s) => s.invalidate);
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  useLayoutEffect(() => {
    const M = new THREE.Matrix4();
    parts.forEach((p, pi) => {
      const mesh = refs.current[pi];
      if (!mesh) return;
      items.forEach((it, ii) => {
        modelItemMatrix(def, it, baseY, M);
        mesh.setMatrixAt(ii, M.multiply(p.matrix));
      });
      mesh.count = items.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
    invalidate();
  }, [parts, items, def, baseY, invalidate]);
  return (
    <>
      {parts.map((p, pi) => (
        <instancedMesh
          key={`${pi}-${items.length}`}
          ref={(m) => {
            refs.current[pi] = m;
          }}
          args={[p.geometry, variantMaterial(p.material, variant), items.length]}
          castShadow={variant === 'normal'}
          receiveShadow={variant === 'normal'}
          userData={pickable ? { pick: true, instanceIds: ids } : undefined}
          frustumCulled={false}
        />
      ))}
    </>
  );
}

/** All items of one model type, instanced. Loads the GLB lazily. */
export function ModelBatch(props: {
  def: ElementDef;
  items: Item[];
  baseY: number;
  variant: Variant;
  pickable: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <Instanced {...props} />
    </Suspense>
  );
}
