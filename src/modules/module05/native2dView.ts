import type { Polytope2D } from '../../math';

export interface Native2DView {
  setShape(shape: Polytope2D): void;
  dispose(): void;
}

/** Renders the user's chosen 2D shape — fully visible, "as a 2D being sees it". */
export function createNative2DView(container: HTMLElement): Native2DView {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  let size = 0;
  let currentShape: Polytope2D | null = null;

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

  function draw(): void {
    if (!ctx || size === 0) return;
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

    if (!currentShape) return;
    const unit = size / 3;
    const cx = size / 2;
    const cy = size / 2;

    ctx.fillStyle = 'rgba(138, 180, 248, 0.18)';
    ctx.strokeStyle = '#8ab4f8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    currentShape.vertices.forEach(([vx, vy], i) => {
      const x = cx + vx * unit;
      const y = cy - vy * unit;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8ab4f8';
    for (const [vx, vy] of currentShape.vertices) {
      ctx.beginPath();
      ctx.arc(cx + vx * unit, cy - vy * unit, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  window.addEventListener('resize', resize);
  resize();

  return {
    setShape(shape) {
      currentShape = shape;
      draw();
    },
    dispose() {
      window.removeEventListener('resize', resize);
      if (canvas.parentElement === container) container.removeChild(canvas);
    },
  };
}
