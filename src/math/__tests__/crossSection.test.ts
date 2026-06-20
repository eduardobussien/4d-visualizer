import { describe, expect, it } from 'vitest';
import { crossSection, sphereCrossSectionRadius } from '../crossSection';
import { CUBE, TESSERACT } from '../shapes';

describe('crossSection', () => {
  it('tesseract sliced outside w in [-1, 1] gives no crossings', () => {
    expect(crossSection(TESSERACT, 2).length).toBe(0);
    expect(crossSection(TESSERACT, -2).length).toBe(0);
  });

  it('tesseract sliced at w=0 produces one intersection per W-aligned edge', () => {
    // 8 of the tesseract's 32 edges run along the W axis; each contributes one point.
    const pts = crossSection(TESSERACT, 0);
    expect(pts.length).toBe(8);
    // every point should lie on a unit cube (its (x,y,z) is +/-1, +/-1, +/-1)
    for (const p of pts) {
      expect(Math.abs(p[0])).toBeCloseTo(1);
      expect(Math.abs(p[1])).toBeCloseTo(1);
      expect(Math.abs(p[2])).toBeCloseTo(1);
    }
  });
});

describe('crossSection — 3D cube (Module 0)', () => {
  it('cube sliced at z=0 gives 4 points forming a unit square in 2D', () => {
    const pts = crossSection(CUBE, 0);
    expect(pts.length).toBe(4);
    for (const p of pts) {
      expect(p.length).toBe(2);
      expect(Math.abs(p[0])).toBeCloseTo(1);
      expect(Math.abs(p[1])).toBeCloseTo(1);
    }
  });

  it('cube sliced outside z in [-1, 1] gives no crossings', () => {
    expect(crossSection(CUBE, 1.5).length).toBe(0);
    expect(crossSection(CUBE, -1.5).length).toBe(0);
  });
});

describe('sphereCrossSectionRadius', () => {
  it('peaks at k=0 with radius R', () => {
    expect(sphereCrossSectionRadius(1, 0)).toBeCloseTo(1);
  });

  it('matches sqrt(R^2 - w^2)', () => {
    expect(sphereCrossSectionRadius(1, 0.5)).toBeCloseTo(Math.sqrt(0.75));
    expect(sphereCrossSectionRadius(2, 1)).toBeCloseTo(Math.sqrt(3));
  });

  it('is zero outside |w| >= R', () => {
    expect(sphereCrossSectionRadius(1, 1)).toBe(0);
    expect(sphereCrossSectionRadius(1, 2)).toBe(0);
  });
});
