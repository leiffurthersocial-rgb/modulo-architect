import { describe, expect, it } from 'vitest';
import { roofFaces, ridgeHeight } from './roof';
import { stairHeightAt, stairLayout } from './stairs';
import type { Roof, Stair } from '../model/schema';

const roof = (type: Roof['type']): Roof => ({
  id: 'rf_1',
  levelId: 'l_1',
  type,
  auto: true,
  x: 0,
  y: 0,
  width: 10,
  depth: 6,
  rotation: 0,
  ridge: 'auto',
  pitch: 45,
  overhang: 0,
  thickness: 0.2,
  material: 'roof-slate',
});

describe('roofs', () => {
  it('builds gable roofs peaking at half span * tan(pitch)', () => {
    const faces = roofFaces(roof('gable'), 3);
    const maxY = Math.max(...faces.flatMap((f) => f.verts.map((v) => v[1])));
    expect(maxY).toBeCloseTo(3 + 0.2 + 3);
    expect(faces.filter((f) => f.kind === 'gable')).toHaveLength(2);
    expect(ridgeHeight(roof('gable'))).toBeCloseTo(3.2);
  });
  it('builds hip, shed and flat roofs', () => {
    expect(roofFaces(roof('hip'), 3).filter((f) => f.kind === 'top')).toHaveLength(4);
    expect(roofFaces(roof('flat'), 3).filter((f) => f.kind === 'top')).toHaveLength(1);
    const shed = roofFaces(roof('shed'), 3);
    expect(Math.max(...shed.flatMap((f) => f.verts.map((v) => v[1])))).toBeCloseTo(3 + 0.2 + 6);
  });
});

describe('stairs', () => {
  const s: Stair = {
    id: 's_1',
    type: 'straight',
    x: 0,
    y: 0,
    rotation: 0,
    width: 1,
    length: 3.2,
    length2: 1.6,
    turn: 'left',
    rise: null,
    opening: true,
    material: 'floor-oak',
  };
  it('picks comfortable risers', () => {
    const l = stairLayout(s, 2.8);
    expect(l.riser).toBeLessThanOrEqual(0.19);
    expect(l.count * l.riser).toBeCloseTo(2.8);
    expect(l.steps).toHaveLength(l.count);
  });
  it('reports walking height along the run (climbing towards -y)', () => {
    const l = stairLayout(s, 2.8);
    const low = stairHeightAt(l, { x: 0, y: 1.55 })!;
    const high = stairHeightAt(l, { x: 0, y: -1.55 })!;
    expect(low).toBeLessThan(0.3);
    expect(high).toBeCloseTo(2.8);
    expect(stairHeightAt(l, { x: 3, y: 0 })).toBeNull();
  });
  it('lays out L-shaped stairs with a landing', () => {
    const l = stairLayout({ ...s, type: 'l-shaped', length: 2 }, 2.8);
    expect(l.footprint).toHaveLength(3);
    expect(Math.max(...l.steps.map((x) => x.y1))).toBeCloseTo(2.8);
  });
});
