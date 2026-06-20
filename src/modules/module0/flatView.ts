import { sphereCrossSectionRadius } from '../../math';
import type { ShapeKind } from './types';

export interface FlatView {
  setShape(kind: ShapeKind): void;
  setSlicePosition(y: number): void;
  dispose(): void;
}

/**
 * What a 2D being living in the slicing plane would actually see: the
 * cross-section, rendered as a flat 2D figure. No depth cues, no extra
 * dimension to look "around".
 */
export function createFlatView(container: HTMLElement): FlatView {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  let size = 0;
  let currentShape: ShapeKind = 'sphere';
  let currentY = 0;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

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

  function drawEmpty(): void {
    if (!ctx) return;
    ctx.fillStyle = '#5a6068';
    ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('(plane outside the shape)', size / 2, size / 2);
  }

  function draw(): void {
    if (!ctx || size === 0) return;
    drawAxes();
    const cx = size / 2;
    const cy = size / 2;
    const unit = size / 3.5;

    ctx.fillStyle = 'rgba(255, 126, 182, 0.18)';
    ctx.strokeStyle = '#ff7eb6';
    ctx.lineWidth = 2;

    if (currentShape === 'sphere') {
      const r = sphereCrossSectionRadius(1, currentY);
      if (r <= 0) {
        drawEmpty();
        return;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r * unit, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      if (currentY <= -1 || currentY >= 1) {
        drawEmpty();
        return;
      }
      ctx.beginPath();
      ctx.rect(cx - unit, cy - unit, 2 * unit, 2 * unit);
      ctx.fill();
      ctx.stroke();
    }
  }

  window.addEventListener('resize', resize);
  resize();

  return {
    setShape(kind) {
      currentShape = kind;
      draw();
    },
    setSlicePosition(y) {
      currentY = y;
      draw();
    },
    dispose() {
      window.removeEventListener('resize', resize);
      if (canvas.parentElement === container) container.removeChild(canvas);
    },
  };
}
