'use client';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Sky } from '@react-three/drei';
import { sunDirection } from '@/core/geometry/sun';
import type { Project } from '@/core/model/schema';

export function Lighting({ project, sky, dark }: { project: Project; sky: boolean; dark: boolean }) {
  const { latitude, northAngle } = project.site;
  const { hour, month } = project.exterior.sun;
  const dir = useMemo(() => sunDirection(latitude, month, hour, northAngle), [latitude, month, hour, northAngle]);
  const up = dir[1];
  const day = Math.max(0, Math.min(1, up * 4));
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);
  const D = 40;
  const sunPos: [number, number, number] = [dir[0] * D, Math.max(dir[1], 0.05) * D, dir[2] * D];
  const warm = new THREE.Color('#ffd8a8').lerp(new THREE.Color('#fffaf0'), Math.min(1, up * 2));
  return (
    <>
      <hemisphereLight args={[dark ? '#9aa4b8' : '#ffffff', dark ? '#30302c' : '#c9c2b4', dark ? 0.75 : 0.9]} />
      <ambientLight intensity={0.15} />
      <directionalLight
        ref={light}
        position={sunPos}
        intensity={0.4 + 1.9 * day}
        color={warm}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />
      <primitive object={target} />
      {sky && <Sky distance={4500} sunPosition={sunPos} turbidity={5} rayleigh={up > 0.1 ? 1.2 : 2.6} mieCoefficient={0.004} mieDirectionalG={0.85} />}
    </>
  );
}
