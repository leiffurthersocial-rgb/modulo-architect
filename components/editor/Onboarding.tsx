'use client';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEditor } from '@/store/editor';
import { useDocument } from '@/store/document';
import { Kbd } from '@/components/ui/Kbd';

interface Step {
  title: string;
  body: React.ReactNode;
  /** Advances automatically when this becomes true. */
  done: () => boolean;
}

const STEPS: Step[] = [
  {
    title: 'Draw your first room',
    body: (
      <>
        Press <Kbd shortcut="r" /> and drag on the grid, or pick a quick room on the left. Type <b>4x3</b> +
        Enter for exact sizes.
      </>
    ),
    done: () => useDocument.getState().project.building.levels.some((l) => l.rooms.length > 0),
  },
  {
    title: 'Tune it with numbers',
    body: <>Every value in the inspector accepts typing, ↑/↓, math like 2.5*3, or dragging its label.</>,
    done: () => useDocument.getState().history.past.some((c) => c.label.startsWith('Set')),
  },
  {
    title: 'Add a door and a sofa',
    body: (
      <>
        <Kbd shortcut="d" /> places doors on walls. Then switch to <b>Furnish</b> (<Kbd shortcut="3" />) and
        drag a sofa in.
      </>
    ),
    done: () => useDocument.getState().project.building.levels.some((l) => l.items.length > 0),
  },
  {
    title: 'Walk through it',
    body: (
      <>
        Press <Kbd shortcut="5" /> for Walk mode. <Kbd shortcut="mod+k" /> finds every other action.
      </>
    ),
    done: () => useEditor.getState().mode === 'walk',
  },
];

/** A short, skippable, self-advancing hint sequence for first-time visitors. */
export function Onboarding() {
  const [step, setStep] = useState<number | null>(null);
  const project = useDocument((s) => s.project);
  const mode = useEditor((s) => s.mode);
  const readOnly = useDocument((s) => s.readOnly);

  useEffect(() => {
    const start = () => setStep(0);
    try {
      const empty = useDocument.getState().project.building.levels.every((l) => l.walls.length === 0);
      if (!localStorage.getItem('modulo:onboarded') && !readOnly && empty) setStep(0);
    } catch {
      /* ignore */
    }
    window.addEventListener('modulo:tour', start);
    return () => window.removeEventListener('modulo:tour', start);
  }, [readOnly]);

  useEffect(() => {
    if (step === null) return;
    let s = step;
    while (s < STEPS.length && STEPS[s]!.done()) s++;
    if (s !== step) {
      if (s >= STEPS.length) finish();
      else setStep(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, mode, step]);

  const finish = () => {
    setStep(null);
    try {
      localStorage.setItem('modulo:onboarded', '1');
    } catch {
      /* ignore */
    }
  };

  if (step === null || mode === 'walk') return null;
  const s = STEPS[step]!;
  return (
    <div
      role="dialog"
      aria-label="Getting started"
      className="panel animate-in pointer-events-auto w-[300px] bg-panel-solid p-4 shadow-pop"
      data-testid="onboarding"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.07em] text-accent">
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 className="text-sm font-semibold">{s.title}</h2>
        </div>
        <button
          aria-label="Skip tour"
          onClick={finish}
          className="rounded-md p-1 text-fg-subtle hover:bg-hover hover:text-fg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{s.body}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 w-4 rounded-full ${i <= step ? 'bg-accent' : 'bg-active'}`} />
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={finish} className="h-7 rounded-md px-2 text-xs text-fg-muted hover:bg-hover">
            Skip
          </button>
          <button
            onClick={() => (step + 1 >= STEPS.length ? finish() : setStep(step + 1))}
            className="h-7 rounded-md bg-fg px-2.5 text-xs font-medium text-bg"
          >
            {step + 1 >= STEPS.length ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
