export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export type RotationPlane = 'XY' | 'XZ' | 'YZ' | 'XW' | 'YW' | 'ZW';

/**
 * A polytope: a set of vertices in some dimension, with edges as index pairs.
 * Dimension-agnostic — used for everything from a 2D polygon to a 4D polytope.
 */
export interface Polytope<V extends number[] = number[]> {
  vertices: V[];
  edges: [number, number][];
}

export type Polytope2D = Polytope<Vec2>;
export type Polytope3D = Polytope<Vec3>;
export type Polytope4D = Polytope<Vec4>;
