import type { Polytope } from './types';

/**
 * Extrude a shape from dimension n to dimension n+1.
 * Every vertex is duplicated — one copy at new-axis = 0, another at new-axis = height.
 * Corresponding vertices are connected, giving:
 *   square (4v, 4e) -> cube (8v, 12e)
 *   cube   (8v, 12e) -> tesseract (16v, 32e)
 *
 * Dimension-agnostic on purpose — the same operation that raises a square to a
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
 * Like extrude, the same function works at any dimension — that's the point.
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
