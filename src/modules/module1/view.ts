import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import {
  crossSection,
  dedupePoints,
  rotate4D,
  sphereCrossSectionRadius,
  TESSERACT,
} from '../../math';
import type { ShapeKind } from './types';

export interface SliceInfo {
  vertexCount: number;
  empty: boolean;
}

export interface Module1View {
  setShape(kind: ShapeKind): void;
  setSlicePosition(w: number): void;
  setRotationSpeed(speed: number): void;
  /** Called whenever the cross-section is recomputed; useful for live captions. */
  onSliceChange(handler: (info: SliceInfo, angle: number) => void): void;
  dispose(): void;
}

/**
 * The heart of the project: a 4D shape passing through your 3D space.
 * You see the 3D cross-section - one slice at a time. For a tesseract,
 * adding 4D rotation (XW plane here) makes the cross-section morph through
 * a sequence of polyhedra; that morphing IS the 4D experience for a 3D being.
 */
export function createModule1View(container: HTMLElement): Module1View {
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
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(3, 5, 4);
  scene.add(key);
  scene.add(new THREE.AxesHelper(1.6));

  const solidMat = new THREE.MeshStandardMaterial({
    color: 0xff7eb6,
    transparent: true,
    opacity: 0.28,
    metalness: 0.05,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xff7eb6 });

  let group: THREE.Group | null = null;
  let currentShape: ShapeKind = 'hypersphere';
  let currentW = 0;
  let rotationAngle = 0;
  let rotationSpeed = 0.3;
  let sliceListener: ((info: SliceInfo, angle: number) => void) | null = null;

  function clearGroup(): void {
    if (!group) return;
    scene.remove(group);
    group.traverse((c) => {
      if (
        c instanceof THREE.Mesh ||
        c instanceof THREE.LineSegments ||
        c instanceof THREE.Line
      ) {
        c.geometry.dispose();
      }
    });
    group = null;
  }

  function rebuild(): void {
    clearGroup();
    let info: SliceInfo = { vertexCount: 0, empty: true };

    if (currentShape === 'hypersphere') {
      const r = sphereCrossSectionRadius(1, currentW);
      if (r > 0) {
        const g = new THREE.Group();
        const sphereGeom = new THREE.SphereGeometry(r, 48, 32);
        g.add(new THREE.Mesh(sphereGeom, solidMat));
        const wireGeom = new THREE.SphereGeometry(r, 16, 10);
        g.add(new THREE.LineSegments(new THREE.EdgesGeometry(wireGeom, 1), edgeMat));
        wireGeom.dispose();
        group = g;
        scene.add(g);
        info = { vertexCount: 0, empty: false };
      }
    } else {
      const rotated = rotate4D(TESSERACT.vertices, 'XW', rotationAngle);
      const shape = { vertices: rotated, edges: TESSERACT.edges };
      const raw = crossSection(shape, currentW) as number[][];
      const points = dedupePoints(raw);

      if (points.length > 0) {
        const g = new THREE.Group();
        const vectors = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
        if (vectors.length >= 4) {
          try {
            const solid = new ConvexGeometry(vectors);
            g.add(new THREE.Mesh(solid, solidMat));
            g.add(new THREE.LineSegments(new THREE.EdgesGeometry(solid, 1), edgeMat));
          } catch {
            // degenerate slice - skip
          }
        }
        group = g;
        scene.add(g);
        info = { vertexCount: points.length, empty: false };
      }
    }

    sliceListener?.(info, rotationAngle);
  }

  let disposed = false;
  let lastT = performance.now();
  function tick(now: number = performance.now()): void {
    if (disposed) return;
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    if (currentShape === 'tesseract' && rotationSpeed > 0) {
      rotationAngle = (rotationAngle + rotationSpeed * dt) % (Math.PI * 2);
      rebuild();
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
  rebuild();
  tick();

  return {
    setShape(kind) {
      currentShape = kind;
      rotationAngle = 0;
      rebuild();
    },
    setSlicePosition(w) {
      currentW = w;
      rebuild();
    },
    setRotationSpeed(speed) {
      rotationSpeed = speed;
    },
    onSliceChange(handler) {
      sliceListener = handler;
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
