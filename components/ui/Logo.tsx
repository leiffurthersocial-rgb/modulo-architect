import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-6 w-6', className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--fg)" />
      <path d="M8 22V13l8-5 8 5v9" fill="none" stroke="var(--bg)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M13 22v-5h6v5" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">
        Modulo<span className="font-normal text-fg-subtle">: Architect</span>
      </span>
    </span>
  );
}
