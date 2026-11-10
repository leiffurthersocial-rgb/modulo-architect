import type { Level, Project, Stair } from './schema';
import type { Vec2 } from '../geometry/vec2';
import { stairLayout } from '../geometry/stairs';

/** Does this stair climb all the way to the next level (so it needs a stairwell above)? */
export function stairReachesNext(stair: Stair, level: Level): boolean {
  return stair.rise === null || Math.abs(stair.rise - level.height) < 0.05;
}

/** Footprints of stairs on `level` that cut an opening into the floor above (and this level's ceiling). */
export function stairOpenings(level: Level): Vec2[][] {
  return level.stairs
    .filter((s) => !s.hidden && s.opening !== false && stairReachesNext(s, level))
    .flatMap((s) => stairLayout(s, s.rise ?? level.height).footprint);
}

/** Openings to cut into the floor of `level` (from stairs on the level below). */
export function floorVoids(project: Project, level: Level): Vec2[][] {
  const i = project.building.levels.findIndex((l) => l.id === level.id);
  const below = i > 0 ? project.building.levels[i - 1] : undefined;
  return below ? stairOpenings(below) : [];
}
