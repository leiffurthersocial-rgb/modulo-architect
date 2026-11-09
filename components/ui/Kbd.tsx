import { formatShortcut } from '@/lib/platform';
import { cn } from '@/lib/cn';

export function Kbd({ shortcut, className }: { shortcut: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {formatShortcut(shortcut).map((k, i) => (
        <kbd
          key={i}
          className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] border border-line bg-bg-elevated px-1 font-sans text-[10.5px] font-medium leading-none text-fg-muted"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
