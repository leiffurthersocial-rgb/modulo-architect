'use client';
import { useEditor } from '@/store/editor';
import { COMMANDS } from '@/features/commands/commands';
import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';

const EXTRA: { group: string; items: [string, string][] }[] = [
  {
    group: 'While drawing',
    items: [
      ['Type a length, then', 'enter'],
      ['Lock to an axis (hold)', 'shift'],
      ['Bypass snapping (hold)', 'alt'],
      ['Finish / cancel', 'esc'],
      ['Rotate item or stairs while placing', 'r'],
    ],
  },
  {
    group: 'Selection',
    items: [
      ['Add to selection', 'shift'],
      ['Nudge 10 cm (Shift 1 m, Alt 1 cm)', 'arrowup'],
    ],
  },
  {
    group: 'Walk mode',
    items: [
      ['Move', 'w'],
      ['Sprint (hold)', 'shift'],
      ['Slow walk toggle', 'c'],
      ['Exit', 'esc'],
    ],
  },
];

export function ShortcutSheet() {
  const open = useEditor((s) => s.shortcutsOpen);
  const groups = ['Modes', 'Tools', 'Edit', 'Selection', 'View', 'Levels', 'Project', 'Help'] as const;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => useEditor.getState().set({ shortcutsOpen: o })}
      title="Keyboard shortcuts"
      description="Everything is also in the command palette (⌘K / Ctrl K)."
      className="w-[min(860px,calc(100vw-32px))]"
    >
      <div className="scrollbar-thin grid gap-x-8 gap-y-5 overflow-y-auto px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => {
          const list = COMMANDS.filter((c) => c.group === g && c.shortcut);
          if (!list.length) return null;
          return (
            <section key={g}>
              <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">
                {g}
              </h3>
              <ul className="flex flex-col">
                {list.map((c) => (
                  <li key={c.id} className="flex h-7 items-center justify-between gap-3 text-[13px]">
                    <span className="text-fg-muted">{c.title}</span>
                    <Kbd shortcut={c.shortcut!} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {EXTRA.map((g) => (
          <section key={g.group}>
            <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">
              {g.group}
            </h3>
            <ul className="flex flex-col">
              {g.items.map(([label, k]) => (
                <li key={label} className="flex h-7 items-center justify-between gap-3 text-[13px]">
                  <span className="text-fg-muted">{label}</span>
                  <Kbd shortcut={k} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
