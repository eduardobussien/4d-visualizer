import type { Polytope, Polytope2D, Polytope4D } from './types';

/** Unit square centered at origin. */
export const SQUARE: Polytope2D = {
  vertices: [
    [-1, -1],
    [ 1, -1],
    [ 1,  1],
    [-1,  1],
  ],
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ],
};

/** Equilateral triangle centered at origin (approximately). */
export const TRIANGLE: Polytope2D = {
  vertices: [
    [ 0,  1],
    [-Math.sqrt(3) / 2, -0.5],
    [ Math.sqrt(3) / 2, -0.5],
  ],
  edges: [
    [0, 1],
    [1, 2],
    [2, 0],
  ],
};

/** Unit tesseract: vertices at every (+/-1, +/-1, +/-1, +/-1). */
export const TESSERACT: Polytope4D = (() => {
  const vertices: [number, number, number, number][] = [];
  for (let i = 0; i < 16; i++) {
    vertices.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1,
    ]);
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      // edge exactly when vertices differ in a single coordinate
      let diff = 0;
      for (let k = 0; k < 4; k++) if (vertices[i][k] !== vertices[j][k]) diff++;
      if (diff === 1) edges.push([i, j]);
    }
  }
  return { vertices, edges };
})();

/**
 * Helper to cast a generic Polytope (from extrude/cone) into a typed one.
 * Useful when you know the dimension of the result.
 */
export function asPolytope<V extends number[]>(p: Polytope): Polytope<V> {
  return p as Polytope<V>;
}
