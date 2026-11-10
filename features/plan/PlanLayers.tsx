'use client';
import { memo, useMemo } from 'react';
import type { Level, Project } from '@/core/model/schema';
import { deriveLevel } from '@/features/scene/derive';
import { getElement, getOpening } from '@/registry';
import { getMaterial } from '@/registry/materials';
import { itemFootprint, openingGeometry } from '@/core/model/footprint';
import { add, scale, perp, normalize, sub, dist, mid } from '@/core/geometry/vec2';
import type { Vec2 } from '@/core/geometry/vec2';
import { formatArea, formatLength, type UnitSystem } from '@/core/units/units';
import { rectPolygon } from '@/core/geometry/polygon';
import { stairLayout } from '@/core/geometry/stairs';

const pts = (poly: Vec2[]) => poly.map((p) => `${p.x},${p.y}`).join(' ');

export const LevelPlan = memo(function LevelPlan({
  level,
  k,
  ghost,
  units,
  showDims,
  facade,
}: {
  level: Level;
  k: number;
  ghost?: boolean;
  units: UnitSystem;
  showDims: boolean;
  facade: string;
}) {
  const d = deriveLevel(level);
  void facade;
  if (ghost) {
    return (
      <g opacity={0.35} pointerEvents="none">
        {d.walls.map((w) => (
          <polygon
            key={w.id}
            points={pts(w.shape.polygon)}
            fill="none"
            stroke="var(--fg-subtle)"
            strokeWidth={k}
            strokeDasharray={`${4 * k} ${3 * k}`}
          />
        ))}
      </g>
    );
  }
  return (
    <g>
      {/* Rooms: tinted by floor finish */}
      {level.rooms.map((r) => {
        if (r.hidden) return null;
        const dr = d.rooms.find((x) => x.id === r.id);
        if (!dr) return null;
        const hasFloor = r.floor !== false;
        return (
          <polygon
            key={r.id}
            data-id={r.id}
            points={pts(dr.polygon)}
            fill={hasFloor ? getMaterial(r.floorMaterial).color : 'url(#no-floor)'}
            fillOpacity={hasFloor ? 0.22 : 1}
            stroke="none"
          />
        );
      })}
      {/* Free-standing floor slabs */}
      {level.slabs.map((s) =>
        s.hidden ? null : (
          <polygon
            key={s.id}
            data-id={s.id}
            points={pts(s.points)}
            fill={getMaterial(s.material).color}
            fillOpacity={0.3}
            stroke={getMaterial(s.material).color}
            strokeWidth={k}
          />
        ),
      )}
      {/* Stairs */}
      {level.stairs.map((s) => {
        if (s.hidden) return null;
        const lay = d.stairs.get(s.id) ?? stairLayout(s, level.height);
        return (
          <g key={s.id} data-id={s.id}>
            {lay.steps.map((st, i) => (
              <polygon
                key={i}
                data-id={s.id}
                points={pts(rectPolygon(st.x, st.y, st.w, st.d, st.rotation))}
                fill="var(--panel-solid)"
                stroke="var(--fg-muted)"
                strokeWidth={k}
              />
            ))}
            <StairArrow s={s} k={k} />
          </g>
        );
      })}
      {/* Walls: solid poché with real opening gaps */}
      <g>
        {d.walls.map((w) => {
          const wall = level.walls.find((x) => x.id === w.id);
          if (!wall || wall.hidden) return null;
          const atFloor = w.pieces.filter((p) => p.y0 < 0.01);
          return (
            <g key={w.id} data-id={w.id}>
              {atFloor.map((p, i) => (
                <polygon
                  key={i}
                  data-id={w.id}
                  points={pts(p.polygon)}
                  fill="var(--fg)"
                  stroke="var(--fg)"
                  strokeWidth={k * 0.5}
                  strokeLinejoin="miter"
                />
              ))}
            </g>
          );
        })}
        {d.junctions.map((j) => (
          <polygon
            key={j.nodeId}
            data-id={j.wallIds[0]}
            points={pts(j.polygon)}
            fill="var(--fg)"
            stroke="var(--fg)"
            strokeWidth={k * 0.5}
          />
        ))}
      </g>
      {/* Openings */}
      {level.openings.map((o) => {
        if (o.hidden) return null;
        const g = openingGeometry(level, o);
        const def = getOpening(o.type);
        if (!g || !def) return null;
        const half = scale(g.dir, o.width / 2);
        const e0 = sub(g.center, half);
        const e1 = add(g.center, half);
        const t = scale(g.normal, g.thickness / 2);
        const frame = [add(e0, t), add(e1, t), sub(e1, t), sub(e0, t)];
        return (
          <g key={o.id} data-id={o.id}>
            <polygon
              data-id={o.id}
              points={pts(frame)}
              fill="var(--bg-elevated)"
              stroke="var(--fg-muted)"
              strokeWidth={k}
            />
            {def.kind === 'window' && (
              <>
                <line x1={e0.x} y1={e0.y} x2={e1.x} y2={e1.y} stroke="var(--fg-muted)" strokeWidth={k} />
                <line
                  x1={add(e0, scale(t, 0.4)).x}
                  y1={add(e0, scale(t, 0.4)).y}
                  x2={add(e1, scale(t, 0.4)).x}
                  y2={add(e1, scale(t, 0.4)).y}
                  stroke="var(--fg-muted)"
                  strokeWidth={k * 0.75}
                />
              </>
            )}
            {def.kind === 'door' && <DoorSymbol o={o} g={g} swing={def.swing ?? 'single'} k={k} />}
          </g>
        );
      })}
      {/* Items */}
      {level.items.map((it) => (it.hidden ? null : <ItemPlan key={it.id} item={it} k={k} />))}
      {/* Labels */}
      <g pointerEvents="none">
        {level.rooms.map((r) => {
          if (r.hidden) return null;
          const dr = d.rooms.find((x) => x.id === r.id);
          if (!dr) return null;
          return (
            <g key={r.id}>
              <text
                x={dr.center.x}
                y={dr.center.y}
                textAnchor="middle"
                fontSize={12 * k}
                fontWeight={600}
                fill="var(--fg)"
                className="tnum"
              >
                {r.name}
              </text>
              <text
                x={dr.center.x}
                y={dr.center.y + 15 * k}
                textAnchor="middle"
                fontSize={10.5 * k}
                fill="var(--fg-muted)"
                className="tnum"
              >
                {formatArea(dr.area, units)}
              </text>
            </g>
          );
        })}
        {showDims &&
          d.walls.map((w) => {
            const side = w.leftExterior && !w.rightExterior ? 1 : w.rightExterior && !w.leftExterior ? -1 : 1;
            const off = scale(w.shape.normal, side * (w.shape.thickness / 2 + 14 * k));
            const m = add(mid(w.shape.a, w.shape.b), off);
            let ang = (Math.atan2(w.shape.dir.y, w.shape.dir.x) * 180) / Math.PI;
            if (ang > 90) ang -= 180;
            if (ang < -90) ang += 180;
            if (w.shape.length * (1 / k) < 46) return null;
            return (
              <text
                key={w.id}
                x={m.x}
                y={m.y}
                transform={`rotate(${ang} ${m.x} ${m.y})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10 * k}
                fill="var(--accent)"
                className="tnum"
              >
                {formatLength(w.shape.length, units)}
              </text>
            );
          })}
      </g>
    </g>
  );
});

function DoorSymbol({
  o,
  g,
  swing,
  k,
}: {
  o: { width: number; flip: boolean; mirror: boolean };
  g: { center: Vec2; dir: Vec2; normal: Vec2; thickness: number };
  swing: string;
  k: number;
}) {
  const side = o.flip ? -1 : 1;
  const n = scale(g.normal, side);
  const face = add(g.center, scale(n, g.thickness / 2));
  if (swing === 'sliding') {
    const h = scale(g.dir, o.width / 2);
    return (
      <g pointerEvents="none">
        <line
          x1={sub(g.center, h).x}
          y1={sub(g.center, h).y}
          x2={add(g.center, scale(h, 0.1)).x}
          y2={add(g.center, scale(h, 0.1)).y}
          stroke="var(--fg-muted)"
          strokeWidth={2 * k}
          transform={`translate(${n.x * 0.03} ${n.y * 0.03})`}
        />
        <line
          x1={sub(g.center, scale(h, 0.1)).x}
          y1={sub(g.center, scale(h, 0.1)).y}
          x2={add(g.center, h).x}
          y2={add(g.center, h).y}
          stroke="var(--fg-muted)"
          strokeWidth={2 * k}
          transform={`translate(${-n.x * 0.03} ${-n.y * 0.03})`}
        />
      </g>
    );
  }
  const leaves = swing === 'double' ? [-1, 1] : [o.mirror ? 1 : -1];
  const lw = swing === 'double' ? o.width / 2 : o.width;
  return (
    <g pointerEvents="none">
      {leaves.map((s) => {
        const hinge = add(face, scale(g.dir, (s * o.width) / 2));
        const tip = add(hinge, scale(n, lw));
        const closed = add(hinge, scale(g.dir, -s * lw));
        const sweep = s > 0 !== side > 0 ? 0 : 1;
        const cr = crossSign(g.dir, g.normal);
        return (
          <g key={s}>
            <line
              x1={hinge.x}
              y1={hinge.y}
              x2={tip.x}
              y2={tip.y}
              stroke="var(--fg-muted)"
              strokeWidth={1.5 * k}
            />
            <path
              d={`M ${tip.x} ${tip.y} A ${lw} ${lw} 0 0 ${cr > 0 ? sweep : 1 - sweep} ${closed.x} ${closed.y}`}
              fill="none"
              stroke="var(--fg-subtle)"
              strokeWidth={k}
              strokeDasharray={`${3 * k} ${2 * k}`}
            />
          </g>
        );
      })}
    </g>
  );
}

const crossSign = (a: Vec2, b: Vec2) => Math.sign(a.x * b.y - a.y * b.x);

function StairArrow({
  s,
  k,
}: {
  s: { x: number; y: number; rotation: number; length: number; width: number };
  k: number;
}) {
  const c = Math.cos(s.rotation);
  const sn = Math.sin(s.rotation);
  const P = (lx: number, lz: number) => ({ x: s.x + lx * c - lz * sn, y: s.y + lx * sn + lz * c });
  const a = P(0, s.length / 2 - 0.15);
  const b = P(0, -s.length / 2 + 0.2);
  const l = P(-0.15, -s.length / 2 + 0.4);
  const r = P(0.15, -s.length / 2 + 0.4);
  return (
    <g pointerEvents="none" stroke="var(--accent)" strokeWidth={1.5 * k} fill="none" strokeLinecap="round">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      <polyline points={`${l.x},${l.y} ${b.x},${b.y} ${r.x},${r.y}`} />
      <circle cx={a.x} cy={a.y} r={3 * k} fill="var(--accent)" />
    </g>
  );
}

export const ItemPlan = memo(function ItemPlan({
  item,
  k,
}: {
  item: import('@/core/model/schema').Item;
  k: number;
}) {
  const def = getElement(item.type);
  const fp = useMemo(() => itemFootprint(item), [item]);
  if (!def) return null;
  const front = add(
    { x: item.x, y: item.y },
    scale(
      perp(normalize({ x: Math.cos(item.rotation), y: Math.sin(item.rotation) })),
      item.size.d / 2 - 0.06,
    ),
  );
  const flat = !def.solid && def.solid !== undefined;
  const ceiling = def.snap === 'ceiling' || def.snap === 'wall';
  const big = Math.min(item.size.w, item.size.d) / k > 34;
  return (
    <g data-id={item.id}>
      <polygon
        data-id={item.id}
        points={pts(fp)}
        fill={flat ? 'transparent' : 'var(--panel-solid)'}
        fillOpacity={flat ? 0 : 0.92}
        stroke="var(--fg-muted)"
        strokeWidth={k * 1.1}
        strokeDasharray={ceiling ? `${4 * k} ${3 * k}` : undefined}
      />
      {!flat && <circle cx={front.x} cy={front.y} r={2 * k} fill="var(--fg-subtle)" pointerEvents="none" />}
      {big && (
        <text
          x={item.x}
          y={item.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9.5 * k}
          fill="var(--fg-subtle)"
          pointerEvents="none"
        >
          {item.name ?? def.name}
        </text>
      )}
    </g>
  );
});

export function PlotOutline({ project, k }: { project: Project; k: number }) {
  return (
    <polygon
      points={pts(project.site.plot)}
      fill="none"
      stroke="var(--accent)"
      strokeOpacity={0.45}
      strokeWidth={1.25 * k}
      strokeDasharray={`${6 * k} ${4 * k}`}
      pointerEvents="none"
    />
  );
}

export const _dist = dist;
