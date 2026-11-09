'use client';
import { useEffect, useState } from 'react';
import { isDarkNow } from '@/lib/theme';

export interface SceneTheme {
  dark: boolean;
  background: string;
  gridMinor: string;
  gridMajor: string;
  accent: string;
  fg: string;
  danger: string;
}

function read(): SceneTheme {
  const dark = isDarkNow();
  return {
    dark,
    background: dark ? '#17171a' : '#efeee9',
    gridMinor: dark ? '#26262b' : '#e2e0da',
    gridMajor: dark ? '#34343b' : '#d2cfc7',
    accent: dark ? '#7090ff' : '#3b5bdb',
    fg: dark ? '#ededef' : '#1c1c1e',
    danger: dark ? '#ff6b6b' : '#d63c3c',
  };
}

/** Theme colours for WebGL (which can't read CSS variables). */
export function useSceneTheme(): SceneTheme {
  const [theme, setTheme] = useState<SceneTheme>(() => (typeof window === 'undefined' ? readFallback() : read()));
  useEffect(() => {
    const update = () => setTheme(read());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    window.addEventListener('modulo:theme', update);
    update();
    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('modulo:theme', update);
    };
  }, []);
  return theme;
}

function readFallback(): SceneTheme {
  return {
    dark: false,
    background: '#efeee9',
    gridMinor: '#e2e0da',
    gridMajor: '#d2cfc7',
    accent: '#3b5bdb',
    fg: '#1c1c1e',
    danger: '#d63c3c',
  };
}
