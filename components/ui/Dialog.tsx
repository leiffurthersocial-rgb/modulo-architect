'use client';
import { Dialog as D } from 'radix-ui';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideHeader,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="animate-fade fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" />
        <D.Content
          className={cn(
            'panel animate-in fixed left-1/2 top-[12vh] z-50 flex max-h-[76vh] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden bg-panel-solid shadow-pop outline-none',
            className,
          )}
        >
          {hideHeader ? (
            <D.Title className="sr-only">{title}</D.Title>
          ) : (
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <D.Title className="text-[15px] font-semibold">{title}</D.Title>
                {description && <D.Description className="mt-0.5 text-[13px] text-fg-muted">{description}</D.Description>}
              </div>
              <D.Close aria-label="Close" className="rounded-md p-1 text-fg-subtle hover:bg-hover hover:text-fg">
                <X className="h-4 w-4" />
              </D.Close>
            </header>
          )}
          {hideHeader && <D.Description className="sr-only">{description ?? title}</D.Description>}
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
