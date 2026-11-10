import * as THREE from 'three';
import { getMaterial, type MaterialDef } from '@/registry/materials';

/**
 * Shared three.js materials keyed by material id (+ variant). Textured materials load their
 * CC0 scans lazily (colour / normal / packed AO-roughness), tiled at real-world scale: every
 * generated mesh in Modulo carries UVs in meters, so `repeat = 1 / uvScale`.
 */
type Variant = 'normal' | 'ghost' | 'preview' | 'danger';
const cache = new Map<string, THREE.Material>();
const textures = new Map<string, THREE.Texture>();
const loader = typeof window !== 'undefined' ? new THREE.TextureLoader() : null;

/* Frame-on-demand rendering needs a nudge when an image arrives. */
const listeners = new Set<() => void>();
export function onTextureLoaded(cb: () => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}
let pending = 0;
export const texturesPending = () => pending;

let maxAnisotropy = 8;
export function setMaxAnisotropy(n: number) {
  maxAnisotropy = Math.min(16, Math.max(1, n));
}

function loadTexture(url: string, def: MaterialDef, srgb: boolean): THREE.Texture {
  const [u, v] = def.uvScale ?? [1, 1];
  const key = `${url}|${u}|${v}|${def.rotation ?? 0}`;
  let tex = textures.get(key);
  if (tex) return tex;
  pending += 1;
  tex = loader!.load(
    url,
    () => {
      pending -= 1;
      listeners.forEach((l) => l());
    },
    undefined,
    () => {
      pending -= 1;
    },
  );
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / u, 1 / v);
  tex.rotation = def.rotation ?? 0;
  tex.anisotropy = maxAnisotropy;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  textures.set(key, tex);
  return tex;
}

function create(id: string, variant: Variant, scale = 1): THREE.Material {
  const base = getMaterial(id);
  const def: MaterialDef =
    scale === 1 || !base.uvScale
      ? base
      : { ...base, uvScale: [base.uvScale[0] * scale, base.uvScale[1] * scale] };
  const textured = !!def.maps?.color && !!loader;
  const color = new THREE.Color(textured && !def.tinted ? '#ffffff' : def.color);
  if (textured && def.brightness) color.multiplyScalar(def.brightness);
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: def.roughness,
    metalness: def.metalness,
  });
  if (def.maps?.normal && !textured && loader) {
    // Normal-only materials (water): flat colour with real surface detail.
    m.normalMap = loadTexture(def.maps.normal, def, false);
    const s = def.normalScale ?? 1;
    m.normalScale.set(s, s);
  }
  if (textured) {
    const maps = def.maps!;
    m.map = loadTexture(maps.color!, def, true);
    if (maps.normal) {
      m.normalMap = loadTexture(maps.normal, def, false);
      const s = def.normalScale ?? 1;
      m.normalScale.set(s, s);
    }
    if (maps.arm) {
      const arm = loadTexture(maps.arm, def, false);
      m.roughnessMap = arm;
      m.aoMap = arm;
      m.aoMapIntensity = 0.85;
    }
  }
  if (textured && def.antiTile) applyAntiTiling(m);
  if (def.emissive) {
    m.emissive = new THREE.Color(def.emissive);
    m.emissiveIntensity = def.emissiveIntensity ?? 0.3;
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

/** `scale` enlarges the texture repeat (for huge surfaces like distant hills). */
/**
 * Hide texture repetition on big surfaces: blend the base sample with a rotated, scaled second
 * sample and modulate with a very low-frequency variation. Cheap and works for any scan.
 */
function applyAntiTiling(m: THREE.MeshStandardMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#ifdef USE_MAP
        vec4 tA = texture2D( map, vMapUv );
        vec2 uvB = mat2( 0.8, -0.6, 0.6, 0.8 ) * vMapUv * 0.41 + vec2( 0.31, 0.77 );
        vec4 tB = texture2D( map, uvB );
        float macro = texture2D( map, vMapUv * 0.037 + vec2( 0.5, 0.25 ) ).g;
        float mask = smoothstep( 0.25, 0.75, texture2D( map, vMapUv * 0.11 + vec2( 0.13, 0.61 ) ).r );
        vec4 sampledDiffuseColor = mix( tA, tB, 0.35 + 0.3 * mask );
        sampledDiffuseColor.rgb *= 0.82 + 0.36 * macro;
        diffuseColor *= sampledDiffuseColor;
      #endif`,
    );
  };
  m.customProgramCacheKey = () => 'modulo-antitile';
}

export function getThreeMaterial(id: string, variant: Variant = 'normal', scale = 1): THREE.Material {
  const key = `${id}|${variant}|${scale}`;
  let m = cache.get(key);
  if (!m) {
    m = create(id, variant, scale);
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
