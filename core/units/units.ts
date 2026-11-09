import { evaluate } from './expression';

export type UnitSystem = 'metric' | 'imperial';
export type ValueKind = 'length' | 'angle' | 'number' | 'percent' | 'area';

const FT = 0.3048;
const IN = 0.0254;

export const LENGTH_UNITS: Record<string, number> = {
  m: 1,
  meter: 1,
  meters: 1,
  cm: 0.01,
  mm: 0.001,
  km: 1000,
  ft: FT,
  feet: FT,
  foot: FT,
  "'": FT,
  in: IN,
  inch: IN,
  inches: IN,
  '"': IN,
  yd: 0.9144,
};

export const ANGLE_UNITS: Record<string, number> = {
  deg: Math.PI / 180,
  '°': Math.PI / 180,
  rad: 1,
};

/** Parse a user-typed value into base units (meters / radians / raw number). */
export function parseValue(text: string, kind: ValueKind, system: UnitSystem): number | null {
  switch (kind) {
    case 'length':
      return evaluate(text, { units: LENGTH_UNITS, defaultFactor: system === 'metric' ? 1 : FT });
    case 'angle':
      return evaluate(text, { units: ANGLE_UNITS, defaultFactor: Math.PI / 180 });
    case 'percent':
      return evaluate(text.replace('%', ''), { units: {}, defaultFactor: 0.01 });
    default:
      return evaluate(text, { units: {}, defaultFactor: 1 });
  }
}

const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

export function formatLength(
  m: number,
  system: UnitSystem,
  opts: { unit?: boolean; precision?: number } = {},
) {
  const withUnit = opts.unit ?? true;
  if (system === 'metric') {
    const p = opts.precision ?? 2;
    const s = (Math.round(m * 10 ** p) / 10 ** p).toFixed(p);
    return withUnit ? `${s} m` : s;
  }
  const sign = m < 0 ? '-' : '';
  const totalIn = Math.round((Math.abs(m) / IN) * 4) / 4;
  let ft = Math.floor(totalIn / 12);
  let inches = totalIn - ft * 12;
  if (inches >= 12) {
    ft += 1;
    inches -= 12;
  }
  const whole = Math.floor(inches);
  const frac = FRACTIONS[Math.round((inches - whole) * 100) / 100] ?? '';
  const inStr = `${whole}${frac}"`;
  if (ft === 0) return `${sign}${inStr}`;
  return `${sign}${ft}' ${inStr}`;
}

/** A plain editable string (no fractions/symbols that the parser would choke on). */
export function editableLength(m: number, system: UnitSystem): string {
  if (system === 'metric') return String(Math.round(m * 1000) / 1000);
  const totalIn = Math.round((m / IN) * 100) / 100;
  const ft = Math.trunc(totalIn / 12);
  const inches = Math.round((totalIn - ft * 12) * 100) / 100;
  if (ft === 0) return `${inches}"`;
  return inches === 0 ? `${ft}'` : `${ft}' ${inches}"`;
}

export function formatArea(m2: number, system: UnitSystem): string {
  if (system === 'metric') return `${(Math.round(m2 * 10) / 10).toFixed(1)} m²`;
  return `${Math.round(m2 / (FT * FT))} ft²`;
}

export const radToDeg = (r: number) => (r * 180) / Math.PI;
export const degToRad = (d: number) => (d * Math.PI) / 180;

export function formatAngle(rad: number): string {
  const d = Math.round(radToDeg(rad) * 10) / 10;
  return `${Number.isInteger(d) ? d : d.toFixed(1)}°`;
}

export function formatValue(value: number, kind: ValueKind, system: UnitSystem): string {
  switch (kind) {
    case 'length':
      return formatLength(value, system);
    case 'angle':
      return formatAngle(value);
    case 'percent':
      return `${Math.round(value * 100)}%`;
    case 'area':
      return formatArea(value, system);
    default:
      return String(Math.round(value * 1000) / 1000);
  }
}

export function editableValue(value: number, kind: ValueKind, system: UnitSystem): string {
  switch (kind) {
    case 'length':
      return editableLength(value, system);
    case 'angle':
      return String(Math.round(radToDeg(value) * 100) / 100);
    case 'percent':
      return String(Math.round(value * 1000) / 10);
    default:
      return String(Math.round(value * 1000) / 1000);
  }
}

/** Base nudge step for arrow keys, in base units. */
export function baseStep(kind: ValueKind, system: UnitSystem): number {
  switch (kind) {
    case 'length':
      return system === 'metric' ? 0.01 : IN;
    case 'angle':
      return Math.PI / 180;
    case 'percent':
      return 0.01;
    default:
      return 1;
  }
}

/** Parse "4x3", "4 × 3", "4*3" style room sizes into [w, l] meters. */
export function parseDimensions(text: string, system: UnitSystem): [number, number] | null {
  const parts = text.split(/\s*[x×X]\s*/);
  if (parts.length !== 2) return null;
  const a = parseValue(parts[0]!, 'length', system);
  const b = parseValue(parts[1]!, 'length', system);
  if (a === null || b === null || a <= 0 || b <= 0) return null;
  return [a, b];
}
