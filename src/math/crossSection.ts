import type { Polytope, Polytope3D, Polytope4D, Vec2, Vec3 } from './types';

/**
 * Intersect a polytope with the hyperplane (last-axis) = k.
 * For each edge, check whether it crosses the hyperplane; if so, linearly
 * interpolate to find the intersection point in (dim-1).
 *
 * Same operation at any dimension: slices a 3D shape with a 2D plane, or a
 * 4D shape with a 3D hyperplane. That's the Module 0 / Module 1 parallel.
 */
export function crossSection(shape: Polytope4D, k: number): Vec3[];
export function crossSection(shape: Polytope3D, k: number): Vec2[];
export function crossSection<V extends number[]>(shape: Polytope<V>, k: number): number[][];
export function crossSection(shape: Polytope, k: number): number[][] {
  const points: number[][] = [];
  for (const [i, j] of shape.edges) {
    const a = shape.vertices[i];
    const b = shape.vertices[j];
    const last = a.length - 1;
    const da = a[last] - k;
    const db = b[last] - k;

    if (da === 0 && db === 0) {
      points.push(a.slice(0, last));
      points.push(b.slice(0, last));
      continue;
    }
    if (da * db > 0) continue;

    const t = da / (da - db);
    const point: number[] = [];
    for (let d = 0; d < last; d++) point.push(a[d] + t * (b[d] - a[d]));
    points.push(point);
  }
  return points;
}

/**
 * Cross-section radius of an N-sphere of radius R sliced at distance k from center.
 * Formula r(k) = sqrt(R^2 - k^2) is the same for 2-sphere, 3-sphere, etc.
 * Returns 0 outside |k| >= R.
 */
export function sphereCrossSectionRadius(R: number, k: number): number {
  const sq = R * R - k * k;
  return sq <= 0 ? 0 : Math.sqrt(sq);
}
