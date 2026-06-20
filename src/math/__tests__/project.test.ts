import { describe, expect, it } from 'vitest';
import { project4Dto3D } from '../project';

describe('project4Dto3D', () => {
  it('w=0 vertex just scales by 1/d', () => {
    const [out] = project4Dto3D([[2, 4, 6, 0]], 2);
    expect(out).toEqual([1, 2, 3]);
  });

  it('larger w means closer to the 4D camera, so projects larger', () => {
    const [far, near] = project4Dto3D(
      [
        [1, 0, 0, 0],
        [1, 0, 0, 1],
      ],
      3,
    );
    expect(far[0]).toBeCloseTo(1 / 3);
    expect(near[0]).toBeCloseTo(1 / 2);
    expect(near[0]).toBeGreaterThan(far[0]);
  });
});
