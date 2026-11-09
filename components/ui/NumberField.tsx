'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  baseStep,
  editableValue,
  formatValue,
  parseValue,
  type UnitSystem,
  type ValueKind,
} from '@/core/units/units';

export interface NumberFieldProps {
  label: string;
  value: number;
  kind?: ValueKind;
  units: UnitSystem;
  min?: number;
  max?: number;
  /** Base step for arrows and scrubbing (defaults per kind). */
  step?: number;
  disabled?: boolean;
  /** Called for typed values, arrow nudges (with mergeKey) and scrubbing. */
  onChange: (value: number, source: 'type' | 'nudge' | 'scrub') => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  className?: string;
  testId?: string;
  /** Short label shown inside the field (e.g. "W"). */
  short?: string;
}

const clamp = (v: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));

/**
 * Numeric input with units. Type a value or an expression (2.5*3, 320cm, 10' 6"), use ↑/↓
 * (Shift ×10, Alt ×0.1), or drag the label to scrub.
 */
export function NumberField({
  label,
  value,
  kind = 'length',
  units,
  min,
  max,
  step,
  disabled,
  onChange,
  onScrubStart,
  onScrubEnd,
  className,
  testId,
  short,
}: NumberFieldProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const scrub = useRef<{ x: number; v: number; moved: boolean } | null>(null);
  const s = step ?? baseStep(kind, units);

  useEffect(() => {
    if (!focused) setText(editableValue(value, kind, units));
  }, [value, kind, units, focused]);

  const commit = () => {
    const v = parseValue(text, kind, units);
    if (v === null || !Number.isFinite(v)) {
      setError(true);
      setTimeout(() => setError(false), 600);
      setText(editableValue(value, kind, units));
      return;
    }
    const c = clamp(v, min, max);
    if (Math.abs(c - value) > 1e-9) onChange(c, 'type');
    setText(editableValue(c, kind, units));
  };

  const nudge = (dir: number, e: { shiftKey: boolean; altKey: boolean }) => {
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    const base = focused ? (parseValue(text, kind, units) ?? value) : value;
    const next = clamp(
      Math.round((base + dir * s * mult) / (s * (e.altKey ? 0.1 : 1))) * s * (e.altKey ? 0.1 : 1),
      min,
      max,
    );
    onChange(next, 'nudge');
    setText(editableValue(next, kind, units));
  };

  return (
    <div
      className={cn(
        'group relative flex h-8 items-center rounded-[9px] border bg-bg-elevated transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft',
        error ? 'border-danger' : 'border-line hover:border-line-strong',
        disabled && 'opacity-50',
        className,
      )}
    >
      <span
        role="slider"
        aria-label={`${label} (drag to adjust)`}
        aria-valuenow={Math.round(value * 1000) / 1000}
        tabIndex={-1}
        className={cn(
          'flex h-full shrink-0 select-none items-center pl-2.5 pr-1.5 text-[11px] font-medium text-fg-subtle',
          !disabled && 'cursor-ew-resize hover:text-accent',
        )}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          (e.target as Element).setPointerCapture(e.pointerId);
          scrub.current = { x: e.clientX, v: value, moved: false };
        }}
        onPointerMove={(e) => {
          const sc = scrub.current;
          if (!sc) return;
          const dx = e.clientX - sc.x;
          if (!sc.moved && Math.abs(dx) < 3) return;
          if (!sc.moved) {
            sc.moved = true;
            onScrubStart?.();
          }
          const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
          const unit = kind === 'length' ? Math.max(s, 0.01) : s;
          const raw = sc.v + Math.round(dx / 3) * unit * mult;
          onChange(clamp(raw, min, max), 'scrub');
        }}
        onPointerUp={() => {
          if (scrub.current?.moved) onScrubEnd?.();
          else input.current?.focus();
          scrub.current = null;
        }}
      >
        {short ?? label}
      </span>
      <input
        ref={input}
        data-testid={testId}
        aria-label={label}
        disabled={disabled}
        inputMode="decimal"
        className="tnum h-full min-w-0 flex-1 bg-transparent pr-2.5 text-right text-[13px] text-fg outline-none"
        value={focused ? text : formatValue(value, kind, units)}
        onFocus={(e) => {
          setFocused(true);
          setText(editableValue(value, kind, units));
          requestAnimationFrame(() => e.target.select());
        }}
        onBlur={() => {
          commit();
          setFocused(false);
        }}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            (e.target as HTMLInputElement).select();
          } else if (e.key === 'Escape') {
            setText(editableValue(value, kind, units));
            setFocused(false);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            nudge(e.key === 'ArrowUp' ? 1 : -1, e);
          }
          e.stopPropagation();
        }}
      />
    </div>
  );
}
