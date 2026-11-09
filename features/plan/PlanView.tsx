'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { usePlanView } from './planStore';
import { LevelPlan, ItemPlan, PlotOutline } from './PlanLayers';
import { Overlay2D } from './Overlay2D';
import { dispatch } from '@/features/tools/dispatch';
import { useToolUI } from '@/features/tools/store';
import type { ToolPointerEvent } from '@/features/tools/types';
import { viewApis } from '@/features/tools/viewApi';
import { entityOutline } from '@/core/model/footprint';
import { outlineCenter } from '@/features/tools/select';
import { bounds } from '@/core/geometry/polygon';
import { smartStep } from '@/core/snapping/snap';

function fitBuilding(w: number, h: number) {
  const p = useDocument.getState().project;
  const pts = p.building.levels.flatMap((l) => l.nodes.map((n) => ({ x: n.x, y: n.y })));
  const src = pts.length >= 2 ? pts : p.site.plot;
  const b = bounds(src);
  const pad = pts.length >= 2 ? 3 : 1;
  const scale = Math.min(w / (b.width + pad * 2), h / (b.height + pad * 2));
  usePlanView
    .getState()
    .set({ cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2, scale: Math.max(8, Math.min(220, scale)) });
}

export default function PlanView() {
  const project = useDocument((s) => s.project);
  const activeId = useEditor((s) => s.activeLevelId);
  const selection = useEditor((s) => s.selection);
  const hover = useEditor((s) => s.hover);
  const mode = useEditor((s) => s.mode);
  const planFit = useEditor((s) => s.planFit);
  const cursor = useToolUI((s) => s.cursor);
  const { cx, cy, scale } = usePlanView();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const panRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const spaceDown = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; scale: number; mid: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e!.contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitted = useRef(false);
  useEffect(() => {
    if (size.w < 10) return;
    if (!fitted.current) {
      fitted.current = true;
      fitBuilding(size.w, size.h);
    }
  }, [size]);
  useEffect(() => {
    if (planFit) fitBuilding(size.w, size.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planFit]);

  const k = 1 / scale;
  const toPlan = useCallback(
    (clientX: number, clientY: number) => {
      const r = ref.current!.getBoundingClientRect();
      return {
        x: (clientX - r.left - size.w / 2) / scale + cx,
        y: (clientY - r.top - size.h / 2) / scale + cy,
      };
    },
    [cx, cy, scale, size],
  );

  useEffect(() => {
    viewApis['2d'] = {
      pickRect(rect, filter) {
        const a = toPlan(Math.min(rect.x0, rect.x1), Math.min(rect.y0, rect.y1));
        const b = toPlan(Math.max(rect.x0, rect.x1), Math.max(rect.y0, rect.y1));
        const p = useDocument.getState().project;
        const level =
          p.building.levels.find((l) => l.id === useEditor.getState().activeLevelId) ?? p.building.levels[0]!;
        const ids = [
          ...level.walls,
          ...level.openings,
          ...level.stairs,
          ...level.items,
          ...(useEditor.getState().mode === 'exterior' ? p.exterior.items : []),
        ]
          .map((e) => e.id)
          .filter(filter);
        return ids.filter((id) => {
          const c = outlineCenter(p, id);
          return c && c.x >= a.x && c.x <= b.x && c.y >= a.y && c.y <= b.y;
        });
      },
      toClient(pt) {
        const r = ref.current!.getBoundingClientRect();
        return { x: r.left + (pt.x - cx) * scale + size.w / 2, y: r.top + (pt.y - cy) * scale + size.h / 2 };
      },
    };
    return () => {
      delete viewApis['2d'];
    };
  }, [toPlan, cx, cy, scale, size]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) spaceDown.current = true;
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown.current = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  const toEvent = (e: React.PointerEvent | React.MouseEvent): ToolPointerEvent => {
    const target = e.target as Element;
    const handle = target.closest?.('[data-handle]')?.getAttribute('data-handle') ?? null;
    const hitId = handle ? null : (target.closest?.('[data-id]')?.getAttribute('data-id') ?? null);
    return {
      point: toPlan(e.clientX, e.clientY),
      hitId,
      handle,
      shift: e.shiftKey,
      alt: e.altKey,
      mod: e.metaKey || e.ctrlKey,
      button: e.button,
      metersPerPixel: 1 / scale,
      view: '2d',
      clientX: e.clientX,
      clientY: e.clientY,
      pointerType: (e as React.PointerEvent).pointerType ?? 'mouse',
    };
  };

  const onWheel = (e: React.WheelEvent) => {
    const before = toPlan(e.clientX, e.clientY);
    const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
    const ns = Math.max(6, Math.min(400, scale * factor));
    const r = ref.current!.getBoundingClientRect();
    // Zoom to cursor: keep the plan point under the cursor fixed.
    usePlanView.getState().set({
      scale: ns,
      cx: before.x - (e.clientX - r.left - size.w / 2) / ns,
      cy: before.y - (e.clientY - r.top - size.h / 2) / ns,
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (useDocument.getState().readOnly) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        d: Math.hypot(a!.x - b!.x, a!.y - b!.y),
        scale,
        mid: { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 },
      };
      panRef.current = { x: pinch.current.mid.x, y: pinch.current.mid.y, cx, cy };
      return;
    }
    const tool = useEditor.getState().tool;
    if (e.button === 1 || e.button === 2 || spaceDown.current || tool === 'pan') {
      panRef.current = { x: e.clientX, y: e.clientY, cx, cy };
      return;
    }
    const captured = dispatch.down(toEvent(e));
    if (!captured && e.pointerType === 'touch') panRef.current = { x: e.clientX, y: e.clientY, cx, cy };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const m = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 };
      const ns = Math.max(6, Math.min(400, (pinch.current.scale * d) / pinch.current.d));
      const pr = panRef.current!;
      usePlanView.getState().set({ scale: ns, cx: pr.cx - (m.x - pr.x) / ns, cy: pr.cy - (m.y - pr.y) / ns });
      return;
    }
    if (panRef.current) {
      const p = panRef.current;
      usePlanView
        .getState()
        .set({ cx: p.cx - (e.clientX - p.x) / scale, cy: p.cy - (e.clientY - p.y) / scale });
      return;
    }
    dispatch.move(toEvent(e));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (panRef.current) {
      if (pointers.current.size === 0) panRef.current = null;
      return;
    }
    dispatch.up(toEvent(e));
  };

  const levels = project.building.levels;
  const activeIdx = Math.max(
    0,
    levels.findIndex((l) => l.id === activeId),
  );
  const active = levels[activeIdx]!;
  const below = activeIdx > 0 ? levels[activeIdx - 1] : undefined;
  const outlines = useMemo(() => {
    const sel = selection.map((id) => entityOutline(project, id)).filter(Boolean);
    const hov = hover && !selection.includes(hover) ? entityOutline(project, hover) : null;
    return { sel, hov };
  }, [project, selection, hover]);

  // Adaptive grid.
  const minor = smartStep(1 / scale, 14);
  const major = minor * (minor >= 1 ? 5 : minor === 0.25 ? 4 : 10);
  const view = {
    x: cx - size.w / 2 / scale,
    y: cy - size.h / 2 / scale,
    w: size.w / scale,
    h: size.h / scale,
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 touch-none select-none bg-bg"
      style={{ cursor: panRef.current ? 'grabbing' : cursor }}
      data-testid="viewport-2d"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => useEditor.getState().setCursor(null)}
      onDoubleClick={(e) => dispatch.dbl(toEvent(e))}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        width={size.w}
        height={size.h}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="block"
        role="img"
        aria-label="Floor plan"
      >
        <defs>
          <pattern id="grid-minor" width={minor} height={minor} patternUnits="userSpaceOnUse">
            <path
              d={`M ${minor} 0 L 0 0 0 ${minor}`}
              fill="none"
              stroke="var(--grid-minor)"
              strokeWidth={k}
            />
          </pattern>
          <pattern id="grid-major" width={major} height={major} patternUnits="userSpaceOnUse">
            <rect width={major} height={major} fill="url(#grid-minor)" />
            <path
              d={`M ${major} 0 L 0 0 0 ${major}`}
              fill="none"
              stroke="var(--grid-major)"
              strokeWidth={k}
            />
          </pattern>
        </defs>
        <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="url(#grid-major)" />
        <PlotOutline project={project} k={k} />
        {mode === 'exterior' &&
          project.exterior.items.map((it) => (it.hidden ? null : <ItemPlan key={it.id} item={it} k={k} />))}
        {below && (
          <LevelPlan
            level={below}
            k={k}
            ghost
            units={project.settings.units}
            showDims={false}
            facade={project.exterior.facadeMaterial}
          />
        )}
        <LevelPlan
          level={active}
          k={k}
          units={project.settings.units}
          showDims={project.settings.showDimensions}
          facade={project.exterior.facadeMaterial}
        />
        {mode !== 'exterior' && project.exterior.items.length > 0 && (
          <g opacity={0.45} pointerEvents="none">
            {project.exterior.items.map((it) =>
              it.hidden ? null : <ItemPlan key={it.id} item={it} k={k} />,
            )}
          </g>
        )}
        {outlines.hov && (
          <g pointerEvents="none">
            {outlines.hov.polygons.map((poly, i) => (
              <polygon
                key={i}
                points={poly.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="var(--accent)"
                fillOpacity={0.06}
                stroke="var(--accent)"
                strokeOpacity={0.5}
                strokeWidth={1.5 * k}
              />
            ))}
          </g>
        )}
        <g pointerEvents="none">
          {outlines.sel.map((o, j) =>
            o!.polygons.map((poly, i) => (
              <polygon
                key={`${j}-${i}`}
                points={poly.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="var(--accent)"
                fillOpacity={0.1}
                stroke="var(--accent)"
                strokeWidth={2 * k}
              />
            )),
          )}
        </g>
        <Overlay2D k={k} />
        <Compass view={view} k={k} north={project.site.northAngle} />
      </svg>
    </div>
  );
}

function Compass({
  view,
  k,
  north,
}: {
  view: { x: number; y: number; w: number; h: number };
  k: number;
  north: number;
}) {
  const x = view.x + view.w - 40 * k;
  const y = view.y + view.h - 110 * k;
  const deg = (north * 180) / Math.PI;
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg})`} pointerEvents="none" aria-hidden>
      <circle r={15 * k} fill="var(--panel-solid)" stroke="var(--line-strong)" strokeWidth={k} />
      <path d={`M 0 ${-10 * k} L ${4 * k} ${3 * k} L 0 ${1 * k} L ${-4 * k} ${3 * k} Z`} fill="var(--fg)" />
      <text y={-19 * k} textAnchor="middle" fontSize={9 * k} fontWeight={600} fill="var(--fg-muted)">
        N
      </text>
    </g>
  );
}
