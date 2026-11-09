'use client';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { applyTheme, readTheme, type ThemePref } from '@/lib/theme';
import { IconButton } from '@/components/ui/Button';

const order: ThemePref[] = ['system', 'light', 'dark'];

export function ThemeToggle({ tooltipSide = 'bottom' }: { tooltipSide?: 'bottom' | 'top' | 'left' | 'right' }) {
  const [pref, setPref] = useState<ThemePref>('system');
  useEffect(() => setPref(readTheme()), []);
  const next = order[(order.indexOf(pref) + 1) % order.length]!;
  const Icon = pref === 'system' ? Monitor : pref === 'light' ? Sun : Moon;
  return (
    <IconButton
      label={`Theme: ${pref} (switch to ${next})`}
      tooltipSide={tooltipSide}
      onClick={() => {
        applyTheme(next);
        setPref(next);
      }}
    >
      <Icon />
    </IconButton>
  );
}
