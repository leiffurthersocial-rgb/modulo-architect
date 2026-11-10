'use client';
import { Popover } from 'radix-ui';
import { Check, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getMaterial, materialsFor, type MaterialCategory, type MaterialDef } from '@/registry/materials';
import { cn } from '@/lib/cn';

/** A material preview: the scan thumbnail (tinted where needed) or the flat colour. */
export function Swatch({ id, size = 18, className }: { id: string; size?: number; className?: string }) {
  const m = getMaterial(id);
  const thumb = m.maps?.thumb;
  const style: React.CSSProperties = {
    width: size,
    height: size,
    opacity: m.opacity ? Math.max(0.5, m.opacity) : 1,
  };
  if (thumb) {
    style.backgroundImage = `url(${thumb})`;
    style.backgroundSize = 'cover';
    if (m.tinted) {
      style.backgroundColor = m.color;
      style.backgroundBlendMode = 'multiply';
      style.filter = 'grayscale(0)';
    }
  } else {
    style.background =
      m.metalness > 0.4 ? `linear-gradient(135deg, ${m.color}, #ffffff88 50%, ${m.color})` : m.color;
  }
  return (
    <span
      className={cn('inline-block shrink-0 rounded-[5px] ring-1 ring-inset ring-black/10', className)}
      style={style}
    />
  );
}

function groupBy(list: MaterialDef[]) {
  const out = new Map<string, MaterialDef[]>();
  for (const m of list) {
    const g = m.group ?? 'Other';
    out.set(g, [...(out.get(g) ?? []), m]);
  }
  return [...out.entries()];
}

/** Material slot editor: a swatch button that opens a grouped grid of real material previews. */
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
  const all = useMemo(() => materialsFor(category), [category]);
  const [hover, setHover] = useState<MaterialDef | null>(null);
  const [q, setQ] = useState('');
  const current = getMaterial(value);
  const list = q
    ? all.filter((m) => `${m.name} ${m.group ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    : all;
  const groups = groupBy(list);
  const shown = hover ?? current;
  return (
    <Popover.Root onOpenChange={() => (setHover(null), setQ(''))}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${current.name}`}
          className="flex h-9 w-full items-center gap-2 rounded-[9px] border border-line bg-bg-elevated px-1.5 text-left text-[13px] hover:border-line-strong"
        >
          <Swatch id={value} size={24} />
          <span className="min-w-0 flex-1 truncate text-fg-muted">{label}</span>
          <span className="truncate pr-1 text-fg">{current.name}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="left"
          sideOffset={10}
          align="start"
          collisionPadding={12}
          className="panel animate-in z-50 flex max-h-[min(560px,80vh)] w-[312px] flex-col bg-panel-solid p-2"
          data-testid="material-picker"
        >
          <div className="flex items-center gap-2.5 px-1 pb-2">
            <Swatch id={shown.id} size={44} className="rounded-[9px]" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">
                {label}
              </div>
              <div className="truncate text-sm font-medium">{shown.name}</div>
              <div className="text-[11px] text-fg-subtle">
                {shown.uvScale
                  ? `${shown.group ?? 'Scan'} · ${shown.uvScale[0].toFixed(shown.uvScale[0] < 1 ? 2 : 1)} m repeat`
                  : (shown.group ?? 'Solid finish')}
              </div>
            </div>
          </div>
          {all.length > 18 && (
            <label className="mx-1 mb-2 flex h-8 items-center gap-2 rounded-[8px] border border-line bg-bg-elevated px-2 focus-within:border-accent">
              <Search className="h-3.5 w-3.5 text-fg-subtle" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search finishes"
                aria-label="Search finishes"
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-fg-subtle"
              />
            </label>
          )}
          <div
            className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-1"
            role="listbox"
            aria-label={label}
            onMouseLeave={() => setHover(null)}
          >
            {groups.map(([g, items]) => (
              <section key={g} className="mb-2">
                {groups.length > 1 && (
                  <div className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.07em] text-fg-subtle">
                    {g}
                  </div>
                )}
                <div className="grid grid-cols-6 gap-1.5">
                  {items.map((m) => (
                    <Popover.Close asChild key={m.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={m.id === value}
                        title={m.name}
                        aria-label={m.name}
                        data-material={m.id}
                        onMouseEnter={() => setHover(m)}
                        onFocus={() => setHover(m)}
                        onClick={() => onChange(m.id)}
                        className={cn(
                          'relative flex aspect-square items-center justify-center rounded-[9px] p-0.5 transition-shadow hover:ring-2 hover:ring-line-strong',
                          m.id === value && 'ring-2 ring-accent',
                        )}
                      >
                        <Swatch id={m.id} size={40} className="h-full w-full rounded-[7px]" />
                        {m.id === value && <Check className="absolute h-4 w-4 text-white drop-shadow" />}
                      </button>
                    </Popover.Close>
                  ))}
                </div>
              </section>
            ))}
            {groups.length === 0 && (
              <p className="py-6 text-center text-xs text-fg-subtle">No finish matches.</p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
