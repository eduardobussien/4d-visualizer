import type { Polytope2D, Vec2 } from '../../math';

export interface Native2DView {
  setShape(shape: Polytope2D): void;
  enterEditMode(): void;
  onCustomShapeCommitted(handler: (shape: Polytope2D) => void): void;
  dispose(): void;
}

const CLOSE_THRESHOLD_PX = 15;
const MIN_VERTICES = 3;

/** Renders the user's chosen 2D shape - fully visible, "as a 2D being sees it". */
export function createNative2DView(container: HTMLElement): Native2DView {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  let size = 0;
  let mode: 'display' | 'edit' = 'display';
  let currentShape: Polytope2D | null = null;
  let editVertices: Vec2[] = [];
  let mousePos: { x: number; y: number } | null = null;
  let commitHandler: ((shape: Polytope2D) => void) | null = null;

  function canvasToMath(px: number, py: number): Vec2 {
    const c = size / 2;
    const unit = size / 3;
    return [(px - c) / unit, -(py - c) / unit];
  }

  function mathToCanvas(v: Vec2): [number, number] {
    const c = size / 2;
    const unit = size / 3;
    return [c + v[0] * unit, c - v[1] * unit];
  }

  function isNearFirstVertex(): boolean {
    if (editVertices.length < MIN_VERTICES || !mousePos) return false;
    const [fx, fy] = mathToCanvas(editVertices[0]);
    const dx = mousePos.x - fx;
    const dy = mousePos.y - fy;
    return dx * dx + dy * dy < CLOSE_THRESHOLD_PX * CLOSE_THRESHOLD_PX;
  }

  function commitPolygon(): void {
    if (editVertices.length < MIN_VERTICES) return;
    const vertices: Vec2[] = editVertices.map((v) => [v[0], v[1]] as Vec2);
    const edges: [number, number][] = vertices.map((_, i) => [i, (i + 1) % vertices.length]);
    const shape: Polytope2D = { vertices, edges };
    mode = 'display';
    currentShape = shape;
    editVertices = [];
    mousePos = null;
    canvas.style.cursor = 'default';
    commitHandler?.(shape);
    draw();
  }

  function resize(): void {
    const rect = container.getBoundingClientRect();
    size = Math.min(rect.width, rect.height);
    const dpr = window.devicePixelRatio;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.scale(dpr, dpr);
    draw();
  }

  function drawAxes(): void {
    if (!ctx) return;
    ctx.fillStyle = '#07090c';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#1d2127';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  }

  function drawDisplayShape(): void {
    if (!ctx || !currentShape) return;
    const unit = size / 3;
    const c = size / 2;

    ctx.fillStyle = 'rgba(138, 180, 248, 0.18)';
    ctx.strokeStyle = '#8ab4f8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    currentShape.vertices.forEach(([vx, vy], i) => {
      const x = c + vx * unit;
      const y = c - vy * unit;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8ab4f8';
    for (const [vx, vy] of currentShape.vertices) {
      ctx.beginPath();
      ctx.arc(c + vx * unit, c - vy * unit, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawEditState(): void {
    if (!ctx) return;
    const hoveringClose = isNearFirstVertex();

    // Hint text
    ctx.fillStyle = '#8a9099';
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let hint = 'Click to add your first vertex';
    if (editVertices.length === 1) hint = 'Add at least two more vertices';
    else if (editVertices.length === 2) hint = 'Add one more vertex';
    else if (editVertices.length >= MIN_VERTICES) {
      hint = hoveringClose
        ? 'Click to close the polygon'
        : 'Click near the first vertex (pink) to close';
    }
    ctx.fillText(hint, size / 2, 8);

    // Edges between placed vertices
    if (editVertices.length >= 2) {
      ctx.strokeStyle = '#8ab4f8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      editVertices.forEach((v, i) => {
        const [px, py] = mathToCanvas(v);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Dashed preview from last vertex to the mouse
    if (editVertices.length >= 1 && mousePos && !hoveringClose) {
      const [lx, ly] = mathToCanvas(editVertices[editVertices.length - 1]);
      ctx.strokeStyle = 'rgba(138, 180, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Preview close line back to first when hovering close
    if (hoveringClose && editVertices.length >= MIN_VERTICES) {
      const [lx, ly] = mathToCanvas(editVertices[editVertices.length - 1]);
      const [fx, fy] = mathToCanvas(editVertices[0]);
      ctx.strokeStyle = '#ff7eb6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Vertex circles - first vertex is pink so users know where to close
    editVertices.forEach((v, i) => {
      const [px, py] = mathToCanvas(v);
      const isFirst = i === 0;
      if (isFirst && hoveringClose) {
        ctx.fillStyle = 'rgba(255, 126, 182, 0.35)';
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = isFirst ? '#ff7eb6' : '#8ab4f8';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw(): void {
    if (!ctx || size === 0) return;
    drawAxes();
    if (mode === 'display') drawDisplayShape();
    else drawEditState();
  }

  function handleClick(e: MouseEvent): void {
    if (mode !== 'edit') return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (isNearFirstVertex()) {
      commitPolygon();
      return;
    }
    editVertices.push(canvasToMath(px, py));
    draw();
  }

  function handleMouseMove(e: MouseEvent): void {
    if (mode !== 'edit') return;
    const rect = canvas.getBoundingClientRect();
    mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    draw();
  }

  function handleMouseLeave(): void {
    if (mode !== 'edit') return;
    mousePos = null;
    draw();
  }

  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('resize', resize);
  resize();

  return {
    setShape(shape) {
      mode = 'display';
      currentShape = shape;
      editVertices = [];
      mousePos = null;
      canvas.style.cursor = 'default';
      draw();
    },
    enterEditMode() {
      mode = 'edit';
      currentShape = null;
      editVertices = [];
      mousePos = null;
      canvas.style.cursor = 'crosshair';
      draw();
    },
    onCustomShapeCommitted(handler) {
      commitHandler = handler;
    },
    dispose() {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resize);
      if (canvas.parentElement === container) container.removeChild(canvas);
    },
  };
}
