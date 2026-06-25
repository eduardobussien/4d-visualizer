import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  FIVE_CELL,
  project4Dto3D,
  rotate4D,
  TESSERACT,
  type Polytope4D,
  type RotationPlane,
} from '../../math';
import { ALL_PLANES, type ShapeKind } from './types';

const SHAPES: Record<ShapeKind, Polytope4D> = {
  tesseract: TESSERACT,
  fiveCell: FIVE_CELL,
};

export type PlaneAngles = Record<RotationPlane, number>;
export type PlaneSpeeds = Record<RotationPlane, number>;

export interface Module3View {
  setShape(kind: ShapeKind): void;
  setCameraDistance(d: number): void;
  setSpeed(plane: RotationPlane, speed: number): void;
  resetAngles(): void;
  onAnglesChange(handler: (angles: PlaneAngles) => void): void;
  dispose(): void;
}

const ZERO_ANGLES = (): PlaneAngles => ({ XY: 0, XZ: 0, YZ: 0, XW: 0, YW: 0, ZW: 0 });

/**
 * Same projection canvas as Module 2, but every one of the 6 independent 4D
 * rotation planes can be turning at its own speed. The point is comparison:
 * XY/XZ/YZ leave W untouched, so they look identical to ordinary 3D rotation;
 * XW/YW/ZW change which W each vertex has, so the projection (hue + shape)
 * morphs in a way that has no 3D analog. Watching one of each running
 * side-by-side is where the "in 4D you rotate in a plane, not around an axis"
 * lesson lands.
 */
export function createModule3View(container: HTMLElement): Module3View {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090c);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.set(3.5, 2.6, 4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  scene.add(new THREE.AxesHelper(1.2));

  const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true });
  const vertexMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    sizeAttenuation: true,
  });

  let edgeGeom = new THREE.BufferGeometry();
  let vertexGeom = new THREE.BufferGeometry();
  const edgeLines = new THREE.LineSegments(edgeGeom, edgeMat);
  const vertexPoints = new THREE.Points(vertexGeom, vertexMat);
  scene.add(edgeLines);
  scene.add(vertexPoints);

  let currentShape: ShapeKind = 'tesseract';
  let cameraDistance = 3;
  const angles: PlaneAngles = ZERO_ANGLES();
  const speeds: PlaneSpeeds = ZERO_ANGLES();
  let anglesListener: ((angles: PlaneAngles) => void) | null = null;

  const COLOR_COOL = new THREE.Color(0x8ab4f8);
  const COLOR_WARM = new THREE.Color(0xff7eb6);
  const W_RANGE = Math.SQRT2;

  function colorForW(w: number, out: THREE.Color): void {
    const t = Math.max(0, Math.min(1, (w + W_RANGE) / (2 * W_RANGE)));
    out.copy(COLOR_COOL).lerp(COLOR_WARM, t);
  }

  function rebuildBuffers(): void {
    const shape = SHAPES[currentShape];
    edgeGeom.dispose();
    vertexGeom.dispose();
    edgeGeom = new THREE.BufferGeometry();
    vertexGeom = new THREE.BufferGeometry();
    edgeGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(shape.edges.length * 6), 3),
    );
    edgeGeom.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(shape.edges.length * 6), 3),
    );
    vertexGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(shape.vertices.length * 3), 3),
    );
    vertexGeom.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(shape.vertices.length * 3), 3),
    );
    edgeLines.geometry = edgeGeom;
    vertexPoints.geometry = vertexGeom;
  }

  const tmpColor = new THREE.Color();

  function updateProjection(): void {
    const shape = SHAPES[currentShape];
    let rotated = shape.vertices;
    for (const plane of ALL_PLANES) {
      if (angles[plane] !== 0) rotated = rotate4D(rotated, plane, angles[plane]);
    }
    const projected = project4Dto3D(rotated, cameraDistance);

    const edgePos = edgeGeom.attributes.position.array as Float32Array;
    const edgeCol = edgeGeom.attributes.color.array as Float32Array;

    for (let i = 0; i < shape.edges.length; i++) {
      const [ia, ib] = shape.edges[i];
      const pa = projected[ia];
      const pb = projected[ib];
      edgePos[i * 6 + 0] = pa[0];
      edgePos[i * 6 + 1] = pa[1];
      edgePos[i * 6 + 2] = pa[2];
      edgePos[i * 6 + 3] = pb[0];
      edgePos[i * 6 + 4] = pb[1];
      edgePos[i * 6 + 5] = pb[2];
      colorForW(rotated[ia][3], tmpColor);
      edgeCol[i * 6 + 0] = tmpColor.r;
      edgeCol[i * 6 + 1] = tmpColor.g;
      edgeCol[i * 6 + 2] = tmpColor.b;
      colorForW(rotated[ib][3], tmpColor);
      edgeCol[i * 6 + 3] = tmpColor.r;
      edgeCol[i * 6 + 4] = tmpColor.g;
      edgeCol[i * 6 + 5] = tmpColor.b;
    }
    edgeGeom.attributes.position.needsUpdate = true;
    edgeGeom.attributes.color.needsUpdate = true;
    edgeGeom.computeBoundingSphere();

    const vertPos = vertexGeom.attributes.position.array as Float32Array;
    const vertCol = vertexGeom.attributes.color.array as Float32Array;
    for (let i = 0; i < projected.length; i++) {
      vertPos[i * 3 + 0] = projected[i][0];
      vertPos[i * 3 + 1] = projected[i][1];
      vertPos[i * 3 + 2] = projected[i][2];
      colorForW(rotated[i][3], tmpColor);
      vertCol[i * 3 + 0] = tmpColor.r;
      vertCol[i * 3 + 1] = tmpColor.g;
      vertCol[i * 3 + 2] = tmpColor.b;
    }
    vertexGeom.attributes.position.needsUpdate = true;
    vertexGeom.attributes.color.needsUpdate = true;
  }

  let disposed = false;
  let lastT = performance.now();
  function tick(now: number = performance.now()): void {
    if (disposed) return;
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;

    let anyMoving = false;
    for (const plane of ALL_PLANES) {
      if (speeds[plane] > 0) {
        angles[plane] = (angles[plane] + speeds[plane] * dt) % (Math.PI * 2);
        anyMoving = true;
      }
    }
    if (anyMoving) {
      updateProjection();
      anglesListener?.(angles);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  function handleResize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', handleResize);

  rebuildBuffers();
  updateProjection();
  tick();

  return {
    setShape(kind) {
      if (kind === currentShape) return;
      currentShape = kind;
      for (const p of ALL_PLANES) angles[p] = 0;
      rebuildBuffers();
      updateProjection();
      anglesListener?.(angles);
    },
    setCameraDistance(d) {
      cameraDistance = d;
      updateProjection();
    },
    setSpeed(plane, speed) {
      speeds[plane] = speed;
    },
    resetAngles() {
      for (const p of ALL_PLANES) angles[p] = 0;
      updateProjection();
      anglesListener?.(angles);
    },
    onAnglesChange(handler) {
      anglesListener = handler;
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      edgeGeom.dispose();
      vertexGeom.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
