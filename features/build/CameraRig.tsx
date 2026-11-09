'use client';
import { CameraControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import CameraControlsImpl from 'camera-controls';
import { useEditor } from '@/store/editor';
import { useDocument } from '@/store/document';
import { bounds } from '@/core/geometry/polygon';

export type ControlsRef = React.RefObject<CameraControls | null>;

function buildingBounds() {
  const p = useDocument.getState().project;
  const pts = p.building.levels.flatMap((l) => l.nodes.map((n) => ({ x: n.x, y: n.y })));
  const top = p.building.levels[p.building.levels.length - 1]!;
  if (pts.length < 2) return { cx: 0, cz: 0, r: 8, h: 1.5 };
  const b = bounds(pts);
  return {
    cx: (b.minX + b.maxX) / 2,
    cz: (b.minY + b.maxY) / 2,
    r: Math.max(4, Math.hypot(b.width, b.height) / 2),
    h: (top.elevation + top.height) / 2,
  };
}

/** Smooth orbit/pan/zoom with damping, zoom-to-cursor, presets and focus requests. */
export function CameraRig({ controls, drawing }: { controls: ControlsRef; drawing: boolean }) {
  const request = useEditor((s) => s.camera);
  const first = useRef(true);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (first.current) {
      first.current = false;
      const b = buildingBounds();
      const d = b.r * 2.4 + 6;
      void c.setLookAt(b.cx + d * 0.7, d * 0.75, b.cz + d * 0.9, b.cx, b.h * 0.4, b.cz, false);
    }
  }, [controls]);

  useEffect(() => {
    const c = controls.current;
    if (!c || !request) return;
    const b = buildingBounds();
    const d = b.r * 2.4 + 6;
    if (request.focus) {
      const [x, y, z] = request.focus.center;
      void c.fitToSphere({ center: { x, y, z }, radius: request.focus.radius * 1.4 } as never, true);
      return;
    }
    switch (request.preset) {
      case 'top':
        void c.setLookAt(b.cx, d * 1.4, b.cz + 0.001, b.cx, 0, b.cz, true);
        break;
      case 'front':
        void c.setLookAt(b.cx, b.h + 1.2, b.cz + d * 1.25, b.cx, b.h, b.cz, true);
        break;
      case 'iso':
      case 'fit':
      default:
        void c.setLookAt(b.cx + d * 0.7, d * 0.75, b.cz + d * 0.9, b.cx, b.h * 0.4, b.cz, true);
    }
  }, [request, controls]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const A = CameraControlsImpl.ACTION;
    // Drawing tools own the left button; orbit moves to the right button.
    c.mouseButtons.left = drawing ? A.NONE : A.ROTATE;
    c.mouseButtons.right = drawing ? A.ROTATE : A.TRUCK;
    c.mouseButtons.middle = A.TRUCK;
    c.mouseButtons.wheel = A.DOLLY;
    c.touches.one = drawing ? A.NONE : A.TOUCH_ROTATE;
    c.touches.two = A.TOUCH_DOLLY_TRUCK;
  }, [controls, drawing]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      dollyToCursor
      smoothTime={0.18}
      draggingSmoothTime={0.08}
      minDistance={1}
      maxDistance={180}
      maxPolarAngle={Math.PI / 2 - 0.02}
    />
  );
}
