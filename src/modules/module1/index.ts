import { sphereCrossSectionRadius } from '../../math';
import { createModule1View } from './view';
import type { ShapeKind } from './types';

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Tesseract Cross-Sections</h1>
      <p>
        A 4D shape passes through your 3D space. You only ever see the slice.
        For a hypersphere it grows from a point, peaks, and shrinks back.
        For a tesseract with 4D rotation, the slice morphs through a sequence
        of polyhedra - that morphing is the 4D experience for a 3D being.
      </p>
    </header>

    <div class="views views-single">
      <section class="view-panel">
        <h2>3D cross-section</h2>
        <div class="view-canvas" id="m1-view"></div>
        <p class="caption" id="m1-caption">-</p>
      </section>
    </div>

    <footer class="controls">
      <div class="control-row">
        <label>Shape</label>
        <div class="shape-buttons">
          <button data-shape="hypersphere" class="active">Hypersphere</button>
          <button data-shape="tesseract">Tesseract</button>
        </div>
      </div>
      <div class="control-row">
        <label for="m1-slice">W slice</label>
        <input type="range" id="m1-slice" min="-1.6" max="1.6" step="0.01" value="0" />
        <span id="m1-slice-value" class="value">w = 0.00</span>
      </div>
      <div class="control-row">
        <label for="m1-rot">XW rotation</label>
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

  let currentShape: ShapeKind = 'hypersphere';
  let currentW = 0;
  let currentAngle = 0;

  function renderCaption(vertexCount: number, empty: boolean): void {
    if (empty) {
      caption.textContent =
        currentShape === 'hypersphere'
          ? 'nothing - the slice is outside the hypersphere'
          : 'nothing - the slice is outside the tesseract';
      return;
    }
    if (currentShape === 'hypersphere') {
      const r = sphereCrossSectionRadius(1, currentW);
      caption.textContent = `sphere, radius ${r.toFixed(3)} (rotation is invisible - a hypersphere is 4D-symmetric)`;
    } else {
      const deg = ((currentAngle * 180) / Math.PI).toFixed(0);
      caption.textContent = `cross-section: ${vertexCount} vertices · XW angle ${deg}°`;
    }
  }

  view.onSliceChange((info, angle) => {
    currentAngle = angle;
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
