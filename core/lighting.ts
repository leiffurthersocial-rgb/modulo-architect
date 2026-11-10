/**
 * Lighting maths: colour temperature, automatic sun colour and sky choice. Pure and tested.
 */
import skies from '@/registry/skies.generated.json';

export type SkyId = 'clear' | 'partly-cloudy' | 'overcast' | 'golden-hour' | 'sunset' | 'night';
export type SkyChoice = 'auto' | SkyId;

export const SKIES: { id: SkyId; name: string }[] = [
  { id: 'clear', name: 'Clear' },
  { id: 'partly-cloudy', name: 'Partly cloudy' },
  { id: 'overcast', name: 'Overcast' },
  { id: 'golden-hour', name: 'Golden hour' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'night', name: 'Night' },
];

export const SKY_META = skies as Record<SkyId, { asset: string; sunU: number; sunV: number; source: string }>;

/**
 * Black-body colour temperature (Kelvin) → linear-ish sRGB in 0..1 (Tanner Helland's fit).
 * 6500 K ≈ white, 2700 K warm incandescent, 9000 K cool blue sky.
 */
export function kelvinToRGB(kelvin: number): [number, number, number] {
  const t = Math.min(40000, Math.max(1000, kelvin)) / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const c = (v: number) => Math.min(1, Math.max(0, v / 255));
  return [c(r), c(g), c(b)];
}

export const kelvinToHex = (k: number) =>
  '#' +
  kelvinToRGB(k)
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

/** Natural sun colour temperature for a given altitude (radians). */
export function sunKelvin(altitude: number): number {
  const deg = (altitude * 180) / Math.PI;
  if (deg <= 0) return 2000;
  if (deg >= 40) return 5800;
  // Warm near the horizon, quickly neutral above ~20°.
  const t = Math.pow(deg / 40, 0.6);
  return 2000 + (5800 - 2000) * t;
}

/** How much daylight there is: 0 at night, 1 in full day (soft through dusk). */
export function daylight(altitude: number): number {
  const deg = (altitude * 180) / Math.PI;
  return Math.min(1, Math.max(0, (deg + 4) / 22));
}

/** Pick a sky for the sun's altitude when the user leaves it on Auto. */
export function autoSky(altitude: number, choice: SkyChoice): SkyId {
  if (choice !== 'auto') return choice;
  const deg = (altitude * 180) / Math.PI;
  if (deg < -3) return 'night';
  if (deg < 6) return 'sunset';
  if (deg < 18) return 'golden-hour';
  return 'partly-cloudy';
}

/**
 * Rotation (about +Y, radians) that turns an equirectangular sky so the sun painted in it lines
 * up with the simulated sun direction (dx, dz in world space).
 */
export function skyRotation(sky: SkyId, sunDir: [number, number, number]): number {
  const meta = SKY_META[sky];
  if (!meta) return 0;
  const phi = (meta.sunU - 0.5) * Math.PI * 2;
  const theta = Math.atan2(sunDir[2], sunDir[0]);
  return phi - theta;
}
