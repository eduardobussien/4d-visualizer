import type { Polytope4D, Vec3 } from './types';

/**
 * Intersect a 4D polytope with the hyperplane w = k.
 * For each edge, check whether it crosses the hyperplane; if so, linearly
 * interpolate to find the intersection point in 3D (w is dropped — it equals k).
 *
 * This is the operation that lets a 3D being "see" a 4D shape, the same way
 * a 2D being sees a 3D sphere passing through their plane as a growing /
 * shrinking circle.
 */
export function crossSection(shape: Polytope4D, k: number): Vec3[] {
  const points: Vec3[] = [];
  for (const [i, j] of shape.edges) {
    const a = shape.vertices[i];
    const b = shape.vertices[j];
    const da = a[3] - k;
    const db = b[3] - k;

    if (da === 0 && db === 0) {
      points.push([a[0], a[1], a[2]]);
      points.push([b[0], b[1], b[2]]);
      continue;
    }
    if (da * db > 0) continue;

    const t = da / (da - db);
    points.push([
      a[0] + t * (b[0] - a[0]),
      a[1] + t * (b[1] - a[1]),
      a[2] + t * (b[2] - a[2]),
    ]);
  }
  return points;
}

/**
 * Analytic cross-section radius of a hypersphere of radius R sliced at w = k.
 * Returns 0 when |k| >= R.
 */
export function hypersphereCrossSectionRadius(R: number, k: number): number {
  const sq = R * R - k * k;
  return sq <= 0 ? 0 : Math.sqrt(sq);
}
