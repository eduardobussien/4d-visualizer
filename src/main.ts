import {
  SQUARE,
  TRIANGLE,
  TESSERACT,
  extrude,
  cone,
  crossSection,
  hypersphereCrossSectionRadius,
  project4Dto3D,
  rotate4D,
} from './math';

// Quick sanity-check log so the browser console shows the math layer works.
const cube = extrude(SQUARE);
const tesseract = extrude(cube);
const tetrahedron = cone(TRIANGLE);
const fiveCell = cone(tetrahedron);

console.log('[math] square -> cube:', cube.vertices.length, 'verts,', cube.edges.length, 'edges (expect 8, 12)');
console.log('[math] cube -> tesseract:', tesseract.vertices.length, 'verts,', tesseract.edges.length, 'edges (expect 16, 32)');
console.log('[math] triangle -> tetrahedron:', tetrahedron.vertices.length, 'verts,', tetrahedron.edges.length, 'edges (expect 4, 6)');
console.log('[math] tetrahedron -> 5-cell:', fiveCell.vertices.length, 'verts,', fiveCell.edges.length, 'edges (expect 5, 10)');

const slice = crossSection(TESSERACT, 0);
console.log('[math] tesseract sliced at w=0:', slice.length, 'edge-crossings');

const projected = project4Dto3D(TESSERACT.vertices, 3);
console.log('[math] tesseract projected with d=3, sample vertex:', projected[0]);

const rotated = rotate4D(TESSERACT.vertices, 'XW', Math.PI / 4);
console.log('[math] tesseract rotated 45deg in XW, sample vertex:', rotated[0]);

console.log('[math] hypersphere R=1 sliced at w=0.5, radius =', hypersphereCrossSectionRadius(1, 0.5));
