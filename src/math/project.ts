import type { Vec3, Vec4 } from './types';

/**
 * Perspective projection from 4D into 3D.
 * Divides each coordinate by (d - w), the "4D camera distance" minus the
 * vertex's W. Vertices farther in W shrink - the same way a cube's farther
 * face shrinks in a 2D photo. Produces the classic "cube-in-a-cube" tesseract.
 *
 * d must be strictly greater than every vertex's w; otherwise the projection
 * passes through a singularity.
 */
export function project4Dto3D(vertices: Vec4[], d: number): Vec3[] {
  return vertices.map(([x, y, z, w]) => {
    const denom = d - w;
    return [x / denom, y / denom, z / denom];
  });
}
