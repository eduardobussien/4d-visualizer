import { sphereCrossSectionRadius } from '../../math';
import { createModule1View } from './view';
import type { ShapeKind } from './types';

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Tesseract Cross-Sections</h1>
      <p>
        Same trick as Flatland, one dimension up. A 4D shape meets our 3D
        space, and all a 3D being can ever see is the 3D slice where they
        overlap. The W slider moves the slice along the fourth axis. A
        hypersphere's slice is a ball that grows from a point, peaks, then
        shrinks back, just like a sphere through Flatland. A tesseract (a 4D
        cube) slowly tilting in 4D gives slices that keep changing shape: a
        cube, stretched boxes, pointed tetrahedra near a corner, and stranger
        many-faced solids in between.
      </p>
    </header>

    <div class="views views-single">
      <section class="view-panel">
        <h2>3D cross-section</h2>
        <div class="view-canvas" id="m1-view"></div>
        <p class="caption" id="m1-caption"></p>
        <p class="caption muted">drag to orbit the camera &middot; shift+drag to rotate the shape in 4D</p>
      </section>
    </div>

    <footer class="controls">
      <div class="control-row">
        <label>Shape</label>
        <div class="shape-buttons">
          <button data-shape="hypersphere">Hypersphere</button>
          <button data-shape="tesseract" class="active">Tesseract</button>
        </div>
      </div>
      <div class="control-row">
        <label for="m1-slice">W slice</label>
        <input type="range" id="m1-slice" min="-2.1" max="2.1" step="0.01" value="0" />
        <span id="m1-slice-value" class="value">w = 0.00</span>
      </div>
      <div class="control-row">
        <label for="m1-rot">4D tilt speed</label>
        <input type="range" id="m1-rot" min="0" max="1.2" step="0.01" value="0.3" />
        <span id="m1-rot-value" class="value">0.30 rad/s</span>
      </div>
    </footer>
  </div>
`;

export function mountModule1(root: HTMLElement): () => void {
  root.innerHTML = TEMPLATE;

  const viewContainer = root.querySelector('#m1-view') as HTMLElement;
  const caption = root.querySelector('#m1-caption') as HTMLElement;
  const slice = root.querySelector('#m1-slice') as HTMLInputElement;
  const sliceValue = root.querySelector('#m1-slice-value') as HTMLElement;
  const rot = root.querySelector('#m1-rot') as HTMLInputElement;
  const rotValue = root.querySelector('#m1-rot-value') as HTMLElement;
  const shapeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-shape]'));

  const view = createModule1View(viewContainer);

  let currentShape: ShapeKind = 'tesseract';
  let currentW = 0;

  function renderCaption(vertexCount: number, empty: boolean): void {
    if (empty) {
      caption.textContent =
        currentShape === 'hypersphere'
          ? 'nothing: the slice is outside the hypersphere'
          : 'nothing: the slice is outside the tesseract';
      return;
    }
    if (currentShape === 'hypersphere') {
      const r = sphereCrossSectionRadius(1, currentW);
      caption.textContent = `sphere, radius ${r.toFixed(3)} (rotation has no visible effect: a hypersphere is 4D-symmetric)`;
    } else {
      caption.textContent = `the slice is a solid with ${vertexCount} corners`;
    }
  }

  view.onSliceChange((info) => {
    renderCaption(info.vertexCount, info.empty);
  });

  slice.addEventListener('input', () => {
    currentW = parseFloat(slice.value);
    sliceValue.textContent = `w = ${currentW.toFixed(2)}`;
    view.setSlicePosition(currentW);
  });

  rot.addEventListener('input', () => {
    const speed = parseFloat(rot.value);
    rotValue.textContent = `${speed.toFixed(2)} rad/s`;
    view.setRotationSpeed(speed);
  });

  shapeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.shape as ShapeKind;
      if (kind === currentShape) return;
      currentShape = kind;
      shapeButtons.forEach((b) => b.classList.toggle('active', b === btn));
      view.setShape(kind);
    });
  });

  view.setRotationSpeed(parseFloat(rot.value));

  return () => {
    view.dispose();
    root.innerHTML = '';
  };
}
