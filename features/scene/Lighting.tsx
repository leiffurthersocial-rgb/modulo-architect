'use client';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { sunDirection } from '@/core/geometry/sun';
import { autoSky, daylight, kelvinToRGB, skyRotation, sunKelvin, type SkyId } from '@/core/lighting';
import type { Project } from '@/core/model/schema';
import { DEFAULT_LIGHTING } from '@/core/model/schema';
import { bounds } from '@/core/geometry/polygon';
import { usePrefs } from '@/store/prefs';

export const SKY_FOG: Record<SkyId, string> = {
  clear: '#c6d6e4',
  'partly-cloudy': '#c3cfd9',
  overcast: '#b8bcbf',
  'golden-hour': '#d6c2a6',
  sunset: '#c49d88',
  night: '#0c0f16',
};

export interface SunState {
  dir: [number, number, number];
  altitude: number;
  sky: SkyId;
  rotation: number;
  day: number;
}

export function useSun(project: Project): SunState {
  const { latitude, northAngle } = project.site;
  const { hour, month } = project.exterior.sun;
  const choice = (project.lighting ?? DEFAULT_LIGHTING).sky;
  return useMemo(() => {
    const dir = sunDirection(latitude, month, hour, northAngle);
    const altitude = Math.asin(Math.max(-1, Math.min(1, dir[1])));
    const sky = autoSky(altitude, choice);
    return { dir, altitude, sky, rotation: skyRotation(sky, dir), day: daylight(altitude) };
  }, [latitude, northAngle, hour, month, choice]);
}

/** Visible sky: a real (tonemapped) panorama, rotated so its sun matches ours. */
function SkyBackground({ sky, rotation }: { sky: SkyId; rotation: number }) {
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let disposed = false;
    const tex = new THREE.TextureLoader().load(`/skies/${sky}/bg.jpg`, () => {
      if (disposed) return;
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
      scene.backgroundRotation.set(0, rotation, 0);
      scene.backgroundIntensity = sky === 'night' ? 0.6 : 1;
      invalidate();
    });
    return () => {
      disposed = true;
      if (scene.background === tex) scene.background = null;
      tex.dispose();
    };
  }, [sky, rotation, scene, invalidate]);
  return null;
}

function ToneMapping({ exposure }: { exposure: number }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = exposure;
    invalidate();
  }, [gl, exposure, invalidate]);
  return null;
}

export function Lighting({ project, sky: showSky, dark }: { project: Project; sky: boolean; dark: boolean }) {
  const L = project.lighting ?? DEFAULT_LIGHTING;
  const sun = useSun(project);
  const shadows = usePrefs((s) => s.shadows);
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);

  // Fit the shadow camera to the building so shadows stay crisp.
  const fit = useMemo(() => {
    const pts = project.building.levels.flatMap((l) => l.nodes.map((n) => ({ x: n.x, y: n.y })));
    pts.push(...project.exterior.items.map((i) => ({ x: i.x, y: i.y })));
    if (pts.length < 2) return { cx: 0, cz: 0, r: 16 };
    const b = bounds(pts);
    return {
      cx: (b.minX + b.maxX) / 2,
      cz: (b.minY + b.maxY) / 2,
      r: Math.max(10, Math.hypot(b.width, b.height) / 2 + 6),
    };
  }, [project.building.levels, project.exterior.items]);

  const overcast = sun.sky === 'overcast';
  const night = sun.altitude < -0.02;
  // Below the horizon the key light becomes cool moonlight from the opposite side of the sky.
  const keyDir: [number, number, number] = night ? [-sun.dir[0], 0.55, -sun.dir[2]] : sun.dir;
  const sunK = L.temperatureAuto ? (night ? 8200 : sunKelvin(sun.altitude)) : L.temperature;
  const sunColor = new THREE.Color().setRGB(...kelvinToRGB(sunK), THREE.SRGBColorSpace);
  const fillColor = new THREE.Color().setRGB(
    ...kelvinToRGB(L.temperatureAuto ? 6500 : L.temperature),
    THREE.SRGBColorSpace,
  );
  const sunI = L.sunIntensity * (night ? 0.45 : 3.2 * Math.max(sun.day, 0.12) * (overcast ? 0.25 : 1));
  // Sky light never drops to black: dusk keeps a floor, night relies on the moon + exposure.
  const envI =
    L.ambient * (night ? 0.55 : 0.4 + 0.6 * sun.day) * (overcast ? 1.25 : 1) * (dark && !showSky ? 0.85 : 1);
  // Auto-exposure: open up at dusk and night like a camera would.
  const autoExposure = night ? 1.9 : 1 + (1 - sun.day) * 0.5;
  const D = fit.r * 2.5;
  const up = Math.max(keyDir[1], 0.08);
  const sunPos: [number, number, number] = [fit.cx + keyDir[0] * D, up * D, fit.cz + keyDir[2] * D];
  target.position.set(fit.cx, 0, fit.cz);

  return (
    <>
      <ToneMapping exposure={L.exposure * autoExposure} />
      <Suspense fallback={null}>
        <Environment
          files={`/skies/${sun.sky}/env.hdr`}
          environmentIntensity={envI}
          environmentRotation={[0, sun.rotation, 0]}
        />
      </Suspense>
      {showSky && <SkyBackground sky={sun.sky} rotation={sun.rotation} />}
      <hemisphereLight
        args={[fillColor, dark ? '#2a2a26' : '#8a8172', 0.18 * L.ambient + (L.temperatureAuto ? 0 : 0.25)]}
      />
      <directionalLight
        ref={light}
        position={sunPos}
        intensity={sunI}
        color={sunColor}
        castShadow={shadows && sunI > 0.05}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
        shadow-camera-left={-fit.r}
        shadow-camera-right={fit.r}
        shadow-camera-top={fit.r}
        shadow-camera-bottom={-fit.r}
        shadow-camera-near={1}
        shadow-camera-far={D * 2.5}
      />
      <primitive object={target} />
    </>
  );
}
