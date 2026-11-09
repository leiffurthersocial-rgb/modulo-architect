'use client';
import { Html, Line } from '@react-three/drei';
import { useToolUI } from '@/features/tools/store';
import type { Overlay, OverlayStyle } from '@/features/tools/types';
import { add, normalize, perp, scale, sub, mid, type Vec2 } from '@/core/geometry/vec2';
import type { SceneTheme } from '@/lib/hooks/useSceneTheme';

function color(style: OverlayStyle | undefined, t: SceneTheme) {
  switch (style) {
    case 'danger':
      return t.danger;
    case 'draft':
    case 'muted':
      return t.dark ? '#c9c9cf' : '#55555c';
    case 'ghost':
      return t.dark ? '#77777f' : '#a1a1a8';
    default:
      return t.accent;
  }
}

export function Label({
  p,
  y,
  text,
  tone = 'tip',
}: {
  p: Vec2;
  y: number;
  text: string;
  tone?: 'tip' | 'dim' | 'accent';
}) {
  return (
    <Html position={[p.x, y, p.y]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className={
          'tnum whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium shadow-sm ' +
          (tone === 'accent'
            ? 'bg-accent text-accent-fg'
            : tone === 'dim'
              ? 'bg-panel-solid/90 text-fg ring-1 ring-line'
              : 'bg-fg text-bg')
        }
      >
        {text}
      </div>
    </Html>
  );
}

export function Overlay3D({ y, theme }: { y: number; theme: SceneTheme }) {
  const overlay = useToolUI((s) => s.overlay);
  const tip = useToolUI((s) => s.tip);
  const snapChip = useToolUI((s) => s.snap);
  const input = useToolUI((s) => s.input);
  const Y = y + 0.03;
  return (
    <group renderOrder={20}>
      {overlay.map((o, i) => (
        <OverlayItem key={i} o={o} y={Y} theme={theme} />
      ))}
      {tip && <Label p={tip.p} y={Y} text={tip.text} tone="tip" />}
      {snapChip && (
        <Html
          position={[snapChip.p.x, Y, snapChip.p.y]}
          style={{ pointerEvents: 'none', transform: 'translate(10px, 10px)' }}
        >
          <div className="whitespace-nowrap rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-fg">
            {snapChip.label}
          </div>
        </Html>
      )}
      {input && (
        <Html
          position={[input.p.x, Y, input.p.y]}
          style={{ pointerEvents: 'none', transform: 'translate(14px, -34px)' }}
        >
          <div className="tnum flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-panel-solid px-2 py-1 text-xs shadow-pop ring-1 ring-accent">
            <span className="text-fg-subtle">{input.label}</span>
            <span className="font-medium text-fg">{input.text}</span>
            <span className="h-3.5 w-px animate-pulse bg-accent" />
          </div>
        </Html>
      )}
    </group>
  );
}

function OverlayItem({ o, y, theme }: { o: Overlay; y: number; theme: SceneTheme }) {
  switch (o.kind) {
    case 'line':
      return (
        <Line
          points={[
            [o.a.x, y, o.a.y],
            [o.b.x, y, o.b.y],
          ]}
          color={color(o.style, theme)}
          lineWidth={o.style === 'guide' ? 1 : 2}
          dashed={o.dashed}
          dashSize={0.15}
          gapSize={0.1}
          depthTest={false}
          transparent
        />
      );
    case 'poly': {
      if (o.pts.length < 2) return null;
      const pts = (o.closed ? [...o.pts, o.pts[0]!] : o.pts).map(
        (p) => [p.x, y, p.y] as [number, number, number],
      );
      return <Line points={pts} color={color(o.style, theme)} lineWidth={2} depthTest={false} transparent />;
    }
    case 'point':
      return (
        <mesh position={[o.p.x, y, o.p.y]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={30}>
          <circleGeometry args={[0.07, 20]} />
          <meshBasicMaterial color={color(o.style, theme)} depthTest={false} transparent />
        </mesh>
      );
    case 'label':
      return <Label p={o.p} y={y} text={o.text} tone={o.style ?? 'tip'} />;
    case 'dim': {
      const d = normalize(sub(o.b, o.a));
      const n = scale(perp(d), o.offset);
      const a = add(o.a, n);
      const b = add(o.b, n);
      const tick = scale(perp(d), 0.12);
      const c = color(o.style ?? 'accent', theme);
      return (
        <group>
          <Line
            points={[
              [a.x, y, a.y],
              [b.x, y, b.y],
            ]}
            color={c}
            lineWidth={1.25}
            depthTest={false}
            transparent
          />
          <Line
            points={[
              [a.x - tick.x, y, a.y - tick.y],
              [a.x + tick.x, y, a.y + tick.y],
            ]}
            color={c}
            lineWidth={1.25}
            depthTest={false}
            transparent
          />
          <Line
            points={[
              [b.x - tick.x, y, b.y - tick.y],
              [b.x + tick.x, y, b.y + tick.y],
            ]}
            color={c}
            lineWidth={1.25}
            depthTest={false}
            transparent
          />
          <Label p={mid(a, b)} y={y} text={o.text} tone="dim" />
        </group>
      );
    }
    case 'handle':
      return (
        <mesh
          position={[o.p.x, y + 0.01, o.p.y]}
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ handle: o.id }}
          renderOrder={40}
        >
          {o.shape === 'square' ? (
            <planeGeometry args={[0.2, 0.2]} />
          ) : (
            <circleGeometry args={[o.shape === 'rotate' ? 0.14 : 0.11, 24]} />
          )}
          <meshBasicMaterial
            color={o.shape === 'rotate' ? theme.accent : '#ffffff'}
            depthTest={false}
            transparent
          />
          <mesh renderOrder={39}>
            {o.shape === 'square' ? (
              <planeGeometry args={[0.26, 0.26]} />
            ) : (
              <circleGeometry args={[o.shape === 'rotate' ? 0.17 : 0.15, 24]} />
            )}
            <meshBasicMaterial color={theme.accent} depthTest={false} transparent />
          </mesh>
        </mesh>
      );
  }
}
