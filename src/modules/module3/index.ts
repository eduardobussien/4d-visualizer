import type { RotationPlane } from '../../math';
import { createModule3View } from './view';
import { ALIEN_PLANES, ALL_PLANES, FAMILIAR_PLANES, type ShapeKind } from './types';

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

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Six Rotation Planes</h1>
      <p>
        In 3D you rotate around an <em>axis</em>. In 4D you rotate in a <em>plane</em>,
        and there are six of them. Three (XY, XZ, YZ) leave the W axis alone -
        the shape just spins like an ordinary 3D object. The other three (XW, YW, ZW)
        change which W each vertex has, so the projected shape morphs in a way that
        has no 3D analog. Turn one of each on at low speed and feel the difference.
      </p>
    </header>

    <div class="views views-single">
      <section class="view-panel">
        <h2>4D &rarr; 3D projection</h2>
        <div class="view-canvas" id="m3-view"></div>
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
        <label for="m3-distance">4D camera distance (d)</label>
        <input type="range" id="m3-distance" min="1.6" max="6" step="0.05" value="3" />
        <span id="m3-distance-value" class="value">d = 3.00</span>
      </div>

      <div class="rot-section">
        <div class="rot-section-header">
          <span class="rot-section-title">Familiar planes</span>
          <span class="rot-section-sub">W untouched - looks like ordinary 3D rotation</span>
        </div>
        ${FAMILIAR_PLANES.map(rotationRow).join('')}
      </div>

      <div class="rot-section">
        <div class="rot-section-header">
          <span class="rot-section-title rot-section-title-alien">Alien planes</span>
          <span class="rot-section-sub">W changes - no 3D analog, the projection morphs</span>
        </div>
        ${ALIEN_PLANES.map(rotationRow).join('')}
      </div>

      <div class="control-row">
        <button class="ghost-button" id="m3-pause">Pause all</button>
        <button class="ghost-button" id="m3-reset">Reset angles</button>
      </div>
    </footer>
  </div>
`;

function degrees(rad: number): string {
  const deg = ((rad * 180) / Math.PI) % 360;
  return `${deg.toFixed(0)}°`;
}

export function mountModule3(root: HTMLElement): () => void {
  root.innerHTML = TEMPLATE;

  const viewContainer = root.querySelector('#m3-view') as HTMLElement;
  const distance = root.querySelector('#m3-distance') as HTMLInputElement;
  const distanceValue = root.querySelector('#m3-distance-value') as HTMLElement;
  const shapeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-shape]'));
  const pauseBtn = root.querySelector('#m3-pause') as HTMLButtonElement;
  const resetBtn = root.querySelector('#m3-reset') as HTMLButtonElement;
  const sliders = Array.from(root.querySelectorAll<HTMLInputElement>('input[data-plane]'));
  const speedSpans = new Map<RotationPlane, HTMLElement>();
  const angleSpans = new Map<RotationPlane, HTMLElement>();
  for (const p of ALL_PLANES) {
    speedSpans.set(p, root.querySelector(`[data-speed="${p}"]`) as HTMLElement);
    angleSpans.set(p, root.querySelector(`[data-angle="${p}"]`) as HTMLElement);
  }

  const view = createModule3View(viewContainer);

  view.onAnglesChange((angles) => {
    for (const p of ALL_PLANES) angleSpans.get(p)!.textContent = degrees(angles[p]);
  });

  distance.addEventListener('input', () => {
    const d = parseFloat(distance.value);
    distanceValue.textContent = `d = ${d.toFixed(2)}`;
    view.setCameraDistance(d);
  });

  sliders.forEach((slider) => {
    const plane = slider.dataset.plane as RotationPlane;
    slider.addEventListener('input', () => {
      const speed = parseFloat(slider.value);
      speedSpans.get(plane)!.textContent = `${speed.toFixed(2)} rad/s`;
      view.setSpeed(plane, speed);
    });
  });

  shapeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.shape as ShapeKind;
      shapeButtons.forEach((b) => b.classList.toggle('active', b === btn));
      view.setShape(kind);
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

  return () => {
    view.dispose();
    root.innerHTML = '';
  };
}
