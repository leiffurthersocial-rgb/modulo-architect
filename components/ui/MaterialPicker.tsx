'use client';
import { Popover } from 'radix-ui';
import { Check } from 'lucide-react';
import { getMaterial, materialsFor, type MaterialCategory } from '@/registry/materials';
import { cn } from '@/lib/cn';

export function Swatch({ id, size = 18 }: { id: string; size?: number }) {
  const m = getMaterial(id);
  return (
    <span
      className="inline-block shrink-0 rounded-[5px] ring-1 ring-inset ring-black/10"
      style={{
        width: size,
        height: size,
        background: m.metalness > 0.4 ? `linear-gradient(135deg, ${m.color}, #ffffff66 50%, ${m.color})` : m.color,
        opacity: m.opacity ?? 1,
      }}
    />
  );
}

/** Material slot editor: a swatch button that opens a grid of materials for the category. */
export function MaterialPicker({
  label,
  value,
  category,
  onChange,
}: {
  label: string;
  value: string;
  category: MaterialCategory;
  onChange: (id: string) => void;
}) {
  const list = materialsFor(category);
  const current = getMaterial(value);
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${current.name}`}
          className="flex h-8 w-full items-center gap-2 rounded-[9px] border border-line bg-bg-elevated px-2 text-left text-[13px] hover:border-line-strong"
        >
          <Swatch id={value} />
          <span className="min-w-0 flex-1 truncate text-fg-muted">{label}</span>
          <span className="truncate text-fg">{current.name}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="left" sideOffset={10} align="start" className="panel animate-in z-50 w-[248px] p-2">
          <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">{label}</div>
          <div className="grid grid-cols-6 gap-1.5" role="listbox" aria-label={label}>
            {list.map((m) => (
              <Popover.Close asChild key={m.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={m.id === value}
                  title={m.name}
                  aria-label={m.name}
                  onClick={() => onChange(m.id)}
                  className={cn('relative flex aspect-square items-center justify-center rounded-[8px] p-0.5 hover:ring-2 hover:ring-line-strong', m.id === value && 'ring-2 ring-accent')}
                >
                  <Swatch id={m.id} size={30} />
                  {m.id === value && <Check className="absolute h-3.5 w-3.5 text-white drop-shadow" />}
                </button>
              </Popover.Close>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
