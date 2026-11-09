'use client';
import { create } from 'zustand';
import type { Draft } from 'immer';
import type { Project } from '@/core/model/schema';
import { createProject } from '@/core/model/defaults';
import * as H from '@/core/history/history';
import { refitRoofs } from '@/core/model/ops';

/**
 * The document store: the project plus its command history. All edits go through `mutate`
 * (one undoable command) or a `begin` / `mutate`* / `commit` transaction (e.g. a drag).
 */
export interface DocumentState {
  history: H.HistoryState<Project>;
  project: Project;
  /** Bumps on every change, used for autosave and cache keys. */
  revision: number;
  /** Revision at last successful save. */
  savedRevision: number;
  readOnly: boolean;

  load: (project: Project, opts?: { readOnly?: boolean }) => void;
  mutate: (label: string, recipe: (draft: Draft<Project>) => void, opts?: { mergeKey?: string }) => void;
  begin: (label: string) => void;
  commit: () => void;
  cancel: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: (revision: number) => void;
}

function apply(h: H.HistoryState<Project>, s: DocumentState) {
  return { history: h, project: h.present, revision: h.present === s.project ? s.revision : s.revision + 1 };
}

export const useDocument = create<DocumentState>()((set, get) => {
  const initial = createProject();
  return {
    history: H.createHistory(initial),
    project: initial,
    revision: 0,
    savedRevision: 0,
    readOnly: false,

    load: (project, opts) =>
      set((s) => ({
        history: H.createHistory(project),
        project,
        revision: s.revision + 1,
        savedRevision: s.revision + 1,
        readOnly: !!opts?.readOnly,
      })),

    mutate: (label, recipe, opts) => {
      const s = get();
      if (s.readOnly) return;
      const h = H.mutate(
        s.history,
        label,
        (d) => {
          recipe(d);
          // Normalisation that must follow any geometry change.
          refitRoofs(d as Project);
          d.updatedAt = Date.now();
        },
        opts,
      );
      if (h !== s.history) set(apply(h, s));
    },
    begin: (label) => set((s) => ({ history: H.begin(s.history, label) })),
    commit: () => set((s) => ({ history: H.commit(s.history) })),
    cancel: () => {
      const s = get();
      set(apply(H.cancel(s.history), s));
    },
    undo: () => {
      const s = get();
      set(apply(H.undo(s.history), s));
    },
    redo: () => {
      const s = get();
      set(apply(H.redo(s.history), s));
    },
    markSaved: (revision) => set({ savedRevision: revision }),
  };
});

export const getProject = () => useDocument.getState().project;
