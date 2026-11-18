/* HOME — 드래그로 돌리는 선 그림 3D, 스크롤 고정 3단계, 문장·카드 등장 */
(function () {
  const home = document.getElementById('view-home');
  if (!home) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 히어로: 선으로 그린 3D 오브젝트 ---------- */
  const cv = document.getElementById('hmCanvas');
  const ctx = cv.getContext('2d');
  // 두 구(현장 FIELD · UI)가 겹치는 형태 — 교집합 링을 파란색으로 강조
  const D = .62, SPH = [[-D, 0, 0], [D, 0, 0]];
  const sphLines = SPH.map(([ox]) => {
    const out = [];
    for (let m = 0; m < 10; m++) { const ph = m / 10 * Math.PI; const pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; pts.push([ox + Math.sin(a) * Math.cos(ph), Math.cos(a), Math.sin(a) * Math.sin(ph)]); } out.push(pts); }
    for (let k = 1; k < 7; k++) { const y = -1 + k * 2 / 7, r = Math.sqrt(1 - y * y), pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; pts.push([ox + Math.cos(a) * r, y, Math.sin(a) * r]); } out.push(pts); }
    return out;
  });
  const RI = Math.sqrt(1 - D * D);
  const lens = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; lens.push([0, Math.cos(a) * RI, Math.sin(a) * RI]); }
  let rx = -.28, ry = .35, vx = 0, vy = .0035, drag = false, lx = 0, ly = 0;
  function size() { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; }
  function proj(p, s, cx, cy) {
    let [x, y, z] = p;
    let c = Math.cos(ry), sn = Math.sin(ry); [x, z] = [x * c + z * sn, -x * sn + z * c];
    c = Math.cos(rx); sn = Math.sin(rx); [y, z] = [y * c - z * sn, y * sn + z * c];
    const k = 3.2 / (3.2 + z); return [cx + x * s * k, cy + y * s * k, z];
  }
  function line(pts, s, cx, cy, fade) {
    let prev = null;
    pts.forEach(p => { const q = proj(p, s, cx, cy); if (prev) { const z = (q[2] + prev[2]) / 2; ctx.strokeStyle = `rgba(17,17,17,${fade ? .08 + (1 - (z + 1.6) / 3.2) * .55 : .5})`; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } prev = q; });
  }
  function draw() {
    const w = cv.width, h = cv.height, s = Math.min(w, h) * .22, cx = w / 2, cy = h / 2, dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w, h); ctx.lineWidth = Math.max(1, dpr * .8);
    sphLines.forEach(L => L.forEach(pts => line(pts, s, cx, cy, true)));
    ctx.lineWidth = dpr * 2.2; ctx.strokeStyle = '#4270FF'; ctx.beginPath();
    lens.forEach((p, j) => { const q = proj(p, s, cx, cy); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke();
    const label = (tx, q, col) => { ctx.font = `700 ${16 * dpr}px Pretendard, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 7 * dpr; ctx.strokeStyle = '#fff'; ctx.strokeText(tx, q[0], q[1]); ctx.fillStyle = col; ctx.fillText(tx, q[0], q[1]); };
    label('FIELD', proj([-D - .5, 0, 0], s, cx, cy), '#111');
    label('UI', proj([D + .5, 0, 0], s, cx, cy), '#111');
    label('READ', proj([0, -RI - .22, 0], s, cx, cy), '#4270FF');
  }
  function tick() {
    if (!drag) { ry += vy; rx += vx; vx *= .95; if (!reduce) vy += (.0035 - vy) * .02; }
    draw(); requestAnimationFrame(tick);
  }
  const st = document.getElementById('hmStage');
  st.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; st.setPointerCapture(e.pointerId); });
  st.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; ry += dx * .008; rx += dy * .008; vy = dx * .0015; vx = dy * .0015; lx = e.clientX; ly = e.clientY; });
  ['pointerup', 'pointercancel'].forEach(n => st.addEventListener(n, () => { drag = false; }));
  window.addEventListener('resize', size); size(); if (reduce) vy = 0; tick();

  /* ---------- 2. 스크롤: 히어로 퇴장 + 생각 3단계 ---------- */
  const intro = home.querySelector('.hm-intro');
  const think = home.querySelector('.hm-think');
  const items = [...home.querySelectorAll('.hm-points li')];
  const arts = [...home.querySelectorAll('.hm-art svg')];
  const bar = home.querySelector('.hm-bar i');
  const shapes = arts.map(svg => [...svg.querySelectorAll('path,rect,circle,line,ellipse')].map(el => { el.setAttribute('pathLength', '1'); el.style.strokeDasharray = '1 1'; el.style.strokeDashoffset = 1; return [el, 1]; }));
  let lastIdx = -1;
  function onScroll() {
    if (!home.classList.contains('active')) return;
    const y = window.scrollY, vh = window.innerHeight;
    if (!reduce) { const k = Math.min(1, y / (vh * .8)); intro.style.transform = `translateY(${-k * 80}px)`; intro.style.opacity = 1 - k; st.style.opacity = 1 - k * .8; }
    const top = think.getBoundingClientRect().top + y, span = think.offsetHeight - vh;
    const p = reduce ? 1 : Math.min(1, Math.max(0, (y - top) / span));
    const idx = Math.min(2, Math.floor(p * 3)); const local = p * 3 - idx;
    items.forEach((li, i) => li.classList.toggle('on', reduce || i === idx));
    arts.forEach((svg, i) => { svg.style.opacity = i === idx ? 1 : 0; svg.style.transition = 'opacity .4s ease'; });
    if (idx !== lastIdx) {
      lastIdx = idx;
      shapes.forEach((list, i) => list.forEach(([el], j) => {
        if (i === idx) { el.style.transition = reduce ? 'none' : `stroke-dashoffset .9s cubic-bezier(.4,0,.2,1) ${j * .07}s`; el.style.strokeDashoffset = 0; }
        else { el.style.transition = 'none'; el.style.strokeDashoffset = 1; }
      }));
    }
    if (bar) bar.style.height = (p * 100) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- 3. 문장 · 카드 등장 ---------- */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const group = en.target.matches('.hm-cards') ? en.target.querySelectorAll('.hm-card') : en.target.querySelectorAll('.hm-line');
    group.forEach((el, i) => setTimeout(() => el.classList.add('in'), reduce ? 0 : i * 140));
    io.unobserve(en.target);
  }), { threshold: .25 });
  home.querySelectorAll('.hm-about, .hm-cards').forEach(el => io.observe(el));

  document.addEventListener('portfolio:view', e => { if (e.detail === 'home') { size(); onScroll(); } });
})();
