'use client';
import { useRef, useState } from 'react';
import { useWalk } from './walkStore';

/** Virtual joystick (left) + drag-to-look (right) for touch screens. */
export function TouchControls() {
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const lookRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const R = 48;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 [@media(pointer:fine)]:hidden">
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-1/2 w-1/2 touch-none"
        onPointerDown={(e) => {
          origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          (e.target as Element).setPointerCapture(e.pointerId);
          setKnob({ x: 0, y: 0 });
        }}
        onPointerMove={(e) => {
          const o = origin.current;
          if (!o || o.id !== e.pointerId) return;
          let dx = e.clientX - o.x;
          let dy = e.clientY - o.y;
          const l = Math.hypot(dx, dy);
          if (l > R) {
            dx = (dx / l) * R;
            dy = (dy / l) * R;
          }
          setKnob({ x: dx, y: dy });
          useWalk.getState().set({ joy: { x: dx / R, y: -dy / R } });
        }}
        onPointerUp={() => {
          origin.current = null;
          setKnob(null);
          useWalk.getState().set({ joy: { x: 0, y: 0 } });
        }}
      >
        <div className="absolute bottom-10 left-10 flex h-28 w-28 items-center justify-center rounded-full border border-white/40 bg-black/15 backdrop-blur-sm">
          <div
            className="h-12 w-12 rounded-full bg-white/80 shadow"
            style={{ transform: `translate(${knob?.x ?? 0}px, ${knob?.y ?? 0}px)` }}
          />
        </div>
      </div>
      <div
        className="pointer-events-auto absolute bottom-0 right-0 top-16 w-1/2 touch-none"
        onPointerDown={(e) => {
          lookRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const l = lookRef.current;
          if (!l || l.id !== e.pointerId) return;
          const w = useWalk.getState();
          w.set({ look: { x: w.look.x + (e.clientX - l.x), y: w.look.y + (e.clientY - l.y) } });
          lookRef.current = { ...l, x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (lookRef.current = null)}
      />
    </div>
  );
}
