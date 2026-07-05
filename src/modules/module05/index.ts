import { cone, extrude, type Polytope, type Polytope2D } from '../../math';
import { createNative2DView } from './native2dView';
import { createRaised3DView } from './raised3dView';
import { createRaised4DView } from './raised4dView';
import { PRESETS, PRESET_LABEL } from './presets';
import type { Operation, PresetKind } from './types';

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Module 0.5 - Build Your Own</h1>
      <p>
        Pick a 2D shape. Raise it through the dimensions. The same operation
        that turns your flat polygon into a 3D solid takes that 3D solid into a
        4D one - there's nothing categorically new about the second step.
      </p>
    </header>

    <div class="views views-3col">
      <section class="view-panel">
        <h2>Your shape (2D)</h2>
        <div class="view-canvas" id="m05-native"></div>
        <p class="caption muted" id="m05-native-caption">-</p>
      </section>
      <section class="view-panel">
        <h2>Raised to 3D</h2>
        <div class="view-canvas" id="m05-raised3d"></div>
        <p class="caption" id="m05-raised3d-caption">-</p>
      </section>
      <section class="view-panel">
        <h2>Raised to 4D - sliced into 3D</h2>
        <div class="view-canvas" id="m05-raised4d"></div>
        <p class="caption" id="m05-raised4d-caption">-</p>
      </section>
    </div>

    <footer class="controls">
      <div class="control-row">
        <label>Shape</label>
        <div class="shape-buttons" id="m05-presets"></div>
      </div>
      <div class="control-row">
        <label>Operation</label>
        <div class="shape-buttons">
          <button data-op="extrude" class="active">Extrude</button>
          <button data-op="cone">Cone</button>
        </div>
      </div>
      <div class="control-row">
        <label for="m05-slice3d">3D slice (y)</label>
        <input type="range" id="m05-slice3d" min="-0.1" max="1.1" step="0.01" value="0.5" />
        <span id="m05-slice3d-value" class="value">y = 0.50</span>
      </div>
      <div class="control-row">
        <label for="m05-slice4d">4D slice (w)</label>
        <input type="range" id="m05-slice4d" min="-0.1" max="1.1" step="0.01" value="0.5" />
        <span id="m05-slice4d-value" class="value">w = 0.50</span>
      </div>
    </footer>
  </div>
`;

function buildPresetButtons(container: HTMLElement, active: PresetKind): void {
  container.innerHTML = '';
  (Object.keys(PRESETS) as PresetKind[]).forEach((kind) => {
    const btn = document.createElement('button');
    btn.dataset.preset = kind;
    btn.textContent = PRESET_LABEL[kind];
    if (kind === active) btn.classList.add('active');
    container.appendChild(btn);
  });
}

function raise(shape: Polytope2D, op: Operation): { raised3D: Polytope; raised4D: Polytope } {
  if (op === 'extrude') {
    const r3 = extrude(shape);
    return { raised3D: r3, raised4D: extrude(r3) };
  }
  const r3 = cone(shape);
  return { raised3D: r3, raised4D: cone(r3) };
}

export function mountModule05(root: HTMLElement): () => void {
  root.innerHTML = TEMPLATE;

  const presetsRow = root.querySelector('#m05-presets') as HTMLElement;
  const opButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-op]'));
  const slice3D = root.querySelector('#m05-slice3d') as HTMLInputElement;
  const slice4D = root.querySelector('#m05-slice4d') as HTMLInputElement;
  const slice3DValue = root.querySelector('#m05-slice3d-value') as HTMLElement;
  const slice4DValue = root.querySelector('#m05-slice4d-value') as HTMLElement;
  const nativeCaption = root.querySelector('#m05-native-caption') as HTMLElement;
  const raised3DCaption = root.querySelector('#m05-raised3d-caption') as HTMLElement;
  const raised4DCaption = root.querySelector('#m05-raised4d-caption') as HTMLElement;

  const native = createNative2DView(root.querySelector('#m05-native') as HTMLElement);
  const raised3D = createRaised3DView(root.querySelector('#m05-raised3d') as HTMLElement);
  const raised4D = createRaised4DView(root.querySelector('#m05-raised4d') as HTMLElement);

  let currentPreset: PresetKind = 'square';
  let currentOp: Operation = 'extrude';
  let currentY = 0.5;
  let currentW = 0.5;

  buildPresetButtons(presetsRow, currentPreset);

  function shapeName(kind: PresetKind, op: Operation, dim: 3 | 4): string {
    // Just descriptive names - accurate where it's obvious.
    if (op === 'extrude') {
      if (kind === 'square' && dim === 3) return 'cube';
      if (kind === 'square' && dim === 4) return 'tesseract';
      if (kind === 'triangle' && dim === 3) return 'triangular prism';
      return `${PRESET_LABEL[kind].toLowerCase()} extruded ${dim - 2}x`;
    }
    if (kind === 'triangle' && dim === 3) return 'tetrahedron';
    if (kind === 'triangle' && dim === 4) return '5-cell (4-simplex)';
    if (kind === 'square' && dim === 3) return 'square pyramid';
    return `${PRESET_LABEL[kind].toLowerCase()} coned ${dim - 2}x`;
  }

  function syncAll(): void {
    const shape2D = PRESETS[currentPreset];
    const { raised3D: r3, raised4D: r4 } = raise(shape2D, currentOp);
    native.setShape(shape2D);
    raised3D.setShape(r3);
    raised3D.setSlicePosition(currentY);
    raised4D.setShape(r4);
    raised4D.setSlicePosition(currentW);

    nativeCaption.textContent = `${PRESET_LABEL[currentPreset]} - ${shape2D.vertices.length} vertices`;
    raised3DCaption.textContent = `${shapeName(currentPreset, currentOp, 3)} - ${r3.vertices.length}v, ${r3.edges.length}e`;
    raised4DCaption.textContent = `${shapeName(currentPreset, currentOp, 4)} sliced at w=${currentW.toFixed(2)} - ${r4.vertices.length}v, ${r4.edges.length}e in 4D`;
    slice3DValue.textContent = `y = ${currentY.toFixed(2)}`;
    slice4DValue.textContent = `w = ${currentW.toFixed(2)}`;
  }

  presetsRow.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button[data-preset]') as HTMLButtonElement | null;
    if (!btn) return;
    const kind = btn.dataset.preset as PresetKind;
    if (kind === currentPreset) return;
    currentPreset = kind;
    presetsRow.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    syncAll();
  });

  opButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const op = btn.dataset.op as Operation;
      if (op === currentOp) return;
      currentOp = op;
      opButtons.forEach((b) => b.classList.toggle('active', b === btn));
      syncAll();
    });
  });

  slice3D.addEventListener('input', () => {
    currentY = parseFloat(slice3D.value);
    raised3D.setSlicePosition(currentY);
    slice3DValue.textContent = `y = ${currentY.toFixed(2)}`;
  });

  slice4D.addEventListener('input', () => {
    currentW = parseFloat(slice4D.value);
    raised4D.setSlicePosition(currentW);
    slice4DValue.textContent = `w = ${currentW.toFixed(2)}`;
    const r4 = raise(PRESETS[currentPreset], currentOp).raised4D;
    raised4DCaption.textContent = `${shapeName(currentPreset, currentOp, 4)} sliced at w=${currentW.toFixed(2)} - ${r4.vertices.length}v, ${r4.edges.length}e in 4D`;
  });

  syncAll();

  return () => {
    native.dispose();
    raised3D.dispose();
    raised4D.dispose();
    root.innerHTML = '';
  };
}
