'use client';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { encodeShare, parseProject, projectFileName, serializeProject } from '@/core/model/io';
import type { Project } from '@/core/model/schema';
import { saveProject } from '@/lib/persistence';
import { createFromTemplate } from '@/core/templates';

export function downloadProject(project: Project) {
  const blob = new Blob([serializeProject(project)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = projectFileName(project);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  useEditor.getState().notify(`Exported ${a.download}`);
}

export async function openProjectInEditor(project: Project) {
  await saveProject(project);
  useDocument.getState().load(project);
  const url = new URL(window.location.href);
  url.search = `?project=${encodeURIComponent(project.id)}`;
  window.history.replaceState(null, '', url);
  useEditor.getState().set({ activeLevelId: project.building.levels[0]!.id, selection: [], projectsOpen: false });
  useEditor.getState().requestCamera({ preset: 'iso' });
  useEditor.getState().set({ planFit: Date.now() });
}

export async function importFromFile(file: File): Promise<string | null> {
  const res = parseProject(await file.text());
  if (!res.ok) return res.error;
  await openProjectInEditor(res.project);
  useEditor.getState().notify(`Opened ${res.project.name}${res.migrated ? ' (upgraded from an older version)' : ''}`);
  return null;
}

export function importProjectFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.modulo.json,application/json';
  input.onchange = async () => {
    const f = input.files?.[0];
    if (!f) return;
    const err = await importFromFile(f);
    if (err) useEditor.getState().notify(err);
  };
  input.click();
}

export async function newProjectFromTemplate(id: string) {
  await openProjectInEditor(createFromTemplate(id));
}

/**
 * Read-only share link. The whole project is compressed into the URL hash, so nothing is sent
 * to a server. A future backend can swap this for short ids without touching the viewer.
 */
export async function createShareLink(project: Project): Promise<string> {
  const token = await encodeShare(project);
  return `${window.location.origin}/view#p=${token}`;
}

/** Debounced autosave to IndexedDB. */
export function installAutosave() {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = async () => {
    timer = null;
    const s = useDocument.getState();
    if (s.readOnly || s.revision === s.savedRevision) return;
    const rev = s.revision;
    try {
      await saveProject(s.project);
      useDocument.getState().markSaved(rev);
    } catch (e) {
      console.error('Autosave failed', e);
    }
  };
  const unsub = useDocument.subscribe((s, prev) => {
    if (s.revision !== prev.revision && !s.readOnly) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 500);
    }
  });
  const onHide = () => void flush();
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', onHide);
  return () => {
    unsub();
    window.removeEventListener('pagehide', onHide);
    document.removeEventListener('visibilitychange', onHide);
    if (timer) clearTimeout(timer);
  };
}
