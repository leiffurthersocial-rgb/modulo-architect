export const isMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Render a shortcut like "mod+shift+z" as platform glyphs. */
export function formatShortcut(shortcut: string): string[] {
  const mac = isMac();
  return shortcut.split('+').map((k) => {
    switch (k.toLowerCase()) {
      case 'mod':
        return mac ? '⌘' : 'Ctrl';
      case 'shift':
        return mac ? '⇧' : 'Shift';
      case 'alt':
        return mac ? '⌥' : 'Alt';
      case 'enter':
        return '↵';
      case 'esc':
      case 'escape':
        return 'Esc';
      case 'backspace':
        return '⌫';
      case 'delete':
        return 'Del';
      case 'tab':
        return 'Tab';
      case 'space':
        return 'Space';
      case 'arrowup':
        return '↑';
      case 'arrowdown':
        return '↓';
      default:
        return k.length === 1 ? k.toUpperCase() : k;
    }
  });
}
