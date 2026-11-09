'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/** Text input that commits on Enter / blur (one undo step per edit). */
export function TextField({ value, onChange, label, className }: { value: string; onChange: (v: string) => void; label: string; className?: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <input
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => text.trim() && text !== value && onChange(text.trim())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setText(value);
          (e.target as HTMLInputElement).blur();
        }
        e.stopPropagation();
      }}
      className={cn(
        'h-8 w-full rounded-[9px] border border-line bg-bg-elevated px-2.5 text-[13px] text-fg outline-none hover:border-line-strong focus:border-accent focus:ring-2 focus:ring-accent-soft',
        className,
      )}
    />
  );
}
