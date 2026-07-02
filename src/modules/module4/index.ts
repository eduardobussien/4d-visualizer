import type { RotationPlane } from '../../math';
import { createModule4View } from './view';
import {
  ALIEN_PLANES,
  ALL_PLANES,
  FAMILIAR_PLANES,
  SHAPE_LABEL,
  type Mode,
  type ShapeKind,
} from './types';

function rotationRow(plane: RotationPlane): string {
  return `
    <div class="rot-row">
      <span class="rot-label">${plane}</span>
      <input type="range" data-plane="${plane}" min="0" max="0.9" step="0.01" value="0" />
      <span class="rot-speed" data-speed="${plane}">0.00 rad/s</span>
      <span class="rot-angle" data-angle="${plane}">0&deg;</span>
    </div>
  `;
}

const SHAPES: ShapeKind[] = ['tesseract', 'fiveCell', 'sixteenCell', 'hypersphere'];

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Module 4 &mdash; Playground</h1>
      <p>
        Everything from Modules 0&ndash;3 wired together. Pick any of four 4D
        shapes, flip between cross-section and projection, spin all six rotation
        planes at once. This is where you stop being guided and just play.
      </p>
    </header>

    <div class="views views-single">
      <section class="view-panel">
        <h2>Playground view</h2>
        <div class="view-canvas" id="m4-view"></div>
        <p class="caption muted">drag to orbit the camera</p>
      </section>
    </div>

    <footer class="controls">
      <div class="control-row">
        <label>Shape</label>
        <div class="shape-buttons" id="m4-shapes">
          ${SHAPES.map(
            (s, i) =>
              `<button data-shape="${s}"${i === 0 ? ' class="active"' : ''}>${SHAPE_LABEL[s]}</button>`,
          ).join('')}
        </div>
      </div>
      <div class="control-row">
        <label>Mode</label>
        <div class="shape-buttons" id="m4-modes">
          <button data-mode="projection" class="active">Projection</button>
          <button data-mode="crossSection">Cross-section</button>
        </div>
      </div>
      <div class="control-row" id="m4-distance-row">
        <label for="m4-distance">4D camera distance (d)</label>
        <input type="range" id="m4-distance" min="1.6" max="6" step="0.05" value="3" />
        <span id="m4-distance-value" class="value">d = 3.00</span>
      </div>
      <div class="control-row hidden" id="m4-slice-row">
        <label for="m4-slice">W slice</label>
        <input type="range" id="m4-slice" min="-1.6" max="1.6" step="0.01" value="0" />
        <span id="m4-slice-value" class="value">w = 0.00</span>
      </div>

      <div class="rot-section">
        <div class="rot-section-header">
          <span class="rot-section-title">Familiar planes</span>
          <span class="rot-section-sub">W untouched &mdash; ordinary 3D rotation</span>
        </div>
        ${FAMILIAR_PLANES.map(rotationRow).join('')}
      </div>

      <div class="rot-section">
        <div class="rot-section-header">
          <span class="rot-section-title rot-section-title-alien">Alien planes</span>
          <span class="rot-section-sub">W changes &mdash; unique to 4D</span>
        </div>
        ${ALIEN_PLANES.map(rotationRow).join('')}
      </div>

      <div class="control-row">
        <button class="ghost-button" id="m4-pause">Pause all</button>
        <button class="ghost-button" id="m4-reset">Reset angles</button>
      </div>
    </footer>
  </div>
`;

function degrees(rad: number): string {
  return `${((((rad * 180) / Math.PI) % 360 + 360) % 360).toFixed(0)}°`;
}

export function mountModule4(root: HTMLElement): () => void {
  root.innerHTML = TEMPLATE;

  const viewContainer = root.querySelector('#m4-view') as HTMLElement;
  const shapeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('#m4-shapes button'));
  const modeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('#m4-modes button'));
  const distance = root.querySelector('#m4-distance') as HTMLInputElement;
  const distanceValue = root.querySelector('#m4-distance-value') as HTMLElement;
  const distanceRow = root.querySelector('#m4-distance-row') as HTMLElement;
  const slice = root.querySelector('#m4-slice') as HTMLInputElement;
  const sliceValue = root.querySelector('#m4-slice-value') as HTMLElement;
  const sliceRow = root.querySelector('#m4-slice-row') as HTMLElement;
  const pauseBtn = root.querySelector('#m4-pause') as HTMLButtonElement;
  const resetBtn = root.querySelector('#m4-reset') as HTMLButtonElement;
  const sliders = Array.from(root.querySelectorAll<HTMLInputElement>('input[data-plane]'));
  const speedSpans = new Map<RotationPlane, HTMLElement>();
  const angleSpans = new Map<RotationPlane, HTMLElement>();
  for (const p of ALL_PLANES) {
    speedSpans.set(p, root.querySelector(`[data-speed="${p}"]`) as HTMLElement);
    angleSpans.set(p, root.querySelector(`[data-angle="${p}"]`) as HTMLElement);
  }

  const view = createModule4View(viewContainer);

  let currentShape: ShapeKind = 'tesseract';
  let currentMode: Mode = 'projection';

  view.onAnglesChange((angles) => {
    for (const p of ALL_PLANES) angleSpans.get(p)!.textContent = degrees(angles[p]);
  });

  function updateModeVisibility(): void {
    distanceRow.classList.toggle('hidden', currentMode !== 'projection');
    sliceRow.classList.toggle('hidden', currentMode !== 'crossSection');
  }

  function updateModeAvailability(): void {
    modeButtons.forEach((b) => {
      const m = b.dataset.mode as Mode;
      const disable = currentShape === 'hypersphere' && m === 'projection';
      b.disabled = disable;
      b.classList.toggle('disabled', disable);
    });
  }

  function setMode(mode: Mode): void {
    currentMode = mode;
    modeButtons.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    view.setMode(mode);
    updateModeVisibility();
  }

  shapeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.shape as ShapeKind;
      if (kind === currentShape) return;
      currentShape = kind;
      shapeButtons.forEach((b) => b.classList.toggle('active', b === btn));
      view.setShape(kind);
      updateModeAvailability();
      if (kind === 'hypersphere' && currentMode === 'projection') setMode('crossSection');
    });
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      setMode(btn.dataset.mode as Mode);
    });
  });

  distance.addEventListener('input', () => {
    const d = parseFloat(distance.value);
    distanceValue.textContent = `d = ${d.toFixed(2)}`;
    view.setCameraDistance(d);
  });

  slice.addEventListener('input', () => {
    const w = parseFloat(slice.value);
    sliceValue.textContent = `w = ${w.toFixed(2)}`;
    view.setSlicePosition(w);
  });

  sliders.forEach((s) => {
    const plane = s.dataset.plane as RotationPlane;
    s.addEventListener('input', () => {
      const speed = parseFloat(s.value);
      speedSpans.get(plane)!.textContent = `${speed.toFixed(2)} rad/s`;
      view.setSpeed(plane, speed);
    });
  });

  pauseBtn.addEventListener('click', () => {
    sliders.forEach((s) => {
      s.value = '0';
      const plane = s.dataset.plane as RotationPlane;
      speedSpans.get(plane)!.textContent = '0.00 rad/s';
      view.setSpeed(plane, 0);
    });
  });

  resetBtn.addEventListener('click', () => {
    view.resetAngles();
  });

  view.setCameraDistance(parseFloat(distance.value));
  view.setSlicePosition(parseFloat(slice.value));
  updateModeVisibility();
  updateModeAvailability();

  return () => {
    view.dispose();
    root.innerHTML = '';
  };
}
