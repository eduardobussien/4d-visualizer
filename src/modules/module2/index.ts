import { createModule2View } from './view';
import type { ShapeKind } from './types';

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Projection Mode</h1>
      <p>
        The same 4D shape, but now flattened into 3D as a "shadow" - perspective
        projection: <code>x' = x / (d - w)</code>. Vertices farther in W shrink,
        like distant objects shrink in a photo. The cube-in-a-cube tesseract is
        just this rule applied to a 4D cube, with the inner cube being the side
        farther in W. Hue encodes the W coordinate that the projection threw
        away.
      </p>
    </header>

    <div class="views views-single">
      <section class="view-panel">
        <h2>4D &rarr; 3D projection</h2>
        <div class="view-canvas" id="m2-view"></div>
        <p class="caption muted">drag to orbit the camera</p>
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
        <input type="range" id="m2-distance" min="1.6" max="6" step="0.05" value="3" />
        <span id="m2-distance-value" class="value">d = 3.00</span>
      </div>
      <div class="control-row">
        <label for="m2-rot">XW rotation</label>
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
