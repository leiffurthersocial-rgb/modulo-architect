import { describe, expect, it } from 'vitest';
import { sunDirection, sunPosition } from './sun';

describe('sun', () => {
  it('is high at summer noon and due south in the northern hemisphere', () => {
    const p = sunPosition(48, 6, 12);
    expect((p.altitude * 180) / Math.PI).toBeGreaterThan(60);
    const d = sunDirection(48, 6, 12);
    expect(d[2]).toBeGreaterThan(0); // south = +z
  });
  it('rises in the east and sets below the horizon at night', () => {
    expect(sunDirection(48, 6, 8)[0]).toBeGreaterThan(0);
    expect(sunPosition(48, 12, 23).altitude).toBeLessThan(0);
  });
});
