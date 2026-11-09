'use client';
import { ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Section({ title, children, action, className }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0', className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.07em] text-fg-subtle">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Progressive disclosure: advanced parameters live under "More". */
export function More({ children, label = 'More' }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 self-start rounded-md py-0.5 text-xs font-medium text-fg-muted hover:text-fg"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-90')} />
        {label}
      </button>
      {open && <div className="animate-in flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-2', className)}>{children}</div>;
}

export function LabeledRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <span className="text-[13px] text-fg-muted">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}
