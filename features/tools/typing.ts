/** Shared CAD-style numeric entry: type while drawing, Enter applies. */
export type TypingResult =
  { kind: 'update'; text: string } | { kind: 'enter'; text: string } | { kind: 'cancel' } | null;

export function typingKey(e: KeyboardEvent, text: string): TypingResult {
  if (e.metaKey || e.ctrlKey) return null;
  if (e.key === 'Enter') return text ? { kind: 'enter', text } : null;
  if (e.key === 'Escape') return text ? { kind: 'cancel' } : null;
  if (e.key === 'Backspace') return text ? { kind: 'update', text: text.slice(0, -1) } : null;
  const startsInput = /^[0-9.]$/.test(e.key);
  const continues = /^[0-9.,+\-*/()'" a-zA-Z×]$/.test(e.key);
  if ((text === '' && startsInput) || (text !== '' && continues))
    return { kind: 'update', text: text + e.key };
  return null;
}
