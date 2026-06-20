import { describe, expect, it } from 'vitest';
import { cone, extrude } from '../dimensionRaising';
import { SQUARE, TRIANGLE } from '../shapes';

describe('extrude', () => {
  it('square -> cube (8 vertices, 12 edges)', () => {
    const cube = extrude(SQUARE);
    expect(cube.vertices.length).toBe(8);
    expect(cube.edges.length).toBe(12);
    expect(cube.vertices[0].length).toBe(3);
  });

  it('cube -> tesseract (16 vertices, 32 edges)', () => {
    const tesseract = extrude(extrude(SQUARE));
    expect(tesseract.vertices.length).toBe(16);
    expect(tesseract.edges.length).toBe(32);
    expect(tesseract.vertices[0].length).toBe(4);
  });

  it('new axis takes values 0 and height', () => {
    const cube = extrude(SQUARE, 2);
    const zs = new Set(cube.vertices.map((v) => v[v.length - 1]));
    expect(zs).toEqual(new Set([0, 2]));
  });
});

describe('cone', () => {
  it('triangle -> tetrahedron (4 vertices, 6 edges)', () => {
    const tet = cone(TRIANGLE);
    expect(tet.vertices.length).toBe(4);
    expect(tet.edges.length).toBe(6);
    expect(tet.vertices[0].length).toBe(3);
  });

  it('tetrahedron -> 5-cell (5 vertices, 10 edges)', () => {
    const fiveCell = cone(cone(TRIANGLE));
    expect(fiveCell.vertices.length).toBe(5);
    expect(fiveCell.edges.length).toBe(10);
    expect(fiveCell.vertices[0].length).toBe(4);
  });

  it('apex sits above the centroid on the new axis', () => {
    const tet = cone(TRIANGLE, 3);
    const apex = tet.vertices[tet.vertices.length - 1];
    expect(apex[2]).toBe(3);
    // centroid of the equilateral triangle in shapes.ts is (0, 0)
    expect(apex[0]).toBeCloseTo(0);
    expect(apex[1]).toBeCloseTo(0);
  });
});
