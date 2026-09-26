import type { Polytope } from './types';

/**
 * Extrude a shape from dimension n to dimension n+1.
 * Every vertex is duplicated - one copy at new-axis = 0, another at new-axis = height.
 * Corresponding vertices are connected, giving:
 *   square (4v, 4e) -> cube (8v, 12e)
 *   cube   (8v, 12e) -> tesseract (16v, 32e)
 *
 * Dimension-agnostic on purpose - the same operation that raises a square to a
 * cube also raises a cube to a tesseract. That's the Module 0.5 lesson.
 */
export function extrude(shape: Polytope, height: number = 1): Polytope {
  const n = shape.vertices.length;
  const bottom = shape.vertices.map((v) => [...v, 0]);
  const top = shape.vertices.map((v) => [...v, height]);
  const vertices = [...bottom, ...top];

  const bottomEdges: [number, number][] = shape.edges.map(([i, j]) => [i, j]);
  const topEdges: [number, number][] = shape.edges.map(([i, j]) => [i + n, j + n]);
  const verticalEdges: [number, number][] = shape.vertices.map((_, i) => [i, i + n]);

  return { vertices, edges: [...bottomEdges, ...topEdges, ...verticalEdges] };
}

/**
 * Cone a shape from dimension n to dimension n+1.
 * Adds a single apex vertex above the centroid (new-axis = apexHeight) and
 * connects every original vertex to it. Gives:
 *   triangle    (3v, 3e) -> tetrahedron (4v, 6e)
 *   tetrahedron (4v, 6e) -> 5-cell      (5v, 10e)
 *
 * Like extrude, the same function works at any dimension - that's the point.
 */
export function cone(shape: Polytope, apexHeight: number = 1): Polytope {
  const n = shape.vertices.length;
  if (n === 0) return { vertices: [], edges: [] };
  const dim = shape.vertices[0].length;

  const original = shape.vertices.map((v) => [...v, 0]);

  const centroid = new Array(dim).fill(0);
  for (const v of shape.vertices) {
    for (let i = 0; i < dim; i++) centroid[i] += v[i] / n;
  }
  const apex = [...centroid, apexHeight];

  const vertices = [...original, apex];
  const originalEdges: [number, number][] = shape.edges.map(([i, j]) => [i, j]);
  const apexEdges: [number, number][] = shape.vertices.map((_, i) => [i, n]);

  return { vertices, edges: [...originalEdges, ...apexEdges] };
}

/** Average edge length. Extruding by this keeps every edge the same length (square -> true cube). */
export function meanEdgeLength(shape: Polytope): number {
  if (shape.edges.length === 0) return 0;
  let total = 0;
  for (const [i, j] of shape.edges) {
    const a = shape.vertices[i];
    const b = shape.vertices[j];
    total += Math.hypot(...a.map((v, d) => v - b[d]));
  }
  return total / shape.edges.length;
}

/**
 * Apex height for `cone` that makes the new edges as long as the base's edges,
 * so equilateral triangle -> regular tetrahedron -> regular 5-cell. When no
 * such height exists (a regular hexagon's corners are as far from its center
 * as its edges are long), falls back to the edge length.
 */
export function equalEdgeApexHeight(shape: Polytope): number {
  const n = shape.vertices.length;
  if (n === 0) return 0;
  const dim = shape.vertices[0].length;
  const c = new Array(dim).fill(0);
  for (const v of shape.vertices) for (let i = 0; i < dim; i++) c[i] += v[i] / n;
  let r = 0;
  for (const v of shape.vertices) r = Math.max(r, Math.hypot(...v.map((x, i) => x - c[i])));
  const l = meanEdgeLength(shape);
  return l > r + 1e-9 ? Math.sqrt(l * l - r * r) : l;
}
