'use client';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { CameraControls } from '@react-three/drei';
import { dispatch } from '@/features/tools/dispatch';
import type { ToolPointerEvent } from '@/features/tools/types';
import { planeY } from '@/features/tools/context';
import { viewApis } from '@/features/tools/viewApi';
import { outlineCenter } from '@/features/tools/select';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';

const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
const ndc = new THREE.Vector2();

interface Pick {
  id: string | null;
  handle: string | null;
  point: THREE.Vector3 | null;
}

function resolve(intersections: THREE.Intersection[]): Pick {
  for (const hit of intersections) {
    const mat = (hit.object as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    const m = Array.isArray(mat) ? mat[0] : mat;
    if (
      m &&
      m.transparent &&
      m.opacity < 0.3 &&
      !(hit.object.userData.handle || hit.object.parent?.userData.handle)
    )
      continue;
    let o: THREE.Object3D | null = hit.object;
    while (o) {
      const u = o.userData;
      if (u.handle) return { id: null, handle: u.handle, point: hit.point };
      if (u.triIds && hit.faceIndex != null)
        return { id: u.triIds[hit.faceIndex] ?? null, handle: null, point: hit.point };
      if (u.instanceIds && hit.instanceId != null)
        return { id: u.instanceIds[hit.instanceId] ?? null, handle: null, point: hit.point };
      if (u.id) return { id: u.id, handle: null, point: hit.point };
      o = o.parent;
    }
  }
  return { id: null, handle: null, point: null };
}

/**
 * Translates DOM pointer input on the canvas into tool events on the working plane, and decides
 * per gesture whether the tool or the camera gets it.
 */
export function Interaction3D({ controls }: { controls: React.RefObject<CameraControls | null> }) {
  const { gl, camera, scene, size, invalidate } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    let capturing = false;
    let raf = 0;
    let pendingMove: PointerEvent | null = null;

    const toEvent = (e: PointerEvent | MouseEvent): ToolPointerEvent => {
      const rect = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const y = planeY();
      plane.constant = -y;
      const onPlane = raycaster.ray.intersectPlane(plane, hitPoint);
      const pick = resolve(raycaster.intersectObjects(scene.children, true));
      const p = onPlane ?? pick.point ?? new THREE.Vector3();
      const distance = camera.position.distanceTo(onPlane ?? p);
      const fov = (camera as THREE.PerspectiveCamera).fov ?? 50;
      const mpp = (2 * Math.tan(((fov / 2) * Math.PI) / 180) * distance) / rect.height;
      return {
        point: { x: p.x, y: p.z },
        hitId: pick.id,
        hitPoint: pick.point ? { x: pick.point.x, y: pick.point.z } : null,
        handle: pick.handle,
        shift: e.shiftKey,
        alt: e.altKey,
        mod: e.metaKey || e.ctrlKey,
        button: e.button,
        metersPerPixel: mpp,
        view: '3d',
        clientX: e.clientX,
        clientY: e.clientY,
        pointerType: (e as PointerEvent).pointerType ?? 'mouse',
      };
    };

    const down = (e: PointerEvent) => {
      if (useEditor.getState().mode === 'walk' || useDocument.getState().readOnly) return;
      const te = toEvent(e);
      const captured = dispatch.down(te);
      if (captured) {
        capturing = true;
        if (controls.current) controls.current.enabled = false;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* synthetic events */
        }
      }
      invalidate();
    };
    const flushMove = () => {
      raf = 0;
      if (!pendingMove) return;
      const e = pendingMove;
      pendingMove = null;
      dispatch.move(toEvent(e));
      invalidate();
    };
    const move = (e: PointerEvent) => {
      if (useEditor.getState().mode === 'walk') return;
      pendingMove = e;
      if (!raf) raf = requestAnimationFrame(flushMove);
    };
    const up = (e: PointerEvent) => {
      if (useEditor.getState().mode === 'walk') return;
      if (raf) {
        cancelAnimationFrame(raf);
        flushMove();
      }
      dispatch.up(toEvent(e));
      if (capturing) {
        capturing = false;
        if (controls.current) controls.current.enabled = true;
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      invalidate();
    };
    const dbl = (e: MouseEvent) => {
      if (useEditor.getState().mode === 'walk') return;
      dispatch.dbl(toEvent(e));
    };
    const leave = () => useEditor.getState().setCursor(null);
    const ctx = (e: Event) => e.preventDefault();

    // Capture phase so tools decide before camera-controls sees the event.
    el.addEventListener('pointerdown', down, { capture: true });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('dblclick', dbl);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('contextmenu', ctx);

    viewApis['3d'] = {
      pickRect(r, filter) {
        const rect = el.getBoundingClientRect();
        const x0 = Math.min(r.x0, r.x1);
        const x1 = Math.max(r.x0, r.x1);
        const y0 = Math.min(r.y0, r.y1);
        const y1 = Math.max(r.y0, r.y1);
        const p = useDocument.getState().project;
        const ids = [
          ...p.building.levels.flatMap((l) =>
            [...l.walls, ...l.slabs, ...l.openings, ...l.stairs, ...l.items].map((e) => e.id),
          ),
          ...p.exterior.items.map((i) => i.id),
        ].filter(filter);
        const v = new THREE.Vector3();
        return ids.filter((id) => {
          const c = outlineCenter(p, id);
          if (!c) return false;
          v.set(c.x, c.z, c.y).project(camera);
          if (v.z > 1) return false;
          const sx = rect.left + ((v.x + 1) / 2) * rect.width;
          const sy = rect.top + ((1 - v.y) / 2) * rect.height;
          return sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1;
        });
      },
      worldToClient(pt) {
        const rect = el.getBoundingClientRect();
        const v = new THREE.Vector3(pt.x, pt.h, pt.y).project(camera);
        return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
      },
      toClient(pt) {
        const rect = el.getBoundingClientRect();
        const v = new THREE.Vector3(pt.x, planeY(), pt.y).project(camera);
        return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
      },
    };

    return () => {
      el.removeEventListener('pointerdown', down, { capture: true });
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('dblclick', dbl);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('contextmenu', ctx);
      if (raf) cancelAnimationFrame(raf);
      delete viewApis['3d'];
    };
  }, [gl, camera, scene, size, invalidate, controls]);

  return null;
}
