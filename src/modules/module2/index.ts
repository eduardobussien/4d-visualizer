import { createModule2View } from './view';
import type { ShapeKind } from './types';

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Projection Mode</h1>
      <p>
        Instead of slicing, flatten the whole 4D shape into 3D, the way a
        photo flattens our 3D world into 2D. Picture a 4D camera sitting out
        along the W axis, a distance d from the shape's center. Parts of the
        shape farther from that camera look smaller, just like far objects in
        a photo: <code>x' = x / (d &minus; w)</code>. That is where the famous
        cube-inside-a-cube picture of the tesseract comes from: the big outer
        cube is its near face in W, the small inner cube its far face. Color shows the W
        value the flattening threw away: pink is near the camera, blue is far.
      </p>
    </header>

    <div class="views views-single">
      <section class="view-panel">
        <h2>4D &rarr; 3D projection</h2>
        <div class="view-canvas" id="m2-view"></div>
        <p class="caption muted">drag to orbit the camera &middot; shift+drag to rotate the shape in 4D</p>
      </section>
    </div>

    <footer class="controls">
      <div class="control-row">
        <label>Shape</label>
        <div class="shape-buttons">
          <button data-shape="tesseract" class="active">Tesseract</button>
          <button data-shape="fiveCell">5-cell</button>
        </div>
      </div>
      <div class="control-row">
        <label for="m2-distance">4D camera distance (d)</label>
        <input type="range" id="m2-distance" min="2.3" max="6" step="0.05" value="3" />
        <span id="m2-distance-value" class="value">d = 3.00</span>
      </div>
      <div class="control-row">
        <label for="m2-rot">4D spin (XW plane)</label>
        <input type="range" id="m2-rot" min="0" max="1.2" step="0.01" value="0.3" />
        <span id="m2-rot-value" class="value">0.30 rad/s</span>
      </div>
    </footer>
  </div>
`;

export function mountModule2(root: HTMLElement): () => void {
  root.innerHTML = TEMPLATE;

  const viewContainer = root.querySelector('#m2-view') as HTMLElement;
  const distance = root.querySelector('#m2-distance') as HTMLInputElement;
  const distanceValue = root.querySelector('#m2-distance-value') as HTMLElement;
  const rot = root.querySelector('#m2-rot') as HTMLInputElement;
  const rotValue = root.querySelector('#m2-rot-value') as HTMLElement;
  const shapeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-shape]'));

  const view = createModule2View(viewContainer);

  distance.addEventListener('input', () => {
    const d = parseFloat(distance.value);
    distanceValue.textContent = `d = ${d.toFixed(2)}`;
    view.setCameraDistance(d);
  });

  rot.addEventListener('input', () => {
    const speed = parseFloat(rot.value);
    rotValue.textContent = `${speed.toFixed(2)} rad/s`;
    view.setRotationSpeed(speed);
  });

  shapeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.shape as ShapeKind;
      shapeButtons.forEach((b) => b.classList.toggle('active', b === btn));
      view.setShape(kind);
    });
  });

  view.setCameraDistance(parseFloat(distance.value));
  view.setRotationSpeed(parseFloat(rot.value));

  return () => {
    view.dispose();
    root.innerHTML = '';
  };
}
