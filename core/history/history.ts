import { applyPatches, enablePatches, produceWithPatches, type Draft, type Patch } from 'immer';

enablePatches();

/**
 * Command-pattern history built on Immer patches. Every document change is a Command holding the
 * forward patches and their inverse, so undo/redo is exact and cheap regardless of the change.
 */
export interface Command {
  label: string;
  patches: Patch[];
  inverse: Patch[];
  time: number;
  /** Consecutive commands with the same key (e.g. arrow-key nudges on one field) merge. */
  mergeKey?: string;
}

export interface HistoryState<T> {
  present: T;
  past: Command[];
  future: Command[];
  /** An open transaction groups many mutations (e.g. a drag) into one command. */
  txn: Command | null;
}

export const MAX_HISTORY = 300;
const MERGE_WINDOW_MS = 1200;

export function createHistory<T>(present: T): HistoryState<T> {
  return { present, past: [], future: [], txn: null };
}

export function mutate<T>(
  h: HistoryState<T>,
  label: string,
  recipe: (draft: Draft<T>) => void,
  opts: { mergeKey?: string; now?: number } = {},
): HistoryState<T> {
  const [next, patches, inverse] = produceWithPatches(h.present, recipe);
  if (patches.length === 0) return h;
  const now = opts.now ?? Date.now();
  if (h.txn) {
    return {
      ...h,
      present: next as T,
      txn: { ...h.txn, patches: [...h.txn.patches, ...patches], inverse: [...inverse, ...h.txn.inverse] },
    };
  }
  const last = h.past[h.past.length - 1];
  if (opts.mergeKey && last && last.mergeKey === opts.mergeKey && now - last.time < MERGE_WINDOW_MS) {
    const merged: Command = {
      ...last,
      patches: [...last.patches, ...patches],
      inverse: [...inverse, ...last.inverse],
      time: now,
    };
    return { ...h, present: next as T, past: [...h.past.slice(0, -1), merged], future: [] };
  }
  const cmd: Command = { label, patches, inverse, time: now, mergeKey: opts.mergeKey };
  const past = [...h.past, cmd];
  if (past.length > MAX_HISTORY) past.shift();
  return { ...h, present: next as T, past, future: [] };
}

export function begin<T>(h: HistoryState<T>, label: string): HistoryState<T> {
  if (h.txn) return h;
  return { ...h, txn: { label, patches: [], inverse: [], time: Date.now() } };
}

export function commit<T>(h: HistoryState<T>): HistoryState<T> {
  if (!h.txn) return h;
  if (h.txn.patches.length === 0) return { ...h, txn: null };
  const past = [...h.past, h.txn];
  if (past.length > MAX_HISTORY) past.shift();
  return { ...h, past, future: [], txn: null };
}

/** Abort the open transaction, reverting everything it changed. */
export function cancel<T>(h: HistoryState<T>): HistoryState<T> {
  if (!h.txn) return h;
  return { ...h, present: applyPatches(h.present as object, h.txn.inverse) as T, txn: null };
}

export function undo<T>(h: HistoryState<T>): HistoryState<T> {
  const base = h.txn ? commit(h) : h;
  const cmd = base.past[base.past.length - 1];
  if (!cmd) return base;
  return {
    ...base,
    present: applyPatches(base.present as object, cmd.inverse) as T,
    past: base.past.slice(0, -1),
    future: [cmd, ...base.future],
  };
}

export function redo<T>(h: HistoryState<T>): HistoryState<T> {
  const cmd = h.future[0];
  if (!cmd || h.txn) return h;
  return {
    ...h,
    present: applyPatches(h.present as object, cmd.patches) as T,
    past: [...h.past, cmd],
    future: h.future.slice(1),
  };
}
