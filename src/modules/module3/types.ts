import type { RotationPlane } from '../../math';

export type ShapeKind = 'tesseract' | 'fiveCell';

export const FAMILIAR_PLANES: RotationPlane[] = ['XY', 'XZ', 'YZ'];
export const ALIEN_PLANES: RotationPlane[] = ['XW', 'YW', 'ZW'];
export const ALL_PLANES: RotationPlane[] = [...FAMILIAR_PLANES, ...ALIEN_PLANES];
