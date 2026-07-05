import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { crossSection, type Polytope } from '../../math';
import { dedupePoints, orderConvexPolygon } from './geometry';

export interface Raised3DView {
  setShape(raised3D: Polytope): void;
  setSlicePosition(y: number): void;
  dispose(): void;
}

/**
 * Renders the 2D shape raised to 3D - same role as Module 0's god's-eye
 * view but for whatever shape the user built. The slicing plane and the
 * cross-section curve let a 2D being's view (what they'd see in the slice)
 * stay grounded in the 3D structure.
 *
 * Convention: math (x, y) -> display (x, z), math z (the raised axis) -> display y.
 * So the original 2D shape lies flat at y=0 and the extrusion/cone direction is up.
 */
export function createRaised3DView(container: HTMLElement): Raised3DView {
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
  camera.position.set(3.5, 2.8, 4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.75);
  key.position.set(3, 5, 4);
  scene.add(key);
  scene.add(new THREE.AxesHelper(1.6));

  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x8ab4f8,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), planeMat);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  const curveMat = new THREE.LineBasicMaterial({ color: 0xff7eb6 });
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x6dd3a8,
    transparent: true,
    opacity: 0.28,
    metalness: 0.05,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x6dd3a8 });

  let shapeGroup: THREE.Group | null = null;
  let curveLine: THREE.Line | null = null;
  let currentRaised3D: Polytope | null = null;
  let currentY = 0;

  function disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
      }
    });
  }

  /** Math (x, y, z) -> display (x, z, y). */
  function toDisplay(v: number[]): THREE.Vector3 {
    return new THREE.Vector3(v[0], v[2], v[1]);
  }

  function rebuildShape(): void {
    if (shapeGroup) {
      scene.remove(shapeGroup);
      disposeObject(shapeGroup);
      shapeGroup = null;
    }
    if (!currentRaised3D || currentRaised3D.vertices.length < 4) return;
    const group = new THREE.Group();

    const points = currentRaised3D.vertices.map(toDisplay);
    try {
      const solidGeom = new ConvexGeometry(points);
      group.add(new THREE.Mesh(solidGeom, solidMat));
    } catch {
      // degenerate (coplanar) - skip the solid, the wireframe is still informative
    }

    const positions: number[] = [];
    for (const [i, j] of currentRaised3D.edges) {
      const a = toDisplay(currentRaised3D.vertices[i]);
      const b = toDisplay(currentRaised3D.vertices[j]);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const wireGeom = new THREE.BufferGeometry();
    wireGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    group.add(new THREE.LineSegments(wireGeom, edgeMat));

    shapeGroup = group;
    scene.add(group);
  }

  function rebuildCurve(): void {
    if (curveLine) {
      scene.remove(curveLine);
      curveLine.geometry.dispose();
      curveLine = null;
    }
    if (!currentRaised3D) return;
    const raw = crossSection(currentRaised3D, currentY) as number[][];
    const points2D = dedupePoints(raw).map((p) => [p[0], p[1]] as [number, number]);
    if (points2D.length < 2) return;
    const ordered = orderConvexPolygon(points2D);
    const pts = ordered.map(([px, py]) => new THREE.Vector3(px, currentY, py));
    pts.push(pts[0]);
    curveLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), curveMat);
    scene.add(curveLine);
  }

  let disposed = false;
  function tick(): void {
    if (disposed) return;
    requestAnimationFrame(tick);
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
  tick();

  return {
    setShape(raised3D) {
      currentRaised3D = raised3D;
      rebuildShape();
      rebuildCurve();
    },
    setSlicePosition(y) {
      currentY = y;
      plane.position.y = y;
      rebuildCurve();
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
