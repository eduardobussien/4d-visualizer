import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DRAG_SPEED = 0.006; // radians per pixel

/**
 * Attach shift+drag 4D rotation to a canvas. Horizontal mouse motion rotates
 * in the XW plane; vertical rotates in YW. OrbitControls is temporarily
 * disabled during a drag so it doesn't fight for the pointer. Returns a
 * detach function.
 */
export function attachDragRotate4D(
  domElement: HTMLElement,
  controls: OrbitControls,
  onDelta: (dxwRad: number, dywRad: number) => void,
): () => void {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let capturedPointerId: number | null = null;

  const onPointerDown = (e: PointerEvent): void => {
    if (!e.shiftKey) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    controls.enabled = false;
    capturedPointerId = e.pointerId;
    try {
      domElement.setPointerCapture(e.pointerId);
    } catch { /* older browsers */ }
    e.stopPropagation();
    e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!dragging) return;
    const dx = (e.clientX - lastX) * DRAG_SPEED;
    const dy = (e.clientY - lastY) * DRAG_SPEED;
    lastX = e.clientX;
    lastY = e.clientY;
    onDelta(dx, dy);
    e.stopPropagation();
  };

  const finish = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    controls.enabled = true;
    if (capturedPointerId !== null) {
      try {
        domElement.releasePointerCapture(capturedPointerId);
      } catch { /* older browsers */ }
      capturedPointerId = null;
    }
    e.stopPropagation();
  };

  domElement.addEventListener('pointerdown', onPointerDown, true);
  domElement.addEventListener('pointermove', onPointerMove, true);
  domElement.addEventListener('pointerup', finish, true);
  domElement.addEventListener('pointercancel', finish, true);

  return () => {
    domElement.removeEventListener('pointerdown', onPointerDown, true);
    domElement.removeEventListener('pointermove', onPointerMove, true);
    domElement.removeEventListener('pointerup', finish, true);
    domElement.removeEventListener('pointercancel', finish, true);
    controls.enabled = true;
  };
}
