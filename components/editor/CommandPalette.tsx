'use client';
import { Command } from 'cmdk';
import { useEditor } from '@/store/editor';
import { COMMANDS, type Command as Cmd } from '@/features/commands/commands';
import { allElements } from '@/registry';
import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';

const GROUP_ORDER: Cmd['group'][] = [
  'Tools',
  'Build',
  'Modes',
  'Edit',
  'Selection',
  'Levels',
  'View',
  'Project',
  'Help',
];

export function CommandPalette() {
  const open = useEditor((s) => s.paletteOpen);
  const close = () => useEditor.getState().set({ paletteOpen: false });
  const run = (fn: () => void) => {
    close();
    setTimeout(fn, 0);
  };
  const visible = COMMANDS.filter((c) => !c.when || c.when());
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => useEditor.getState().set({ paletteOpen: o })}
      title="Command palette"
      hideHeader
      className="top-[16vh]"
    >
      <Command label="Command palette" loop className="flex min-h-0 flex-col" data-testid="palette">
        <div className="border-b border-line px-4">
          <Command.Input
            autoFocus
            placeholder="Type a command or search the catalog…"
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-fg-subtle"
          />
        </div>
        <Command.List className="scrollbar-thin max-h-[52vh] overflow-y-auto p-1.5">
          <Command.Empty className="py-8 text-center text-[13px] text-fg-subtle">
            No matching command.
          </Command.Empty>
          {GROUP_ORDER.map((g) => {
            const items = visible.filter((c) => c.group === g);
            if (!items.length) return null;
            return (
              <Command.Group
                key={g}
                heading={g}
                className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-fg-subtle"
              >
                {items.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={`${c.title} ${c.keywords ?? ''} ${c.id}`}
                    onSelect={() => run(c.run)}
                    className="flex h-9 cursor-default items-center justify-between rounded-[8px] px-2.5 text-[13.5px] data-[selected=true]:bg-hover"
                  >
                    <span>{c.title}</span>
                    {c.shortcut && <Kbd shortcut={c.shortcut} />}
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
          <Command.Group
            heading="Place"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-fg-subtle"
          >
            {allElements().map((e) => {
              const Icon = e.icon;
              return (
                <Command.Item
                  key={e.id}
                  value={`place ${e.name} ${e.category} ${(e.tags ?? []).join(' ')}`}
                  onSelect={() =>
                    run(() => {
                      const ed = useEditor.getState();
                      if (e.kind === 'outdoor' && ed.mode !== 'exterior') ed.setMode('exterior');
                      if (e.kind === 'furniture' && ed.mode !== 'furnish' && ed.mode !== 'build')
                        ed.setMode('furnish');
                      useEditor.getState().setTool('place', { kind: 'element', id: e.id });
                    })
                  }
                  className="flex h-9 cursor-default items-center gap-2.5 rounded-[8px] px-2.5 text-[13.5px] data-[selected=true]:bg-hover [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-fg-subtle"
                >
                  <Icon />
                  <span className="flex-1">Place {e.name.toLowerCase()}</span>
                  <span className="text-xs text-fg-subtle">{e.category}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>
      </Command>
    </Dialog>
  );
}
