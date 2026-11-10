'use client';
import { Canvas } from '@react-three/fiber';
import { LogOut, Snail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TextureInvalidator } from '@/features/scene/TextureInvalidator';
import { SceneContent } from '@/features/build/SceneContent';
import { useSceneTheme } from '@/lib/hooks/useSceneTheme';
import { WalkController } from './WalkController';
import { TouchControls } from './TouchControls';
import { useWalk } from './walkStore';
import { usePrefs } from '@/store/prefs';
import { Kbd } from '@/components/ui/Kbd';
import { LightButton } from '@/components/editor/LightPanel';
import { NumberField } from '@/components/ui/NumberField';
import { useDocument } from '@/store/document';
import { cn } from '@/lib/cn';

export default function WalkView({
  onExit,
  exitLabel = 'Exit walk',
}: {
  onExit: () => void;
  exitLabel?: string;
}) {
  const theme = useSceneTheme();
  const [doors, setDoors] = useState<Record<string, number>>({});
  const [hint, setHint] = useState(true);
  const locked = useWalk((s) => s.locked);
  const slow = useWalk((s) => s.slow);
  const eye = usePrefs((s) => s.eyeHeight);
  const levelName = useWalk((s) => s.levelName);
  const units = useDocument((s) => s.project.settings.units);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // First Esc releases the pointer (browser); a second one leaves walk mode.
      if (e.key === 'Escape' && !document.pointerLockElement) onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  return (
    <div className="absolute inset-0" data-testid="walk-view">
      <Canvas
        shadows="soft"
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ fov: 70, near: 0.05, far: 1500 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <SceneContent theme={theme} walk openDoors={doors} />
        <TextureInvalidator />
        <WalkController onDoors={setDoors} />
      </Canvas>
      <TouchControls />
      {!locked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center [@media(pointer:coarse)]:hidden">
          <div className="animate-fade rounded-full bg-black/45 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            Click to look around
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow" />
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <button
          onClick={onExit}
          className="panel flex h-10 items-center gap-2 px-3.5 text-[13px] font-medium hover:bg-panel-solid"
          data-testid="exit-walk"
        >
          <LogOut className="h-4 w-4" />
          {exitLabel}
        </button>
        {levelName && (
          <span className="panel flex h-10 items-center px-3 text-[13px] text-fg-muted">{levelName}</span>
        )}
      </div>
      <div className="panel absolute right-3 top-3 z-20 flex items-center gap-2 p-1.5">
        <LightButton side="bottom" />
        <div className="w-[150px]">
          <NumberField
            label="Eye height"
            short="Eye"
            value={eye}
            units={units}
            min={0.6}
            max={2.2}
            onChange={(v) => usePrefs.getState().set({ eyeHeight: v })}
          />
        </div>
        <button
          aria-pressed={slow}
          onClick={() => useWalk.getState().set({ slow: !slow })}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-xs font-medium',
            slow ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:bg-hover',
          )}
        >
          <Snail className="h-3.5 w-3.5" /> Slow
        </button>
      </div>
      <div
        className={cn(
          'panel pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 px-4 py-2.5 text-[13px] text-fg-muted transition-opacity duration-700',
          hint ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="hidden items-center gap-1.5 [@media(pointer:fine)]:flex">
          <Kbd shortcut="w" />
          <Kbd shortcut="a" />
          <Kbd shortcut="s" />
          <Kbd shortcut="d" /> move · <Kbd shortcut="shift" /> sprint · <Kbd shortcut="c" /> slow ·{' '}
          <Kbd shortcut="esc" /> exit
        </span>
        <span className="[@media(pointer:fine)]:hidden">Left thumb to move, drag right side to look</span>
      </div>
    </div>
  );
}
