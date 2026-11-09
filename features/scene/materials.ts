import * as THREE from 'three';
import { getMaterial } from '@/registry/materials';

/**
 * Shared three.js materials keyed by material id (+ variant). Every surface in the scene goes
 * through here, so textured materials later only need `maps` support in `create`.
 */
type Variant = 'normal' | 'ghost' | 'preview' | 'danger';
const cache = new Map<string, THREE.Material>();
const textureLoader = typeof window !== 'undefined' ? new THREE.TextureLoader() : null;

function loadMap(url: string, repeat: [number, number], srgb: boolean) {
  const tex = textureLoader!.load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / repeat[0], 1 / repeat[1]);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function create(id: string, variant: Variant): THREE.Material {
  const def = getMaterial(id);
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(def.color),
    roughness: def.roughness,
    metalness: def.metalness,
  });
  if (def.emissive) {
    m.emissive = new THREE.Color(def.emissive);
    m.emissiveIntensity = def.emissiveIntensity ?? 0.3;
  }
  if (def.maps && textureLoader) {
    const rep = def.uvScale ?? [1, 1];
    if (def.maps.color) m.map = loadMap(def.maps.color, rep, true);
    if (def.maps.normal) m.normalMap = loadMap(def.maps.normal, rep, false);
    if (def.maps.roughness) m.roughnessMap = loadMap(def.maps.roughness, rep, false);
  }
  if (def.opacity !== undefined && def.opacity < 1) {
    m.transparent = true;
    m.opacity = def.opacity;
    m.depthWrite = false;
  }
  if (variant === 'ghost') {
    m.transparent = true;
    m.opacity = 0.18;
    m.depthWrite = false;
  } else if (variant === 'preview') {
    m.transparent = true;
    m.opacity = 0.6;
    m.depthWrite = false;
  } else if (variant === 'danger') {
    m.color.lerp(new THREE.Color('#e5484d'), 0.55);
  }
  return m;
}

export function getThreeMaterial(id: string, variant: Variant = 'normal'): THREE.Material {
  const key = `${id}|${variant}`;
  let m = cache.get(key);
  if (!m) {
    m = create(id, variant);
    cache.set(key, m);
  }
  return m;
}

const accentCache = new Map<string, THREE.Material>();
export function accentMaterial(color: string, opacity = 0.18): THREE.Material {
  const key = `${color}|${opacity}`;
  let m = accentCache.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    accentCache.set(key, m);
  }
  return m;
}
