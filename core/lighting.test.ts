import { describe, expect, it } from 'vitest';
import { autoSky, daylight, kelvinToRGB, kelvinToHex, skyRotation, sunKelvin } from './lighting';

describe('colour temperature', () => {
  it('6500 K is close to white, 2700 K is warm, 9000 K is cool', () => {
    const w = kelvinToRGB(6500);
    expect(w[0]).toBeGreaterThan(0.95);
    expect(w[2]).toBeGreaterThan(0.9);
    const warm = kelvinToRGB(2700);
    expect(warm[0]).toBe(1);
    expect(warm[2]).toBeLessThan(0.6);
    const cool = kelvinToRGB(9000);
    expect(cool[2]).toBe(1);
    expect(cool[0]).toBeLessThan(0.9);
    expect(kelvinToHex(6600)).toMatch(/^#ff/);
  });

  it('the sun warms towards the horizon', () => {
    expect(sunKelvin(0.02)).toBeLessThan(3200);
    expect(sunKelvin(1)).toBeGreaterThan(5500);
  });

  it('daylight and auto sky follow the sun', () => {
    expect(daylight(-0.3)).toBe(0);
    expect(daylight(1)).toBe(1);
    expect(autoSky(-0.2, 'auto')).toBe('night');
    expect(autoSky(0.05, 'auto')).toBe('sunset');
    expect(autoSky(1, 'auto')).toBe('partly-cloudy');
    expect(autoSky(1, 'overcast')).toBe('overcast');
  });

  it('rotates a sky so its sun lines up with the simulated sun', () => {
    const r = skyRotation('clear', [1, 0.5, 0]);
    expect(Number.isFinite(r)).toBe(true);
  });
});
