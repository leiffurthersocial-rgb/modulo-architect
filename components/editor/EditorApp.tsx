'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { TopBar } from './TopBar';
import { ToolRail } from './ToolRail';
import { CatalogPanel } from './CatalogPanel';
import { Inspector } from './inspector/Inspector';
import { StatusBar } from './StatusBar';
import { LevelSwitcher } from './LevelSwitcher';
import { ViewControls } from './ViewControls';
import { CommandPalette } from './CommandPalette';
import { ShortcutSheet } from './ShortcutSheet';
import { ProjectsDialog } from './ProjectsDialog';
import { ShareDialog } from './ShareDialog';
import { SettingsDialog } from './SettingsDialog';
import { Onboarding } from './Onboarding';
import { installToolLifecycle } from '@/features/tools/dispatch';
import { refreshSelectionOverlay } from '@/features/tools/select';
import { viewApis } from '@/features/tools/viewApi';
import { installKeyboard } from '@/features/commands/keyboard';
import { installAutosave } from '@/features/project/io';
import { loadProject, saveProject } from '@/lib/persistence';
import { createFromTemplate } from '@/core/templates';
import { cn } from '@/lib/cn';

const Viewport3D = dynamic(() => import('@/features/build/Viewport3D'), {
  ssr: false,
  loading: () => <CanvasLoading />,
});
const PlanView = dynamic(() => import('@/features/plan/PlanView'), { ssr: false });
const WalkView = dynamic(() => import('@/features/walk/WalkView'), {
  ssr: false,
  loading: () => <CanvasLoading />,
});

function CanvasLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg">
      <div className="h-1 w-24 overflow-hidden rounded-full bg-active">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
      </div>
    </div>
  );
}

async function resolveProject() {
  const q = new URLSearchParams(window.location.search);
  const id = q.get('project');
  if (id) {
    const p = await loadProject(id);
    if (p) return p;
  }
  const p = createFromTemplate(q.get('template') ?? 'empty');
  await saveProject(p);
  const url = new URL(window.location.href);
  url.search = `?project=${encodeURIComponent(p.id)}`;
  window.history.replaceState(null, '', url);
  return p;
}

function usePhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px) and (pointer: coarse)');
    const f = () => setPhone(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return phone;
}

export default function EditorApp() {
  const [ready, setReady] = useState(false);
  const mode = useEditor((s) => s.mode);
  const view = useEditor((s) => s.view);
  const uiHidden = useEditor((s) => s.uiHidden);
  const phone = usePhone();

  useEffect(() => {
    let cancelled = false;
    void resolveProject().then((p) => {
      if (cancelled) return;
      useDocument.getState().load(p);
      useEditor.getState().set({ activeLevelId: p.building.levels[0]!.id });
      // Debugging/testing handle (used by the Playwright suite), exposed once loaded.
      (window as unknown as { __modulo: unknown }).__modulo = {
        doc: useDocument,
        editor: useEditor,
        views: viewApis,
      };
      setReady(true);
    });
    const offs = [installToolLifecycle(), installKeyboard(), installAutosave()];
    // Keep handles in sync with the selection / document.
    offs.push(useEditor.subscribe((s, prev) => s.selection !== prev.selection && refreshSelectionOverlay()));
    offs.push(useDocument.subscribe((s, prev) => s.project !== prev.project && refreshSelectionOverlay()));
    return () => {
      cancelled = true;
      offs.forEach((f) => f());
    };
  }, []);

  useEffect(() => {
    if (phone && ready && mode !== 'walk') useEditor.getState().setMode('walk');
  }, [phone, ready, mode]);

  const exitWalk = useCallback(() => {
    const ed = useEditor.getState();
    ed.setMode(phone ? 'walk' : ed.modeBeforeWalk === 'walk' ? 'build' : ed.modeBeforeWalk);
  }, [phone]);

  if (!ready) return <CanvasLoading />;

  const canvas =
    mode === 'walk' ? (
      <WalkView
        onExit={exitWalk}
        exitLabel={phone ? 'Walking (editing needs a larger screen)' : 'Exit walk'}
      />
    ) : view === 'split' ? (
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="relative border-r border-line">
          <PlanView />
        </div>
        <div className="relative">
          <Viewport3D />
        </div>
      </div>
    ) : view === '2d' ? (
      <PlanView />
    ) : (
      <Viewport3D />
    );

  return (
    <TooltipProvider>
      <main className="fixed inset-0 overflow-hidden bg-bg" aria-label="Modulo editor">
        {canvas}
        {mode !== 'walk' && !uiHidden && (
          <div className="pointer-events-none absolute inset-0 z-10">
            <TopBar />
            <div className="pointer-events-none absolute bottom-[60px] left-3 top-[68px] flex items-start gap-2">
              <ToolRail />
              <div className="flex h-full min-h-0 flex-col items-start justify-between gap-2">
                <div className="flex min-h-0 shrink flex-col">
                  <CatalogPanel />
                </div>
                <LevelSwitcherSlot />
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-[60px] right-3 top-[68px] flex flex-col items-end justify-between gap-2">
              <div className="flex min-h-0 flex-1 flex-col items-end">
                <Inspector />
              </div>
              <ViewControls />
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center">
              <div className="flex w-full max-w-[760px] justify-center">
                <div className="w-full">
                  <StatusBar />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-[60px] left-1/2 -translate-x-1/2">
              <Onboarding />
            </div>
          </div>
        )}
        {uiHidden && mode !== 'walk' && (
          <button
            className="animate-fade absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur"
            onClick={() => useEditor.getState().set({ uiHidden: false })}
          >
            Press Tab to show the interface
          </button>
        )}
        <CommandPalette />
        <ShortcutSheet />
        <ProjectsDialog />
        <ShareDialog />
        <SettingsDialog />
      </main>
    </TooltipProvider>
  );
}

/** The level switcher sits under the catalog; when the catalog is tall it hides behind it. */
function LevelSwitcherSlot() {
  const mode = useEditor((s) => s.mode);
  return (
    <div className={cn('shrink-0', mode === 'exterior' && 'hidden')}>
      <LevelSwitcher />
    </div>
  );
}
