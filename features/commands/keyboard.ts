'use client';
import { COMMANDS } from './commands';
import { dispatch } from '@/features/tools/dispatch';
import { useEditor } from '@/store/editor';
import * as A from '@/store/actions';

/** Does a KeyboardEvent match a shortcut string like "mod+shift+z" / "shift+digit2" / "?". */
export function matches(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1]!;
  const mod = parts.includes('mod');
  const shift = parts.includes('shift');
  const alt = parts.includes('alt');
  if ((e.metaKey || e.ctrlKey) !== mod) return false;
  if (e.altKey !== alt) return false;
  if (key === '?') return e.key === '?';
  if (key.startsWith('digit')) return e.code === `Digit${key.slice(5)}` && e.shiftKey === shift;
  if (e.shiftKey !== shift && key.length === 1 && /[a-z0-9[\]]/.test(key)) return false;
  if (e.shiftKey !== shift && key.length > 1) return false;
  const k = e.key.toLowerCase();
  switch (key) {
    case 'esc':
      return k === 'escape';
    case 'delete':
      return k === 'delete';
    case 'backspace':
      return k === 'backspace';
    case ',':
      return e.key === ',';
    case 'space':
      return e.code === 'Space';
    case 'tab':
      return k === 'tab';
    default:
      return k === key;
  }
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT';
}

export function installKeyboard() {
  const onKey = (e: KeyboardEvent) => {
    const ed = useEditor.getState();
    if (isTyping(e)) {
      if (e.key === 'Escape') (e.target as HTMLElement).blur();
      return;
    }
    if (ed.paletteOpen || ed.shortcutsOpen || ed.projectsOpen || ed.shareOpen || ed.settingsOpen) return;
    if (ed.mode === 'walk' && e.key !== 'Escape' && !(e.metaKey || e.ctrlKey)) return;

    // The active tool gets first dibs (typed lengths, Esc, R to rotate, ...).
    if (dispatch.key(e)) {
      e.preventDefault();
      return;
    }
    // Arrow keys nudge the selection.
    if (e.key.startsWith('Arrow') && ed.selection.length && !(e.metaKey || e.ctrlKey)) {
      const step = e.shiftKey ? 1 : e.altKey ? 0.01 : 0.1;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[
        e.key
      ] as [number, number] | undefined;
      if (d && A.nudgeSelection(d[0], d[1])) {
        e.preventDefault();
        return;
      }
    }
    for (const c of COMMANDS) {
      if (c.when && !c.when()) continue;
      const all = [c.shortcut, ...(c.alt ?? [])].filter(Boolean) as string[];
      if (all.some((s) => matches(e, s))) {
        e.preventDefault();
        c.run();
        return;
      }
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
