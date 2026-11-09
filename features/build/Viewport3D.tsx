'use client';
import { Canvas } from '@react-three/fiber';
import { GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { useRef } from 'react';
import type { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { SceneContent } from './SceneContent';
import { CameraRig } from './CameraRig';
import { Interaction3D } from './Interaction3D';
import { useSceneTheme } from '@/lib/hooks/useSceneTheme';
import { useEditor } from '@/store/editor';
import { useToolUI } from '@/features/tools/store';

const DRAWING = new Set(['wall', 'room', 'measure']);

export default function Viewport3D() {
  const theme = useSceneTheme();
  const controls = useRef<CameraControls | null>(null);
  const tool = useEditor((s) => s.tool);
  const cursor = useToolUI((s) => s.cursor);
  return (
    <div className="absolute inset-0" style={{ cursor }} data-testid="viewport-3d">
      <Canvas
        shadows="soft"
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: 45, near: 0.05, far: 2000, position: [14, 12, 16] }}
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <SceneContent theme={theme} />
        <CameraRig controls={controls} drawing={DRAWING.has(tool)} />
        <Interaction3D controls={controls} />
        <GizmoHelper alignment="bottom-right" margin={[64, 92]}>
          <GizmoViewcube
            color={theme.dark ? '#2a2a2f' : '#fbfaf8'}
            hoverColor={theme.accent}
            textColor={theme.fg}
            strokeColor={theme.dark ? '#3a3a40' : '#d8d6cf'}
            opacity={0.95}
            faces={['East', 'West', 'Top', 'Bottom', 'South', 'North']}
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
