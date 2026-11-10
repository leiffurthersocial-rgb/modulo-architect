'use client';
import { useDocument } from './document';
import { useEditor } from './editor';

/** View mode: look around, measure and walk, but nothing can be changed. */
export function setViewMode(on: boolean) {
  const doc = useDocument.getState();
  if (doc.history.txn) doc.commit();
  doc.setReadOnly(on);
  const ed = useEditor.getState();
  ed.setTool('select');
  ed.notify(on ? 'View mode: editing is locked' : 'Editing unlocked');
}

export const toggleViewMode = () => setViewMode(!useDocument.getState().readOnly);
