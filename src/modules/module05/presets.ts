import type { Polytope2D, Vec2 } from '../../math';
import type { PresetKind } from './types';

function regularPolygon(n: number, radius: number = 1): Polytope2D {
  const vertices: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    vertices.push([radius * Math.cos(t), radius * Math.sin(t)]);
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n]);
  return { vertices, edges };
}

export const PRESETS: Record<PresetKind, Polytope2D> = {
  triangle: regularPolygon(3),
  square: regularPolygon(4),
  pentagon: regularPolygon(5),
  hexagon: regularPolygon(6),
};

export const PRESET_LABEL: Record<PresetKind, string> = {
  triangle: 'Triangle',
  square: 'Square',
  pentagon: 'Pentagon',
  hexagon: 'Hexagon',
};
