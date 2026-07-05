import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import {
  crossSection,
  dedupePoints,
  FIVE_CELL,
  project4Dto3D,
  rotate4D,
  SIXTEEN_CELL,
  sphereCrossSectionRadius,
  TESSERACT,
  type Polytope4D,
  type RotationPlane,
} from '../../math';
import { ALL_PLANES, type Mode, type ShapeKind } from './types';

const POLYTOPES: Record<Exclude<ShapeKind, 'hypersphere'>, Polytope4D> = {
  tesseract: TESSERACT,
  fiveCell: FIVE_CELL,
  sixteenCell: SIXTEEN_CELL,
};

export type PlaneAngles = Record<RotationPlane, number>;
export type PlaneSpeeds = Record<RotationPlane, number>;

export interface Module4View {
  setShape(kind: ShapeKind): void;
  setMode(mode: Mode): void;
  setCameraDistance(d: number): void;
  setSlicePosition(w: number): void;
  setSpeed(plane: RotationPlane, speed: number): void;
  resetAngles(): void;
  onAnglesChange(handler: (angles: PlaneAngles) => void): void;
  dispose(): void;
}

const zeroAngles = (): PlaneAngles => ({ XY: 0, XZ: 0, YZ: 0, XW: 0, YW: 0, ZW: 0 });

/**
 * The consolidation view: same polytope, either rendered as its 3D cross-section
 * at w=k (Module 1 style) or as its 4D->3D perspective projection (Module 2/3
 * style). All six rotation planes accumulate independently. Toggle mode, shape,
 * slice, camera distance, and the six speeds - everything at once.
 */
export function createModule4View(container: HTMLElement): Module4View {
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

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(3, 5, 4);
  scene.add(key);
  scene.add(new THREE.AxesHelper(1.4));

  // Projection group - reused Module 2/3 pattern: vertex-colored buffers.
  const projGroup = new THREE.Group();
  const projEdgeMat = new THREE.LineBasicMaterial({ vertexColors: true });
  const projVertMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    sizeAttenuation: true,
  });
  let projEdgeGeom = new THREE.BufferGeometry();
  let projVertGeom = new THREE.BufferGeometry();
  const projEdges = new THREE.LineSegments(projEdgeGeom, projEdgeMat);
  const projVerts = new THREE.Points(projVertGeom, projVertMat);
  projGroup.add(projEdges);
  projGroup.add(projVerts);
  scene.add(projGroup);

  // Cross-section group - rebuilt each frame (small vertex counts, fine).
  const csGroup = new THREE.Group();
  scene.add(csGroup);
  const csSolidMat = new THREE.MeshStandardMaterial({
    color: 0xff7eb6,
    transparent: true,
    opacity: 0.28,
    metalness: 0.05,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const csEdgeMat = new THREE.LineBasicMaterial({ color: 0xff7eb6 });

  const COLOR_COOL = new THREE.Color(0x8ab4f8);
  const COLOR_WARM = new THREE.Color(0xff7eb6);
  const W_RANGE = Math.SQRT2;

  function colorForW(w: number, out: THREE.Color): void {
    const t = Math.max(0, Math.min(1, (w + W_RANGE) / (2 * W_RANGE)));
    out.copy(COLOR_COOL).lerp(COLOR_WARM, t);
  }

  let currentShape: ShapeKind = 'tesseract';
  let currentMode: Mode = 'projection';
  let cameraDistance = 3;
  let currentW = 0;
  const angles: PlaneAngles = zeroAngles();
  const speeds: PlaneSpeeds = zeroAngles();
  let anglesListener: ((a: PlaneAngles) => void) | null = null;

  function rebuildProjectionBuffers(): void {
    if (currentShape === 'hypersphere') return;
    const shape = POLYTOPES[currentShape];
    projEdgeGeom.dispose();
    projVertGeom.dispose();
    projEdgeGeom = new THREE.BufferGeometry();
    projVertGeom = new THREE.BufferGeometry();
    projEdgeGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(shape.edges.length * 6), 3),
    );
    projEdgeGeom.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(shape.edges.length * 6), 3),
    );
    projVertGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(shape.vertices.length * 3), 3),
    );
    projVertGeom.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(shape.vertices.length * 3), 3),
    );
    projEdges.geometry = projEdgeGeom;
    projVerts.geometry = projVertGeom;
  }

  function clearCrossSection(): void {
    while (csGroup.children.length > 0) {
      const c = csGroup.children[0];
      csGroup.remove(c);
      if (c instanceof THREE.Mesh || c instanceof THREE.LineSegments || c instanceof THREE.Line) {
        c.geometry.dispose();
      }
    }
  }

  const tmpColor = new THREE.Color();

  function rotatedVertices(shape: Polytope4D): number[][] {
    let out: number[][] = shape.vertices;
    for (const plane of ALL_PLANES) {
      if (angles[plane] !== 0) out = rotate4D(out as any, plane, angles[plane]);
    }
    return out;
  }

  function updateProjection(): void {
    if (currentShape === 'hypersphere') return;
    const shape = POLYTOPES[currentShape];
    const rotated = rotatedVertices(shape);
    const projected = project4Dto3D(rotated as any, cameraDistance);

    const edgePos = projEdgeGeom.attributes.position.array as Float32Array;
    const edgeCol = projEdgeGeom.attributes.color.array as Float32Array;
    for (let i = 0; i < shape.edges.length; i++) {
      const [ia, ib] = shape.edges[i];
      const pa = projected[ia];
      const pb = projected[ib];
      edgePos[i * 6 + 0] = pa[0]; edgePos[i * 6 + 1] = pa[1]; edgePos[i * 6 + 2] = pa[2];
      edgePos[i * 6 + 3] = pb[0]; edgePos[i * 6 + 4] = pb[1]; edgePos[i * 6 + 5] = pb[2];
      colorForW(rotated[ia][3], tmpColor);
      edgeCol[i * 6 + 0] = tmpColor.r; edgeCol[i * 6 + 1] = tmpColor.g; edgeCol[i * 6 + 2] = tmpColor.b;
      colorForW(rotated[ib][3], tmpColor);
      edgeCol[i * 6 + 3] = tmpColor.r; edgeCol[i * 6 + 4] = tmpColor.g; edgeCol[i * 6 + 5] = tmpColor.b;
    }
    projEdgeGeom.attributes.position.needsUpdate = true;
    projEdgeGeom.attributes.color.needsUpdate = true;
    projEdgeGeom.computeBoundingSphere();

    const vp = projVertGeom.attributes.position.array as Float32Array;
    const vc = projVertGeom.attributes.color.array as Float32Array;
    for (let i = 0; i < projected.length; i++) {
      vp[i * 3 + 0] = projected[i][0]; vp[i * 3 + 1] = projected[i][1]; vp[i * 3 + 2] = projected[i][2];
      colorForW(rotated[i][3], tmpColor);
      vc[i * 3 + 0] = tmpColor.r; vc[i * 3 + 1] = tmpColor.g; vc[i * 3 + 2] = tmpColor.b;
    }
    projVertGeom.attributes.position.needsUpdate = true;
    projVertGeom.attributes.color.needsUpdate = true;
  }

  function updateCrossSection(): void {
    clearCrossSection();
    if (currentShape === 'hypersphere') {
      const r = sphereCrossSectionRadius(1, currentW);
      if (r <= 0) return;
      const sphereGeom = new THREE.SphereGeometry(r, 48, 32);
      csGroup.add(new THREE.Mesh(sphereGeom, csSolidMat));
      const wire = new THREE.SphereGeometry(r, 16, 10);
      csGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(wire, 1), csEdgeMat));
      wire.dispose();
      return;
    }
    const shape = POLYTOPES[currentShape];
    const rotated = rotatedVertices(shape);
    const shapeRot = { vertices: rotated, edges: shape.edges };
    const raw = crossSection(shapeRot as any, currentW) as number[][];
    const points = dedupePoints(raw);
    if (points.length < 4) return;
    const vectors = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    try {
      const solid = new ConvexGeometry(vectors);
      csGroup.add(new THREE.Mesh(solid, csSolidMat));
      csGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(solid, 1), csEdgeMat));
    } catch {
      // degenerate - skip
    }
  }

  function updateVisibility(): void {
    projGroup.visible = currentMode === 'projection' && currentShape !== 'hypersphere';
    csGroup.visible = currentMode === 'crossSection';
  }

  function updateAll(): void {
    if (currentMode === 'projection') updateProjection();
    else updateCrossSection();
    updateVisibility();
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
    if (anyMoving && currentShape !== 'hypersphere') {
      updateAll();
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

  rebuildProjectionBuffers();
  updateAll();
  tick();

  return {
    setShape(kind) {
      if (kind === currentShape) return;
      currentShape = kind;
      for (const p of ALL_PLANES) angles[p] = 0;
      if (kind !== 'hypersphere') rebuildProjectionBuffers();
      updateAll();
      anglesListener?.(angles);
    },
    setMode(mode) {
      currentMode = mode;
      updateAll();
    },
    setCameraDistance(d) {
      cameraDistance = d;
      if (currentMode === 'projection') updateProjection();
    },
    setSlicePosition(w) {
      currentW = w;
      if (currentMode === 'crossSection') updateCrossSection();
    },
    setSpeed(plane, speed) {
      speeds[plane] = speed;
    },
    resetAngles() {
      for (const p of ALL_PLANES) angles[p] = 0;
      updateAll();
      anglesListener?.(angles);
    },
    onAnglesChange(handler) {
      anglesListener = handler;
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      projEdgeGeom.dispose();
      projVertGeom.dispose();
      clearCrossSection();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
