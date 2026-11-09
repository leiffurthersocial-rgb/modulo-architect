'use client';
import { Select as S } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <S.Root value={value} onValueChange={(v) => onChange(v as T)}>
      <S.Trigger
        aria-label={label}
        className={cn(
          'inline-flex h-8 items-center justify-between gap-2 rounded-[9px] border border-line bg-bg-elevated px-2.5 text-[13px] text-fg hover:border-line-strong',
          className,
        )}
      >
        <S.Value />
        <S.Icon>
          <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={4}
          className="panel animate-in z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden p-1"
        >
          <S.Viewport>
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value}
                className="relative flex h-8 cursor-default select-none items-center rounded-md pl-7 pr-3 text-[13px] outline-none data-[highlighted]:bg-hover"
              >
                <S.ItemIndicator className="absolute left-2">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </S.ItemIndicator>
                <S.ItemText>{o.label}</S.ItemText>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
