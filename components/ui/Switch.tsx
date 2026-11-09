'use client';
import { Switch as S } from 'radix-ui';

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <S.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="relative h-5 w-9 shrink-0 rounded-full bg-active transition-colors data-[state=checked]:bg-accent"
    >
      <S.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-150 will-change-transform data-[state=checked]:translate-x-[18px]" />
    </S.Root>
  );
}
