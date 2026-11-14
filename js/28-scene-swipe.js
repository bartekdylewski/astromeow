'use strict';

function sceneDots(count, current) {
  const dots = Array.from({ length: count }, (_, index) => `<i class="${index === current ? 'on' : ''}"></i>`).join('');
  return `<div class="dots scene-dots" role="img" aria-label="Scena ${current + 1} z ${count}">${dots}</div>`;
}

function bindSceneSwipe(surface, current, count, render) {
  let start = null;
  let suppressClick = false;
  surface.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    if (event.target.closest('button, a, input, select, textarea')) return;
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  surface.addEventListener('pointercancel', event => {
    if (event.pointerId === start?.id) start = null;
  });
  surface.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && event.pointerId === start?.id) start = null;
  });
  surface.addEventListener('pointerup', event => {
    if (event.pointerId !== start?.id) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    suppressClick = true;
    const next = current + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < count) render(next);
  });
  surface.addEventListener('click', event => {
    if (!suppressClick || !event.detail) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);
}
