'use client';
import { useToolUI } from '@/features/tools/store';
import type { Overlay, OverlayStyle } from '@/features/tools/types';
import { add, mid, normalize, perp, scale, sub, type Vec2 } from '@/core/geometry/vec2';

const stroke = (s?: OverlayStyle) =>
  s === 'danger' ? 'var(--danger)' : s === 'draft' || s === 'muted' ? 'var(--fg-muted)' : s === 'ghost' ? 'var(--fg-subtle)' : 'var(--accent)';

function Pill({ p, text, k, tone = 'tip' }: { p: Vec2; text: string; k: number; tone?: 'tip' | 'dim' | 'accent' }) {
  const w = (text.length * 6.4 + 12) * k;
  const h = 18 * k;
  const bg = tone === 'accent' ? 'var(--accent)' : tone === 'dim' ? 'var(--panel-solid)' : 'var(--fg)';
  const fg = tone === 'accent' ? 'var(--accent-fg)' : tone === 'dim' ? 'var(--fg)' : 'var(--bg)';
  return (
    <g pointerEvents="none">
      <rect x={p.x - w / 2} y={p.y - h / 2} width={w} height={h} rx={5 * k} fill={bg} stroke={tone === 'dim' ? 'var(--line-strong)' : 'none'} strokeWidth={k} />
      <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={11 * k} fontWeight={500} fill={fg} className="tnum">
        {text}
      </text>
    </g>
  );
}

function Item({ o, k }: { o: Overlay; k: number }) {
  switch (o.kind) {
    case 'line':
      return (
        <line
          x1={o.a.x}
          y1={o.a.y}
          x2={o.b.x}
          y2={o.b.y}
          stroke={stroke(o.style)}
          strokeWidth={(o.style === 'guide' ? 1 : 2) * k}
          strokeDasharray={o.dashed ? `${5 * k} ${4 * k}` : undefined}
          pointerEvents="none"
        />
      );
    case 'poly':
      return (
        <polygon
          points={o.pts.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={o.fill ? stroke(o.style) : 'none'}
          fillOpacity={o.fill ? 0.08 : 0}
          stroke={stroke(o.style)}
          strokeWidth={1.5 * k}
          pointerEvents="none"
        />
      );
    case 'point':
      return <circle cx={o.p.x} cy={o.p.y} r={4 * k} fill={stroke(o.style)} stroke="var(--bg)" strokeWidth={1.5 * k} pointerEvents="none" />;
    case 'label':
      return <Pill p={o.p} text={o.text} k={k} tone={o.style ?? 'tip'} />;
    case 'dim': {
      const d = normalize(sub(o.b, o.a));
      const n = scale(perp(d), o.offset);
      const a = add(o.a, n);
      const b = add(o.b, n);
      const t = scale(perp(d), 5 * k);
      const c = stroke(o.style ?? 'accent');
      return (
        <g pointerEvents="none">
          {o.offset !== 0 && (
            <>
              <line x1={o.a.x} y1={o.a.y} x2={a.x} y2={a.y} stroke={c} strokeWidth={0.75 * k} strokeOpacity={0.5} />
              <line x1={o.b.x} y1={o.b.y} x2={b.x} y2={b.y} stroke={c} strokeWidth={0.75 * k} strokeOpacity={0.5} />
            </>
          )}
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth={1.25 * k} />
          <line x1={a.x - t.x} y1={a.y - t.y} x2={a.x + t.x} y2={a.y + t.y} stroke={c} strokeWidth={1.25 * k} />
          <line x1={b.x - t.x} y1={b.y - t.y} x2={b.x + t.x} y2={b.y + t.y} stroke={c} strokeWidth={1.25 * k} />
          <Pill p={mid(a, b)} text={o.text} k={k} tone="dim" />
        </g>
      );
    }
    case 'handle': {
      const r = (o.shape === 'rotate' ? 6 : 5) * k;
      return (
        <g data-handle={o.id} style={{ cursor: o.cursor }}>
          <circle cx={o.p.x} cy={o.p.y} r={r * 2.4} fill="transparent" data-handle={o.id} />
          {o.shape === 'square' ? (
            <rect data-handle={o.id} x={o.p.x - r} y={o.p.y - r} width={2 * r} height={2 * r} rx={1.5 * k} fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth={1.75 * k} />
          ) : (
            <circle data-handle={o.id} cx={o.p.x} cy={o.p.y} r={r} fill={o.shape === 'rotate' ? 'var(--accent)' : 'var(--panel-solid)'} stroke="var(--accent)" strokeWidth={1.75 * k} />
          )}
        </g>
      );
    }
  }
}

export function Overlay2D({ k }: { k: number }) {
  const overlay = useToolUI((s) => s.overlay);
  const tip = useToolUI((s) => s.tip);
  const snapChip = useToolUI((s) => s.snap);
  const input = useToolUI((s) => s.input);
  return (
    <g>
      {overlay.map((o, i) => (
        <Item key={i} o={o} k={k} />
      ))}
      {snapChip && <Pill p={{ x: snapChip.p.x + 34 * k, y: snapChip.p.y + 16 * k }} text={snapChip.label} k={k} tone="accent" />}
      {tip && <Pill p={{ x: tip.p.x, y: tip.p.y - 26 * k }} text={tip.text} k={k} />}
      {input && <Pill p={{ x: input.p.x + 50 * k, y: input.p.y - 26 * k }} text={`${input.label}: ${input.text}▍`} k={k} tone="dim" />}
    </g>
  );
}
