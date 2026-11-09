'use client';
import { Tooltip as T } from 'radix-ui';
import type { ReactNode } from 'react';
import { Kbd } from './Kbd';

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <T.Provider delayDuration={350} skipDelayDuration={200}>
      {children}
    </T.Provider>
  );
}

export function Tooltip({
  label,
  shortcut,
  side = 'bottom',
  children,
}: {
  label: ReactNode;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={8}
          className="animate-in z-50 flex items-center gap-2 rounded-md bg-fg px-2 py-1 text-xs font-medium text-bg shadow-pop"
        >
          {label}
          {shortcut && <Kbd shortcut={shortcut} className="[&_kbd]:border-transparent [&_kbd]:bg-bg/15 [&_kbd]:text-bg" />}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
