import type { Level } from '@/core/model/schema';
import { pointInPolygon } from '@/core/geometry/polygon';
import { MeshBuilder } from './prism';
import type { DerivedLevel } from './derive';

/**
 * One merged mesh per level for all walls (fast to render and to raycast). Side faces pick the
 * interior paint or the facade depending on which side faces outdoors.
 */
export function buildLevelWalls(level: Level, d: DerivedLevel, facadeDefault: string) {
  const mb = new MeshBuilder();
  const y = level.elevation;
  for (const dw of d.walls) {
    const wall = level.walls.find((w) => w.id === dw.id);
    if (!wall || wall.hidden) continue;
    const n = dw.shape.normal;
    const leftMat = dw.leftExterior ? (wall.facade ?? facadeDefault) : wall.materials.left;
    const rightMat = dw.rightExterior ? (wall.facade ?? facadeDefault) : wall.materials.right;
    const capMat = !dw.leftExterior
      ? wall.materials.left
      : !dw.rightExterior
        ? wall.materials.right
        : leftMat;
    for (const piece of dw.pieces) {
      mb.prism(piece.polygon, y + piece.y0, y + piece.y1, dw.id, capMat, (fn) => {
        const dot = fn.x * n.x + fn.y * n.y;
        if (dot > 0.7) return leftMat;
        if (dot < -0.7) return rightMat;
        return capMat;
      });
    }
  }
  const inside = (p: { x: number; y: number }) => d.rooms.some((r) => pointInPolygon(p, r.polygon));
  for (const j of d.junctions) {
    const wid = j.wallIds[0]!;
    const wall = level.walls.find((w) => w.id === wid);
    if (!wall || wall.hidden) continue;
    mb.prism(j.polygon, y, y + j.height, wid, wall.materials.left, (fn, mid) =>
      inside({ x: mid.x + fn.x * 0.05, y: mid.y + fn.y * 0.05 })
        ? wall.materials.left
        : (wall.facade ?? facadeDefault),
    );
  }
  return mb.build();
}
