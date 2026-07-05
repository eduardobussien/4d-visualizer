import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sphereCrossSectionRadius } from '../../math';
import type { ShapeKind } from './types';

export interface GodsEyeView {
  setShape(kind: ShapeKind): void;
  setSlicePosition(y: number): void;
  dispose(): void;
}

/**
 * The "god's eye" 3D view: shows the full shape, the slicing plane, and the
 * cross-section curve where they meet. The user can orbit the camera to see
 * the relationship from any angle.
 *
 * Slicing is along the Y axis (vertical), so the plane is horizontal -
 * intuitively "a sheet at altitude y that the shape sits halfway through".
 */
export function createGodsEyeView(container: HTMLElement): GodsEyeView {
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
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.75);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);

  const axes = new THREE.AxesHelper(1.6);
  scene.add(axes);

  // Horizontal slicing plane (normal +Y), positioned at y = currentY.
  const planeGeom = new THREE.PlaneGeometry(3, 3);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x8ab4f8,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeom, planeMat);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  const curveMat = new THREE.LineBasicMaterial({ color: 0xff7eb6 });
  let curveLine: THREE.Line | null = null;

  let shapeGroup: THREE.Group | null = null;
  let currentShape: ShapeKind = 'sphere';
  let currentY = 0;

  function clearCurve(): void {
    if (!curveLine) return;
    scene.remove(curveLine);
    curveLine.geometry.dispose();
    curveLine = null;
  }

  function rebuildShape(kind: ShapeKind): void {
    if (shapeGroup) {
      scene.remove(shapeGroup);
      shapeGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
    }
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: 0x6dd3a8,
      transparent: true,
      opacity: 0.32,
      metalness: 0.05,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const geometry =
      kind === 'sphere'
        ? new THREE.SphereGeometry(1, 48, 32)
        : new THREE.BoxGeometry(2, 2, 2);
    group.add(new THREE.Mesh(geometry, material));

    if (kind === 'cube') {
      const edges = new THREE.EdgesGeometry(geometry);
      group.add(
        new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x6dd3a8 }),
        ),
      );
    }
    shapeGroup = group;
    scene.add(group);
  }

  function rebuildCurve(): void {
    clearCurve();
    const y = currentY;
    const pts: THREE.Vector3[] = [];

    if (currentShape === 'sphere') {
      const r = sphereCrossSectionRadius(1, y);
      if (r <= 0) return;
      const segs = 96;
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(t), y, r * Math.sin(t)));
      }
    } else {
      if (y <= -1 || y >= 1) return;
      pts.push(
        new THREE.Vector3(-1, y, -1),
        new THREE.Vector3( 1, y, -1),
        new THREE.Vector3( 1, y,  1),
        new THREE.Vector3(-1, y,  1),
        new THREE.Vector3(-1, y, -1),
      );
    }
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

  rebuildShape('sphere');
  rebuildCurve();
  tick();

  return {
    setShape(kind) {
      currentShape = kind;
      rebuildShape(kind);
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
