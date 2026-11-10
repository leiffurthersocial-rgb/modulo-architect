'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { onTextureLoaded, setMaxAnisotropy } from './materials';

/** With frameloop="demand", re-render when a lazily loaded texture arrives. */
export function TextureInvalidator() {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    setMaxAnisotropy(gl.capabilities.getMaxAnisotropy());
    return onTextureLoaded(() => invalidate());
  }, [invalidate, gl]);
  return null;
}
