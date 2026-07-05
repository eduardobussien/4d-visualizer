import type { RotationPlane, Vec4 } from './types';

const PLANE_AXES: Record<RotationPlane, [number, number]> = {
  XY: [0, 1],
  XZ: [0, 2],
  YZ: [1, 2],
  XW: [0, 3],
  YW: [1, 3],
  ZW: [2, 3],
};

/**
 * Rotate a set of 4D vertices in one of the 6 coordinate planes.
 * In 4D you rotate in a plane, not around an axis - XY/XZ/YZ behave like
 * familiar 3D rotation (W is untouched); XW/YW/ZW are the uniquely-4D ones.
 */
export function rotate4D(vertices: Vec4[], plane: RotationPlane, angle: number): Vec4[] {
  const [a, b] = PLANE_AXES[plane];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return vertices.map((v) => {
    const out: Vec4 = [v[0], v[1], v[2], v[3]];
    out[a] = cos * v[a] - sin * v[b];
    out[b] = sin * v[a] + cos * v[b];
    return out;
  });
}
