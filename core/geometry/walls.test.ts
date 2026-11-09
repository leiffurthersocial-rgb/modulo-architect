import { describe, expect, it } from 'vitest';
import { computeWallShapes, wallPieces } from './walls';
import { area } from './polygon';

const nodes = new Map([
  ['a', { x: 0, y: 0 }],
  ['b', { x: 4, y: 0 }],
  ['c', { x: 4, y: 3 }],
  ['d', { x: 8, y: 0 }],
  ['e', { x: 4, y: -3 }],
]);

describe('wall joins', () => {
  it('square-ends a free wall', () => {
    const { walls } = computeWallShapes(nodes, [{ id: 'w', a: 'a', b: 'b', thickness: 0.2 }]);
    const s = walls.get('w')!;
    expect(s.startLeft).toEqual({ x: 0, y: 0.1 });
    expect(s.startRight.y).toBeCloseTo(-0.1);
    expect(area(s.polygon)).toBeCloseTo(0.8);
  });

  it('miters an L corner exactly', () => {
    const { walls } = computeWallShapes(nodes, [
      { id: 'w1', a: 'a', b: 'b', thickness: 0.2 },
      { id: 'w2', a: 'b', b: 'c', thickness: 0.2 },
    ]);
    const w1 = walls.get('w1')!;
    const w2 = walls.get('w2')!;
    // Outer corner at (4.1, -0.1), inner corner at (3.9, 0.1)
    expect(w1.endRight.x).toBeCloseTo(4.1);
    expect(w1.endRight.y).toBeCloseTo(-0.1);
    expect(w1.endLeft.x).toBeCloseTo(3.9);
    expect(w1.endLeft.y).toBeCloseTo(0.1);
    expect(w2.startRight.x).toBeCloseTo(4.1);
    expect(w2.startRight.y).toBeCloseTo(-0.1);
    expect(w2.startLeft.x).toBeCloseTo(3.9);
    expect(w2.startLeft.y).toBeCloseTo(0.1);
  });

  it('joins straight continuations without spikes', () => {
    const { walls } = computeWallShapes(nodes, [
      { id: 'w1', a: 'a', b: 'b', thickness: 0.2 },
      { id: 'w2', a: 'b', b: 'd', thickness: 0.2 },
    ]);
    expect(walls.get('w1')!.endLeft).toEqual({ x: 4, y: 0.1 });
    expect(walls.get('w2')!.startLeft.x).toBeCloseTo(4);
  });

  it('creates a junction polygon for T / cross joins', () => {
    const { junctions } = computeWallShapes(nodes, [
      { id: 'w1', a: 'a', b: 'b', thickness: 0.2 },
      { id: 'w2', a: 'b', b: 'c', thickness: 0.2 },
      { id: 'w3', a: 'b', b: 'd', thickness: 0.2 },
      { id: 'w4', a: 'b', b: 'e', thickness: 0.2 },
    ]);
    expect(junctions).toHaveLength(1);
    expect(area(junctions[0]!.polygon)).toBeCloseTo(0.04);
  });
});

describe('opening cuts', () => {
  const { walls } = computeWallShapes(nodes, [{ id: 'w', a: 'a', b: 'b', thickness: 0.2 }]);
  const shape = walls.get('w')!;

  it('returns the full wall without openings', () => {
    expect(wallPieces(shape, 2.8, [])).toHaveLength(1);
  });

  it('cuts a door into left, header and right pieces', () => {
    const pieces = wallPieces(shape, 2.8, [{ id: 'd', offset: 2, width: 1, sill: 0, height: 2.1 }]);
    expect(pieces).toHaveLength(3);
    const volume = pieces.reduce((s, p) => s + area(p.polygon) * (p.y1 - p.y0), 0);
    expect(volume).toBeCloseTo(0.8 * 2.8 - 0.2 * 1 * 2.1);
  });

  it('cuts a window into four pieces', () => {
    const pieces = wallPieces(shape, 2.8, [{ id: 'win', offset: 2, width: 1.2, sill: 0.9, height: 1.2 }]);
    expect(pieces).toHaveLength(4);
  });

  it('handles adjacent openings', () => {
    const pieces = wallPieces(shape, 2.8, [
      { id: 'a', offset: 1, width: 1, sill: 0.9, height: 1.2 },
      { id: 'b', offset: 2.5, width: 1, sill: 0, height: 2.1 },
    ]);
    const volume = pieces.reduce((s, p) => s + area(p.polygon) * (p.y1 - p.y0), 0);
    expect(volume).toBeCloseTo(0.2 * (4 * 2.8 - 1 * 1.2 - 1 * 2.1));
  });
});
