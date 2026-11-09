'use client';
import { FolderOpen, PencilRuler } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { decodeShare, parseProject } from '@/core/model/io';
import type { Project } from '@/core/model/schema';
import { createId } from '@/core/model/ids';
import { saveProject } from '@/lib/persistence';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/Button';
import { Wordmark } from '@/components/ui/Logo';
import WalkView from './WalkView';

/**
 * Guest viewer: opens a shared project (URL hash or file) straight into Walk mode, read-only.
 * No account, no network: the project lives in the link.
 */
export default function Viewer() {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const input = useRef<HTMLInputElement>(null);

  const open = (p: Project) => {
    useDocument.getState().load(p, { readOnly: true });
    useEditor.getState().set({ mode: 'walk', activeLevelId: p.building.levels[0]!.id });
    setProject(p);
  };

  useEffect(() => {
    const m = window.location.hash.match(/p=([A-Za-z0-9_-]+)/);
    if (!m) {
      setLoading(false);
      return;
    }
    void decodeShare(m[1]!).then((res) => {
      setLoading(false);
      if (res.ok) open(res.project);
      else setError(res.error);
    });
  }, []);

  if (project)
    return (
      <TooltipProvider>
        <main className="fixed inset-0 bg-bg">
          <WalkView onExit={() => setProject(null)} exitLabel={`Leave ${project.name}`} />
        </main>
      </TooltipProvider>
    );

  return (
    <TooltipProvider>
      <main className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <Wordmark />
        {loading ? (
          <p className="text-fg-muted">Opening the walkthrough…</p>
        ) : (
          <>
            <div className="max-w-md">
              <h1 className="text-2xl font-semibold tracking-tight">
                {error ? 'This link could not be opened' : 'Walk through a house'}
              </h1>
              <p className="mt-2 text-fg-muted">
                {error ?? 'Open a .modulo.json file to explore it in first person. Nothing is uploaded.'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="primary"
                icon={<FolderOpen className="h-4 w-4" />}
                onClick={() => input.current?.click()}
              >
                Open a file
              </Button>
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-panel-solid px-3.5 text-sm font-medium hover:bg-hover"
              >
                <PencilRuler className="h-4 w-4" /> Design your own
              </Link>
            </div>
            <input
              ref={input}
              type="file"
              accept=".json,.modulo.json,application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const res = parseProject(await f.text());
                if (res.ok) open(res.project);
                else setError(res.error);
              }}
            />
          </>
        )}
      </main>
    </TooltipProvider>
  );
}

/** Save a viewed project as an editable copy. */
export async function copyToEditor(p: Project) {
  const copy = { ...p, id: createId('project'), name: `${p.name} (copy)` };
  await saveProject(copy);
  window.location.href = `/editor?project=${copy.id}`;
}
