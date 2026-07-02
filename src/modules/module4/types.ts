import type { RotationPlane } from '../../math';

export type ShapeKind = 'tesseract' | 'fiveCell' | 'sixteenCell' | 'hypersphere';
export type Mode = 'crossSection' | 'projection';

export const FAMILIAR_PLANES: RotationPlane[] = ['XY', 'XZ', 'YZ'];
export const ALIEN_PLANES: RotationPlane[] = ['XW', 'YW', 'ZW'];
export const ALL_PLANES: RotationPlane[] = [...FAMILIAR_PLANES, ...ALIEN_PLANES];

export const SHAPE_LABEL: Record<ShapeKind, string> = {
  tesseract: 'Tesseract',
  fiveCell: '5-cell',
  sixteenCell: '16-cell',
  hypersphere: 'Hypersphere',
};
