'use client';
import { Grid } from '@react-three/drei';
import { useDocument } from '@/store/document';
import { useEditor } from '@/store/editor';
import { usePrefs } from '@/store/prefs';
import { LevelView } from '@/features/scene/LevelView';
import { RoofView } from '@/features/scene/RoofView';
import { ItemsLayer } from '@/features/scene/ItemsLayer';
import { Terrain } from '@/features/scene/Terrain';
import { Lighting, SKY_FOG, useSun } from '@/features/scene/Lighting';
import { LampLights } from '@/features/scene/LampLights';
import { Surroundings } from '@/features/scene/Surroundings';
import { getEnvironment } from '@/registry/environments';
import { Ghost } from '@/features/scene/Ghost';
import { Highlights } from '@/features/scene/Highlights';
import { Overlay3D } from '@/features/scene/Overlay3D';
import type { SceneTheme } from '@/lib/hooks/useSceneTheme';

export function levelVariant(
  i: number,
  active: number,
  display: string,
  mode: string,
): 'normal' | 'ghost' | 'hidden' {
  if (mode === 'exterior' || mode === 'walk' || display === 'all') return 'normal';
  if (display === 'isolate') return i === active ? 'normal' : 'hidden';
  if (i <= active) return 'normal';
  return 'ghost';
}

export function SceneContent({
  theme,
  walk = false,
  openDoors,
}: {
  theme: SceneTheme;
  walk?: boolean;
  openDoors?: Record<string, number>;
}) {
  const project = useDocument((s) => s.project);
  const mode = useEditor((s) => s.mode);
  const display = useEditor((s) => s.levelDisplay);
  const activeId = useEditor((s) => s.activeLevelId);
  const selection = useEditor((s) => s.selection);
  const showGrid = usePrefs((s) => s.showGrid);
  const levels = project.building.levels;
  const activeIdx = Math.max(
    0,
    levels.findIndex((l) => l.id === activeId),
  );
  const active = levels[activeIdx]!;
  const effMode = walk ? 'walk' : mode;
  const outdoor = effMode === 'exterior' || effMode === 'walk';
  const planeY = mode === 'exterior' ? 0 : active.elevation;
  const sun = useSun(project);
  const visibleLevels = new Set(
    levels
      .filter((l, i) => !l.hidden && levelVariant(i, activeIdx, display, effMode) === 'normal')
      .map((l) => l.id),
  );

  return (
    <>
      {!outdoor && <color attach="background" args={[theme.background]} />}
      <Lighting project={project} sky={outdoor} dark={theme.dark} />
      {outdoor && (
        <fog
          attach="fog"
          args={[
            SKY_FOG[sun.sky],
            140 * (getEnvironment(project.site.environment).haze ?? 1),
            560 * (getEnvironment(project.site.environment).haze ?? 1),
          ]}
        />
      )}
      <LampLights project={project} visibleLevels={visibleLevels} />
      <Terrain site={project.site} showSurroundings={false} accent={theme.accent} showOutline={!walk} />
      {outdoor && <Surroundings site={project.site} />}
      {!outdoor && showGrid && (
        <Grid
          position={[0, planeY - 0.006, 0]}
          infiniteGrid
          cellSize={0.5}
          sectionSize={5}
          cellThickness={0.6}
          sectionThickness={1}
          cellColor={theme.gridMinor}
          sectionColor={theme.gridMajor}
          fadeDistance={70}
          fadeStrength={1.5}
        />
      )}
      {levels.map((l, i) => {
        const v = levelVariant(i, activeIdx, display, effMode);
        if (v === 'hidden' || l.hidden) return null;
        return (
          <LevelView
            key={l.id}
            project={project}
            level={l}
            variant={v}
            showCeilings={effMode === 'walk'}
            openDoors={openDoors}
          />
        );
      })}
      {project.building.roofs.map((r) => {
        const li = levels.findIndex((l) => l.id === r.levelId);
        const v = levelVariant(li, activeIdx, display, effMode);
        const show = outdoor || display === 'all' || selection.includes(r.id);
        if (!show || v === 'hidden') return null;
        return (
          <RoofView
            key={r.id}
            roof={r}
            project={project}
            variant={v === 'ghost' && !outdoor ? 'ghost' : 'normal'}
          />
        );
      })}
      <ItemsLayer items={project.exterior.items} baseY={0} variant="normal" />
      {!walk && (
        <>
          <Ghost />
          <Highlights accent={theme.accent} danger={theme.danger} />
          <Overlay3D y={planeY} theme={theme} />
        </>
      )}
    </>
  );
}
