'use client';
import { ToggleGroup } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Tooltip } from './Tooltip';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  tooltip?: string;
  shortcut?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  size?: 'sm' | 'md';
  ariaLabel: string;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-[11px] bg-active/60 p-0.5', className)}
    >
      {options.map((o) => {
        const item = (
          <ToggleGroup.Item
            key={o.value}
            value={o.value}
            aria-label={typeof o.label === 'string' ? o.label : o.tooltip}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-[9px] font-medium text-fg-muted transition-all duration-150 hover:text-fg data-[state=on]:bg-panel-solid data-[state=on]:text-fg data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_var(--line)] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:stroke-[1.75]',
              size === 'sm' ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-[13px]',
            )}
          >
            {o.icon}
            {o.label}
          </ToggleGroup.Item>
        );
        return o.tooltip ? (
          <Tooltip key={o.value} label={o.tooltip} shortcut={o.shortcut}>
            {item}
          </Tooltip>
        ) : (
          item
        );
      })}
    </ToggleGroup.Root>
  );
}
