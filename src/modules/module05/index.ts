import { cone, extrude, type Polytope, type Polytope2D } from '../../math';
import { createNative2DView } from './native2dView';
import { createRaised3DView } from './raised3dView';
import { createRaised4DView } from './raised4dView';
import { PRESETS, PRESET_LABEL } from './presets';
import type { Operation, PresetKind } from './types';

type ShapeSource = PresetKind | 'custom';

const TEMPLATE = `
  <div class="module">
    <header class="module-header">
      <h1>Build Your Own</h1>
      <p>
        Pick a 2D shape or draw your own. Raise it through the dimensions. The
        same operation that turns your flat polygon into a 3D solid takes that
        3D solid into a 4D one - there's nothing categorically new about the
        second step.
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

function buildPresetButtons(container: HTMLElement, active: ShapeSource): void {
  container.innerHTML = '';
  (Object.keys(PRESETS) as PresetKind[]).forEach((kind) => {
    const btn = document.createElement('button');
    btn.dataset.preset = kind;
    btn.textContent = PRESET_LABEL[kind];
    if (kind === active) btn.classList.add('active');
    container.appendChild(btn);
  });
  const custom = document.createElement('button');
  custom.dataset.preset = 'custom';
  custom.textContent = 'Custom';
  if (active === 'custom') custom.classList.add('active');
  container.appendChild(custom);
}

function raise(shape: Polytope2D, op: Operation): { raised3D: Polytope; raised4D: Polytope } {
  if (op === 'extrude') {
    const r3 = extrude(shape);
    return { raised3D: r3, raised4D: extrude(r3) };
  }
  const r3 = cone(shape);
  return { raised3D: r3, raised4D: cone(r3) };
}

const EMPTY_POLYTOPE: Polytope = { vertices: [], edges: [] };

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

  let currentSource: ShapeSource = 'square';
  let customShape: Polytope2D | null = null;
  let currentOp: Operation = 'extrude';
  let currentY = 0.5;
  let currentW = 0.5;

  buildPresetButtons(presetsRow, currentSource);

  function shapeName(source: ShapeSource, op: Operation, dim: 3 | 4): string {
    if (source === 'custom') {
      return op === 'extrude'
        ? `your shape extruded ${dim - 2}x`
        : `your shape coned ${dim - 2}x`;
    }
    if (op === 'extrude') {
      if (source === 'square' && dim === 3) return 'cube';
      if (source === 'square' && dim === 4) return 'tesseract';
      if (source === 'triangle' && dim === 3) return 'triangular prism';
      return `${PRESET_LABEL[source].toLowerCase()} extruded ${dim - 2}x`;
    }
    if (source === 'triangle' && dim === 3) return 'tetrahedron';
    if (source === 'triangle' && dim === 4) return '5-cell (4-simplex)';
    if (source === 'square' && dim === 3) return 'square pyramid';
    return `${PRESET_LABEL[source].toLowerCase()} coned ${dim - 2}x`;
  }

  function currentShape2D(): Polytope2D | null {
    if (currentSource === 'custom') return customShape;
    return PRESETS[currentSource];
  }

  function renderCaptions(shape2D: Polytope2D | null, r3: Polytope | null, r4: Polytope | null): void {
    if (!shape2D) {
      nativeCaption.textContent = 'drawing custom shape...';
      raised3DCaption.textContent = 'waiting for shape to close';
      raised4DCaption.textContent = 'waiting for shape to close';
      return;
    }
    const label = currentSource === 'custom' ? 'Custom' : PRESET_LABEL[currentSource];
    nativeCaption.textContent = `${label} - ${shape2D.vertices.length} vertices`;
    if (r3)
      raised3DCaption.textContent = `${shapeName(currentSource, currentOp, 3)} - ${r3.vertices.length}v, ${r3.edges.length}e`;
    if (r4)
      raised4DCaption.textContent = `${shapeName(currentSource, currentOp, 4)} sliced at w=${currentW.toFixed(2)} - ${r4.vertices.length}v, ${r4.edges.length}e in 4D`;
  }

  function syncAll(): void {
    const shape2D = currentShape2D();
    slice3DValue.textContent = `y = ${currentY.toFixed(2)}`;
    slice4DValue.textContent = `w = ${currentW.toFixed(2)}`;

    if (!shape2D) {
      raised3D.setShape(EMPTY_POLYTOPE);
      raised4D.setShape(EMPTY_POLYTOPE);
      renderCaptions(null, null, null);
      return;
    }
    const { raised3D: r3, raised4D: r4 } = raise(shape2D, currentOp);
    if (currentSource !== 'custom') native.setShape(shape2D);
    raised3D.setShape(r3);
    raised3D.setSlicePosition(currentY);
    raised4D.setShape(r4);
    raised4D.setSlicePosition(currentW);
    renderCaptions(shape2D, r3, r4);
  }

  native.onCustomShapeCommitted((shape) => {
    customShape = shape;
    syncAll();
  });

  presetsRow.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button[data-preset]') as HTMLButtonElement | null;
    if (!btn) return;
    const kind = btn.dataset.preset as ShapeSource;
    presetsRow.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));

    if (kind === 'custom') {
      // Clicking Custom always restarts the drawing flow.
      currentSource = 'custom';
      customShape = null;
      native.enterEditMode();
      syncAll();
      return;
    }
    if (kind === currentSource) return;
    currentSource = kind;
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
    const shape2D = currentShape2D();
    if (shape2D) {
      const r4 = raise(shape2D, currentOp).raised4D;
      raised4DCaption.textContent = `${shapeName(currentSource, currentOp, 4)} sliced at w=${currentW.toFixed(2)} - ${r4.vertices.length}v, ${r4.edges.length}e in 4D`;
    }
  });

  syncAll();

  return () => {
    native.dispose();
    raised3D.dispose();
    raised4D.dispose();
    root.innerHTML = '';
  };
}
