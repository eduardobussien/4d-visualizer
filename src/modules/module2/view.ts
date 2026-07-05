import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  FIVE_CELL,
  project4Dto3D,
  rotate4D,
  TESSERACT,
  type Polytope4D,
} from '../../math';
import type { ShapeKind } from './types';

const SHAPES: Record<ShapeKind, Polytope4D> = {
  tesseract: TESSERACT,
  fiveCell: FIVE_CELL,
};

export interface Module2View {
  setShape(kind: ShapeKind): void;
  setCameraDistance(d: number): void;
  setRotationSpeed(speed: number): void;
  dispose(): void;
}

/**
 * 4D -> 3D perspective projection, animated. The classic "cube-in-a-cube"
 * tesseract emerges automatically from x' = x / (d - w) on each vertex,
 * applied every frame after an XW rotation.
 *
 * Edges are colored by their endpoint's rotated W value - warm pink for
 * near-in-4D, cool blue for far. That keeps the dimension we just collapsed
 * visible as a hue, so the projection feels like a shadow that "remembers"
 * the depth it lost rather than an arbitrary diagram.
 */
export function createModule2View(container: HTMLElement): Module2View {
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

  // Vertex-color line material so each end of each segment carries its own hue.
  const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true });
  const vertexMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    sizeAttenuation: true,
  });

  let edgeGeom = new THREE.BufferGeometry();
  let vertexGeom = new THREE.BufferGeometry();
  let edgeLines = new THREE.LineSegments(edgeGeom, edgeMat);
  let vertexPoints = new THREE.Points(vertexGeom, vertexMat);
  scene.add(edgeLines);
  scene.add(vertexPoints);

  let currentShape: ShapeKind = 'tesseract';
  let cameraDistance = 3;
  let rotationAngle = 0;
  let rotationSpeed = 0.3;

  // Cool blue (low w) -> warm pink (high w).
  const COLOR_COOL = new THREE.Color(0x8ab4f8);
  const COLOR_WARM = new THREE.Color(0xff7eb6);
  // After XW rotation, rotated_w = w*cos - x*sin, so |w'| can reach ~sqrt(2)
  // for the tesseract. Use that as the color-mapping range.
  const W_RANGE = Math.SQRT2;

  function colorForW(w: number, out: THREE.Color): void {
    const t = Math.max(0, Math.min(1, (w + W_RANGE) / (2 * W_RANGE)));
    out.copy(COLOR_COOL).lerp(COLOR_WARM, t);
  }

  function rebuildBuffers(): void {
    const shape = SHAPES[currentShape];
    const edgeCount = shape.edges.length;
    const vertCount = shape.vertices.length;

    edgeGeom.dispose();
    vertexGeom.dispose();
    edgeGeom = new THREE.BufferGeometry();
    vertexGeom = new THREE.BufferGeometry();
    edgeGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeCount * 6), 3));
    edgeGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(edgeCount * 6), 3));
    vertexGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertCount * 3), 3));
    vertexGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(vertCount * 3), 3));

    edgeLines.geometry = edgeGeom;
    vertexPoints.geometry = vertexGeom;
  }

  const tmpColor = new THREE.Color();

  function updateProjection(): void {
    const shape = SHAPES[currentShape];
    const rotated = rotate4D(shape.vertices, 'XW', rotationAngle);
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
    if (rotationSpeed > 0) {
      rotationAngle = (rotationAngle + rotationSpeed * dt) % (Math.PI * 2);
      updateProjection();
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
      rotationAngle = 0;
      rebuildBuffers();
      updateProjection();
    },
    setCameraDistance(d) {
      cameraDistance = d;
      updateProjection();
    },
    setRotationSpeed(speed) {
      rotationSpeed = speed;
      if (speed === 0) updateProjection();
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
