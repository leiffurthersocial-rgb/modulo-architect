import { describe, expect, it } from 'vitest';
import { smartStep, snapAngle, snapDelta, snapPoint, type SnapTarget } from './snap';

const empty: SnapTarget = { points: [], midpoints: [], segments: [] };
const base = { step: 0.1, radius: 0.2 };

describe('snapping', () => {
  it('snaps to the grid with round values', () => {
    const r = snapPoint({ x: 1.234, y: 2.468 }, empty, base);
    expect(r.point).toEqual({ x: 1.2, y: 2.5 });
    expect(r.kind).toBe('grid');
  });

  it('does nothing when disabled (Alt)', () => {
    const r = snapPoint({ x: 1.234, y: 2.468 }, empty, { ...base, disabled: true });
    expect(r.point).toEqual({ x: 1.234, y: 2.468 });
  });

  it('prefers endpoints over grid', () => {
    const r = snapPoint({ x: 3.03, y: 0.04 }, { ...empty, points: [{ x: 3.01, y: 0.02 }] }, base);
    expect(r.kind).toBe('endpoint');
    expect(r.point).toEqual({ x: 3.01, y: 0.02 });
  });

  it('snaps to midpoints', () => {
    const r = snapPoint({ x: 2.05, y: 0.05 }, { ...empty, midpoints: [{ x: 2, y: 0 }] }, base);
    expect(r.kind).toBe('midpoint');
  });

  it('projects onto walls in round increments', () => {
    const r = snapPoint(
      { x: 1.33, y: 0.08 },
      { ...empty, segments: [{ a: { x: 0, y: 0 }, b: { x: 4, y: 0 } }] },
      base,
    );
    expect(r.kind).toBe('edge');
    expect(r.point.y).toBeCloseTo(0);
    expect(r.point.x).toBeCloseTo(1.3);
  });

  it('angle-snaps from an anchor, prioritising 90°, and rounds the length', () => {
    const r = snapPoint({ x: 3.04, y: 0.15 }, empty, { ...base, anchor: { x: 0, y: 0 } });
    expect(r.point.y).toBeCloseTo(0);
    expect(r.point.x).toBeCloseTo(3.0);
    const r45 = snapPoint({ x: 2.0, y: 2.05 }, empty, { ...base, anchor: { x: 0, y: 0 } });
    expect(r45.point.x).toBeCloseTo(r45.point.y);
  });

  it('constrains to an axis with Shift even without snapping', () => {
    const r = snapPoint({ x: 3.04, y: 1.2 }, empty, {
      ...base,
      anchor: { x: 0, y: 0 },
      axisLock: true,
      disabled: true,
    });
    expect(r.point).toEqual({ x: 3.04, y: 0 });
  });

  it('aligns with existing points', () => {
    const r = snapPoint(
      { x: 5.02, y: 3.37 },
      { ...empty, points: [{ x: 5, y: -2 }] },
      { ...base, radius: 0.3 },
    );
    expect(r.kind).toBe('align');
    expect(r.point.x).toBe(5);
    expect(r.guides.length).toBe(1);
  });

  it('chooses smart steps by zoom', () => {
    expect(smartStep(0.001)).toBe(0.05);
    expect(smartStep(0.01)).toBe(0.25);
    expect(smartStep(0.05)).toBe(1);
  });

  it('snaps deltas and angles', () => {
    expect(snapDelta({ x: 0.33, y: -0.04 }, 0.1)).toEqual({ x: 0.3, y: 0 });
    expect(snapDelta({ x: 0.33, y: 0.12 }, 0.1, { axisLock: true })).toEqual({ x: 0.3, y: 0 });
    expect(snapAngle(0.4)).toBeCloseTo(Math.PI / 6);
    expect(snapAngle(0.4, 15, true)).toBe(0.4);
  });
});
