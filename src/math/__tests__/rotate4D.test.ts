import { describe, expect, it } from 'vitest';
import { rotate4D } from '../rotate4D';
import type { Vec4 } from '../types';

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;
const closeVec = (a: Vec4, b: Vec4, eps = 1e-9) =>
  a.every((v, i) => close(v, b[i], eps));

describe('rotate4D', () => {
  it('rotation by 0 is identity', () => {
    const v: Vec4[] = [[1, 2, 3, 4]];
    expect(rotate4D(v, 'XY', 0)).toEqual(v);
  });

  it('90deg XY rotation sends (1,0,0,0) to (0,1,0,0)', () => {
    const [out] = rotate4D([[1, 0, 0, 0]], 'XY', Math.PI / 2);
    expect(closeVec(out, [0, 1, 0, 0])).toBe(true);
  });

  it('XY rotation leaves Z and W unchanged', () => {
    const [out] = rotate4D([[1, 0, 7, 9]], 'XY', 1.234);
    expect(close(out[2], 7)).toBe(true);
    expect(close(out[3], 9)).toBe(true);
  });

  it('XW rotation leaves Y and Z unchanged', () => {
    const [out] = rotate4D([[1, 5, 6, 0]], 'XW', 0.7);
    expect(close(out[1], 5)).toBe(true);
    expect(close(out[2], 6)).toBe(true);
  });

  it('two 45deg rotations equal one 90deg rotation', () => {
    const start: Vec4[] = [[1, 0, 0, 0]];
    const once = rotate4D(start, 'XW', Math.PI / 2);
    const twice = rotate4D(rotate4D(start, 'XW', Math.PI / 4), 'XW', Math.PI / 4);
    expect(closeVec(once[0], twice[0])).toBe(true);
  });

  it('preserves vector length', () => {
    const v: Vec4 = [1, 2, 3, 4];
    const lenSq = v.reduce((s, x) => s + x * x, 0);
    const [out] = rotate4D([v], 'YW', 1.7);
    const outLenSq = out.reduce((s, x) => s + x * x, 0);
    expect(close(lenSq, outLenSq, 1e-9)).toBe(true);
  });
});
