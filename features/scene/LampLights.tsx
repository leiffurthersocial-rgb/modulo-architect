'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Project } from '@/core/model/schema';
import { DEFAULT_LIGHTING } from '@/core/model/schema';
import { getElement } from '@/registry';
import { kelvinToRGB } from '@/core/lighting';
import { itemToPlan } from '@/core/model/footprint';

const MAX_LIGHTS = 24;

/** Real light from lamps: every element with a `light` emits a warm point light. */
export function LampLights({ project, visibleLevels }: { project: Project; visibleLevels: Set<string> }) {
  const L = project.lighting ?? DEFAULT_LIGHTING;
  const lights = useMemo(() => {
    if (!L.lamps || L.lampIntensity <= 0) return [];
    const out: { key: string; pos: [number, number, number]; intensity: number; distance: number }[] = [];
    const add = (items: Project['exterior']['items'], base: number) => {
      for (const it of items) {
        if (it.hidden) continue;
        const def = getElement(it.type);
        if (!def?.light) continue;
        const p = itemToPlan(it, { x: def.light.x ?? 0, y: def.light.z ?? 0 });
        const y = base + it.z + (def.light.y < 0 ? it.size.h + def.light.y : def.light.y);
        out.push({
          key: it.id,
          pos: [p.x, y, p.y],
          intensity: def.light.intensity ?? 6,
          distance: def.light.distance ?? 9,
        });
      }
    };
    for (const l of project.building.levels) if (visibleLevels.has(l.id)) add(l.items, l.elevation);
    add(project.exterior.items, 0);
    return out.slice(0, MAX_LIGHTS);
  }, [project.building.levels, project.exterior.items, visibleLevels, L.lamps, L.lampIntensity]);
  const color = useMemo(
    () => new THREE.Color().setRGB(...kelvinToRGB(L.lampTemperature), THREE.SRGBColorSpace),
    [L.lampTemperature],
  );
  return (
    <>
      {lights.map((l) => (
        <pointLight
          key={l.key}
          position={l.pos}
          color={color}
          intensity={l.intensity * L.lampIntensity}
          distance={l.distance}
          decay={2}
        />
      ))}
    </>
  );
}
