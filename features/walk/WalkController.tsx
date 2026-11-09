'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDocument } from '@/store/document';
import { buildWalkWorld, collide, groundHeight, spawnPoint } from './physics';
import { useWalk } from './walkStore';

const keys = new Set<string>();

/** First-person movement: gravity, stairs, collision, auto-opening doors. */
export function WalkController({ onDoors }: { onDoors: (open: Record<string, number>) => void }) {
  const project = useDocument((s) => s.project);
  const world = useMemo(() => buildWalkWorld(project), [project]);
  const { camera, gl, invalidate } = useThree();
  const state = useRef({
    x: 0,
    y: 0,
    feet: 0,
    vy: 0,
    yaw: 0,
    pitch: -0.05,
    doors: {} as Record<string, number>,
  });

  useEffect(() => {
    const sp = spawnPoint(project);
    const s = state.current;
    s.x = sp.p.x;
    s.y = sp.p.y;
    s.feet = groundHeight(world, sp.p, 0);
    s.yaw = sp.yaw;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keys.add(e.code);
      if (e.code === 'KeyC') useWalk.getState().set({ slow: !useWalk.getState().slow });
      invalidate();
    };
    const ku = (e: KeyboardEvent) => keys.delete(e.code);
    const mm = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      const s = state.current;
      s.yaw -= e.movementX * 0.0022;
      s.pitch = Math.max(-1.45, Math.min(1.45, s.pitch - e.movementY * 0.0022));
    };
    const click = () => {
      if (window.matchMedia('(pointer: coarse)').matches) return;
      void el.requestPointerLock?.();
    };
    const lockChange = () => useWalk.getState().set({ locked: document.pointerLockElement === el });
    const blur = () => keys.clear();
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    document.addEventListener('mousemove', mm);
    document.addEventListener('pointerlockchange', lockChange);
    el.addEventListener('click', click);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('pointerlockchange', lockChange);
      el.removeEventListener('click', click);
      if (document.pointerLockElement === el) document.exitPointerLock();
      keys.clear();
    };
  }, [gl, invalidate]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = state.current;
    const w = useWalk.getState();
    // Touch look
    if (w.look.x || w.look.y) {
      s.yaw -= w.look.x * 0.005;
      s.pitch = Math.max(-1.45, Math.min(1.45, s.pitch - w.look.y * 0.005));
      w.set({ look: { x: 0, y: 0 } });
    }
    let fwd = 0;
    let side = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) side += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) side -= 1;
    fwd += w.joy.y;
    side += w.joy.x;
    const mag = Math.hypot(fwd, side);
    if (mag > 1) {
      fwd /= mag;
      side /= mag;
    }
    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = (w.slow ? 0.8 : 1.6) * (sprint ? 2.2 : 1);
    // yaw = 0 looks towards -z (north)
    const fx = -Math.sin(s.yaw);
    const fz = -Math.cos(s.yaw);
    const rx = Math.cos(s.yaw);
    const rz = -Math.sin(s.yaw);
    const moving = Math.abs(fwd) + Math.abs(side) > 0.01;
    if (moving) {
      const target = {
        x: s.x + (fx * fwd + rx * side) * speed * dt,
        y: s.y + (fz * fwd + rz * side) * speed * dt,
      };
      const q = collide(world, target, s.feet);
      s.x = q.x;
      s.y = q.y;
    }
    // Ground & gravity
    const g = groundHeight(world, { x: s.x, y: s.y }, s.feet);
    if (g >= s.feet) {
      s.feet = s.feet + (g - s.feet) * Math.min(1, dt * 14);
      if (Math.abs(g - s.feet) < 0.002) s.feet = g;
      s.vy = 0;
    } else {
      s.vy -= 9.8 * dt;
      s.feet = Math.max(g, s.feet + s.vy * dt);
      if (s.feet === g) s.vy = 0;
    }
    camera.position.set(s.x, s.feet + w.eyeHeight, s.y);
    camera.rotation.set(s.pitch, s.yaw, 0, 'YXZ');

    // Doors swing open as you approach.
    let changed = false;
    const next: Record<string, number> = { ...s.doors };
    for (const d of world.doors) {
      const near = Math.hypot(d.center.x - s.x, d.center.y - s.y) < 1.8 && Math.abs(d.y - s.feet) < 1.5;
      const cur = next[d.id] ?? 0;
      const target = near ? 1 : 0;
      if (cur !== target) {
        const v = Math.round(Math.max(0, Math.min(1, cur + (target > cur ? 1 : -1) * dt * 3)) * 20) / 20;
        if (v !== cur) {
          next[d.id] = v;
          changed = true;
        }
      }
    }
    if (changed) {
      s.doors = next;
      onDoors(next);
    }
    const lvl = [...project.building.levels].reverse().find((l) => s.feet >= l.elevation - 0.3);
    if (lvl && lvl.name !== w.levelName) w.set({ levelName: lvl.name });
    if (moving || changed || Math.abs(s.vy) > 0 || g !== s.feet) invalidate();
  });

  // In demand mode keep frames flowing while keys are held.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (keys.size || useWalk.getState().joy.x || useWalk.getState().joy.y) invalidate();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);

  return null;
}

export const _THREE = THREE;
