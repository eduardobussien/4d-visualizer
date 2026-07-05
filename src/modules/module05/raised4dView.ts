import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { crossSection, type Polytope } from '../../math';
import { dedupePoints } from './geometry';

export interface Raised4DView {
  setShape(raised4D: Polytope): void;
  setSlicePosition(w: number): void;
  dispose(): void;
}

/**
 * Renders the 4D-raised shape as a 3D cross-section at w = currentW.
 * This is the "best a 3D being can see" - directly previewing how Module 1
 * will reveal the tesseract, but applied to whatever shape the user built.
 *
 * Math (x, y, z) at w = currentW maps straight to display (x, y, z).
 */
export function createRaised4DView(container: HTMLElement): Raised4DView {
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
  camera.position.set(2.8, 2.4, 3.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(3, 5, 4);
  scene.add(key);
  scene.add(new THREE.AxesHelper(1.4));

  const solidMat = new THREE.MeshStandardMaterial({
    color: 0xff7eb6,
    transparent: true,
    opacity: 0.3,
    metalness: 0.05,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xff7eb6 });
  const pointMat = new THREE.PointsMaterial({ color: 0xff7eb6, size: 0.08 });

  let sliceGroup: THREE.Group | null = null;
  let currentRaised4D: Polytope | null = null;
  let currentW = 0;

  function clearSlice(): void {
    if (!sliceGroup) return;
    scene.remove(sliceGroup);
    sliceGroup.traverse((child) => {
      if (
        child instanceof THREE.Mesh ||
        child instanceof THREE.Line ||
        child instanceof THREE.LineSegments ||
        child instanceof THREE.Points
      ) {
        child.geometry.dispose();
      }
    });
    sliceGroup = null;
  }

  function rebuildSlice(): void {
    clearSlice();
    if (!currentRaised4D) return;
    const raw = crossSection(currentRaised4D, currentW) as number[][];
    const points3D = dedupePoints(raw);
    if (points3D.length === 0) return;

    const group = new THREE.Group();
    const vectors = points3D.map(([x, y, z]) => new THREE.Vector3(x, y, z));

    if (vectors.length >= 4) {
      try {
        const solid = new ConvexGeometry(vectors);
        group.add(new THREE.Mesh(solid, solidMat));
        const wire = new THREE.EdgesGeometry(solid, 1);
        group.add(new THREE.LineSegments(wire, edgeMat));
      } catch {
        const ptsGeom = new THREE.BufferGeometry().setFromPoints(vectors);
        group.add(new THREE.Points(ptsGeom, pointMat));
      }
    } else {
      const ptsGeom = new THREE.BufferGeometry().setFromPoints(vectors);
      group.add(new THREE.Points(ptsGeom, pointMat));
    }

    sliceGroup = group;
    scene.add(group);
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
    setShape(raised4D) {
      currentRaised4D = raised4D;
      rebuildSlice();
    },
    setSlicePosition(w) {
      currentW = w;
      rebuildSlice();
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
