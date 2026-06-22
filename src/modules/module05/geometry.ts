import type { Polytope, Vec2 } from '../../math';

/** Order a set of 2D points around their centroid (works for convex polygons). */
export function orderConvexPolygon(points: Vec2[]): Vec2[] {
  if (points.length < 3) return [...points];
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [...points].sort(
    (a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx),
  );
}

/** Deduplicate points to a tolerance — useful when cross-sections double up. */
export function dedupePoints(points: number[][], eps: number = 1e-6): number[][] {
  const out: number[][] = [];
  for (const p of points) {
    if (out.some((q) => q.every((v, i) => Math.abs(v - p[i]) < eps))) continue;
    out.push(p);
  }
  return out;
}

/** Centroid of a polytope's vertex set. */
export function centroid(poly: Polytope): number[] {
  if (poly.vertices.length === 0) return [];
  const dim = poly.vertices[0].length;
  const c = new Array(dim).fill(0);
  for (const v of poly.vertices) for (let i = 0; i < dim; i++) c[i] += v[i] / poly.vertices.length;
  return c;
}
