import { sphereCrossSectionRadius } from '../../math';
import { createFlatView } from './flatView';
import { createGodsEyeView } from './godsEyeView';
import type { ShapeKind } from './types';

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Module 0 - Flatland Warmup</h1>
      <p>
        A 3D shape passes through a 2D plane. A flat being living in that plane
        only sees the slice - a circle, a square, growing and shrinking. You see
        the whole story. Same trick, one dimension up, is how a 4D shape will
        eventually reveal itself to you in Module 1.
      </p>
    </header>

    <div class="views">
      <section class="view-panel">
        <h2>What a 2D being sees</h2>
        <div class="view-canvas" id="m0-flat"></div>
        <p class="caption" id="m0-caption">-</p>
      </section>
      <section class="view-panel">
        <h2>God's-eye view (3D)</h2>
        <div class="view-canvas" id="m0-gods-eye"></div>
        <p class="caption muted">drag to rotate the camera</p>
      </section>
    </div>

    <footer class="controls">
      <div class="control-row">
        <label>Shape</label>
        <div class="shape-buttons">
          <button data-shape="sphere" class="active">Sphere</button>
          <button data-shape="cube">Cube</button>
        </div>
      </div>
      <div class="control-row">
        <label for="m0-slider">Slice position</label>
        <input type="range" id="m0-slider" min="-1.4" max="1.4" step="0.01" value="0" />
        <span id="m0-slider-value" class="value">y = 0.00</span>
      </div>
    </footer>
  </div>
`;

export function mountModule0(root: HTMLElement): () => void {
  root.innerHTML = TEMPLATE;

  const godsEyeContainer = root.querySelector('#m0-gods-eye') as HTMLElement;
  const flatContainer = root.querySelector('#m0-flat') as HTMLElement;
  const caption = root.querySelector('#m0-caption') as HTMLElement;
  const slider = root.querySelector('#m0-slider') as HTMLInputElement;
  const sliderValue = root.querySelector('#m0-slider-value') as HTMLElement;
  const shapeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-shape]'));

  const godsEye = createGodsEyeView(godsEyeContainer);
  const flat = createFlatView(flatContainer);

  let currentShape: ShapeKind = 'sphere';
  let currentY = 0;

  function describeSlice(): string {
    if (currentShape === 'sphere') {
      const r = sphereCrossSectionRadius(1, currentY);
      return r <= 0
        ? 'nothing - the plane is outside the sphere'
        : `a circle, radius ${r.toFixed(2)}`;
    }
    if (currentY <= -1 || currentY >= 1) {
      return 'nothing - the plane is outside the cube';
    }
    return 'a square, side 2.00';
  }

  function syncAll(): void {
    sliderValue.textContent = `y = ${currentY.toFixed(2)}`;
    caption.textContent = describeSlice();
    godsEye.setSlicePosition(currentY);
    flat.setSlicePosition(currentY);
  }

  slider.addEventListener('input', () => {
    currentY = parseFloat(slider.value);
    syncAll();
  });

  shapeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.shape as ShapeKind;
      if (kind === currentShape) return;
      currentShape = kind;
      shapeButtons.forEach((b) => b.classList.toggle('active', b === btn));
      godsEye.setShape(kind);
      flat.setShape(kind);
      caption.textContent = describeSlice();
    });
  });

  syncAll();

  return () => {
    godsEye.dispose();
    flat.dispose();
    root.innerHTML = '';
  };
}
