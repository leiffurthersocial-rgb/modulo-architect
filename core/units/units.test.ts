import { describe, expect, it } from 'vitest';
import { formatArea, formatLength, parseDimensions, parseValue, editableLength } from './units';

describe('expression parsing', () => {
  it('parses plain numbers in the default unit', () => {
    expect(parseValue('3.2', 'length', 'metric')).toBeCloseTo(3.2);
    expect(parseValue('10', 'length', 'imperial')).toBeCloseTo(3.048);
  });
  it('evaluates arithmetic', () => {
    expect(parseValue('2.5*3', 'length', 'metric')).toBeCloseTo(7.5);
    expect(parseValue('(1+2)/2', 'length', 'metric')).toBeCloseTo(1.5);
    expect(parseValue('-2 + 5', 'length', 'metric')).toBeCloseTo(3);
    expect(parseValue('2,5', 'length', 'metric')).toBeCloseTo(2.5);
  });
  it('understands units and compound values', () => {
    expect(parseValue('320cm', 'length', 'metric')).toBeCloseTo(3.2);
    expect(parseValue('3m + 20cm', 'length', 'metric')).toBeCloseTo(3.2);
    expect(parseValue(`10' 6"`, 'length', 'metric')).toBeCloseTo(3.2004);
    expect(parseValue('2.5ft*3', 'length', 'metric')).toBeCloseTo(2.286);
    expect(parseValue('1m + 50', 'length', 'metric')).toBeCloseTo(51);
  });
  it('rejects garbage and area results', () => {
    expect(parseValue('abc', 'length', 'metric')).toBeNull();
    expect(parseValue('2m*3m', 'length', 'metric')).toBeNull();
    expect(parseValue('1/0', 'length', 'metric')).toBeNull();
    expect(parseValue('', 'length', 'metric')).toBeNull();
    expect(parseValue('2+', 'length', 'metric')).toBeNull();
    expect(parseValue('alert(1)', 'length', 'metric')).toBeNull();
  });
  it('parses angles in degrees', () => {
    expect(parseValue('90', 'angle', 'metric')).toBeCloseTo(Math.PI / 2);
    expect(parseValue('45*2', 'angle', 'metric')).toBeCloseTo(Math.PI / 2);
  });
  it('parses room dimensions', () => {
    expect(parseDimensions('4x3', 'metric')).toEqual([4, 3]);
    expect(parseDimensions('4.5 × 3.2', 'metric')).toEqual([4.5, 3.2]);
    expect(parseDimensions('4', 'metric')).toBeNull();
  });
});

describe('formatting', () => {
  it('formats metric with tabular precision', () => {
    expect(formatLength(3.2, 'metric')).toBe('3.20 m');
    expect(formatLength(0.05, 'metric')).toBe('0.05 m');
  });
  it('formats imperial feet and inches with fractions', () => {
    expect(formatLength(3.2004, 'imperial')).toBe(`10' 6"`);
    expect(formatLength(0.0254 * 6.5, 'imperial')).toBe('6½"');
  });
  it('round-trips editable strings', () => {
    for (const m of [0.1, 2.45, 3.2004, 10]) {
      expect(parseValue(editableLength(m, 'imperial'), 'length', 'imperial')).toBeCloseTo(m, 3);
      expect(parseValue(editableLength(m, 'metric'), 'length', 'metric')).toBeCloseTo(m, 3);
    }
  });
  it('formats areas', () => {
    expect(formatArea(12.34, 'metric')).toBe('12.3 m²');
    expect(formatArea(10, 'imperial')).toBe('108 ft²');
  });
});
