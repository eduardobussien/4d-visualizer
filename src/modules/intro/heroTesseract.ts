import * as THREE from 'three';
import { project4Dto3D, rotate4D, TESSERACT } from '../../math';

export interface HeroTesseract {
  dispose(): void;
}

/**
 * Small decorative tesseract for the About page hero. Fixed camera (no
 * OrbitControls), no UI, just a continuous XW+YW tumble with vertex-color
 * W hue - the same visual language as the Projection tab, in miniature.
 */
export function createHeroTesseract(container: HTMLElement): HeroTesseract {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = null; // let the container's background show through

  const camera = new THREE.PerspectiveCamera(
    62,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.set(2.1, 1.5, 2.6);
  camera.lookAt(0, 0, 0);

  const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true });
  const vertMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    sizeAttenuation: true,
  });

  const edgeGeom = new THREE.BufferGeometry();
  edgeGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(TESSERACT.edges.length * 6), 3),
  );
  edgeGeom.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(TESSERACT.edges.length * 6), 3),
  );
  scene.add(new THREE.LineSegments(edgeGeom, edgeMat));

  const vertGeom = new THREE.BufferGeometry();
  vertGeom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(TESSERACT.vertices.length * 3), 3),
  );
  vertGeom.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(TESSERACT.vertices.length * 3), 3),
  );
  scene.add(new THREE.Points(vertGeom, vertMat));

  const COLOR_COOL = new THREE.Color(0x8ab4f8);
  const COLOR_WARM = new THREE.Color(0xff7eb6);
  const W_RANGE = Math.SQRT2;
  const tmp = new THREE.Color();

  const colorForW = (w: number, out: THREE.Color): void => {
    const t = Math.max(0, Math.min(1, (w + W_RANGE) / (2 * W_RANGE)));
    out.copy(COLOR_COOL).lerp(COLOR_WARM, t);
  };

  let angleXW = 0.35;
  let angleYW = 0.1;

  const update = (): void => {
    let rotated = rotate4D(TESSERACT.vertices, 'XW', angleXW);
    rotated = rotate4D(rotated, 'YW', angleYW);
    const projected = project4Dto3D(rotated, 3);

    const ep = edgeGeom.attributes.position.array as Float32Array;
    const ec = edgeGeom.attributes.color.array as Float32Array;
    for (let i = 0; i < TESSERACT.edges.length; i++) {
      const [ia, ib] = TESSERACT.edges[i];
      const pa = projected[ia];
      const pb = projected[ib];
      ep[i * 6] = pa[0]; ep[i * 6 + 1] = pa[1]; ep[i * 6 + 2] = pa[2];
      ep[i * 6 + 3] = pb[0]; ep[i * 6 + 4] = pb[1]; ep[i * 6 + 5] = pb[2];
      colorForW(rotated[ia][3], tmp);
      ec[i * 6] = tmp.r; ec[i * 6 + 1] = tmp.g; ec[i * 6 + 2] = tmp.b;
      colorForW(rotated[ib][3], tmp);
      ec[i * 6 + 3] = tmp.r; ec[i * 6 + 4] = tmp.g; ec[i * 6 + 5] = tmp.b;
    }
    edgeGeom.attributes.position.needsUpdate = true;
    edgeGeom.attributes.color.needsUpdate = true;

    const vp = vertGeom.attributes.position.array as Float32Array;
    const vc = vertGeom.attributes.color.array as Float32Array;
    for (let i = 0; i < projected.length; i++) {
      vp[i * 3] = projected[i][0]; vp[i * 3 + 1] = projected[i][1]; vp[i * 3 + 2] = projected[i][2];
      colorForW(rotated[i][3], tmp);
      vc[i * 3] = tmp.r; vc[i * 3 + 1] = tmp.g; vc[i * 3 + 2] = tmp.b;
    }
    vertGeom.attributes.position.needsUpdate = true;
    vertGeom.attributes.color.needsUpdate = true;
  };

  let disposed = false;
  let last = performance.now();
  const tick = (now: number = performance.now()): void => {
    if (disposed) return;
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    angleXW = (angleXW + 0.28 * dt) % (Math.PI * 2);
    angleYW = (angleYW + 0.18 * dt) % (Math.PI * 2);
    update();
    renderer.render(scene, camera);
  };

  const onResize = (): void => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  update();
  tick();

  return {
    dispose(): void {
      disposed = true;
      window.removeEventListener('resize', onResize);
      edgeGeom.dispose();
      vertGeom.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
