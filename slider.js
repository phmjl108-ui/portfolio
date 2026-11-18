/* 화면 슬라이드 — 한 장씩 크게, 이전/다음 · 숫자 · 드래그 · 키보드 */
(function () {
  document.querySelectorAll('[data-slider]').forEach(sl => {
    const track = sl.querySelector('.sl-track');
    const items = [...track.children];
    const count = sl.querySelector('.sl-count');
    const prev = sl.querySelector('.sl-prev'), next = sl.querySelector('.sl-next');
    const cap = sl.querySelector('.sl-cap');
    const dots = sl.querySelector('.sl-dots');
    let i = 0, sx = 0, dx = 0, drag = false, moved = false;
    if (dots) items.forEach((_, k) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', (k + 1) + '번 화면'); b.addEventListener('click', () => go(k)); dots.appendChild(b); });
    function go(k) {
      i = Math.max(0, Math.min(items.length - 1, k));
      track.style.transform = `translateX(${-i * 100}%)`;
      if (count) count.textContent = `${i + 1} / ${items.length}`;
      if (cap) cap.textContent = items[i].dataset.caption || '';
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === items.length - 1;
      if (dots) [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    }
    prev && prev.addEventListener('click', () => go(i - 1));
    next && next.addEventListener('click', () => go(i + 1));
    sl.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
    const vp = sl.querySelector('.sl-view');
    vp.addEventListener('pointerdown', e => { drag = true; moved = false; sx = e.clientX; dx = 0; track.style.transition = 'none'; });
    vp.addEventListener('pointermove', e => { if (!drag) return; dx = e.clientX - sx; if (Math.abs(dx) > 6) moved = true; track.style.transform = `translateX(calc(${-i * 100}% + ${dx}px))`; });
    const end = () => { if (!drag) return; drag = false; track.style.transition = ''; if (Math.abs(dx) > vp.offsetWidth * .15) go(i + (dx < 0 ? 1 : -1)); else go(i); };
    vp.addEventListener('pointerup', end); vp.addEventListener('pointerleave', end);
    vp.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
    go(0);
  });
})();
