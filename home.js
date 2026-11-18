/* HOME — 드래그로 돌리는 선 그림 3D, 스크롤 고정 3단계, 문장·카드 등장 */
(function () {
  const home = document.getElementById('view-home');
  if (!home) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 히어로: 선으로 그린 3D 오브젝트 ---------- */
  const cv = document.getElementById('hmCanvas');
  const ctx = cv.getContext('2d');
  // 지오데식 구 (정이십면체 1회 분할) + 궤도 링 3개
  const t = (1 + Math.sqrt(5)) / 2;
  let V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  let F = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const norm = v => { const l = Math.hypot(...v); return v.map(c => c / l); };
  V = V.map(norm);
  const mid = {}; const mp = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid[k] == null) { mid[k] = V.length; V.push(norm(V[a].map((c, i) => (c + V[b][i]) / 2))); } return mid[k]; };
  const F2 = []; F.forEach(([a, b, c]) => { const ab = mp(a, b), bc = mp(b, c), ca = mp(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
  const E = new Set(); F2.forEach(([a, b, c]) => [[a, b], [b, c], [c, a]].forEach(([x, y]) => E.add(x < y ? x + '_' + y : y + '_' + x)));
  const edges = [...E].map(k => k.split('_').map(Number));
  const rings = [0, 1, 2].map(r => { const pts = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; const R = 1.45 + r * .18; pts.push(r === 0 ? [Math.cos(a) * R, 0, Math.sin(a) * R] : r === 1 ? [Math.cos(a) * R, Math.sin(a) * R * .35, Math.sin(a) * R] : [0, Math.cos(a) * R, Math.sin(a) * R]); } return pts; });
  let rx = -.35, ry = .6, vx = 0, vy = .0035, drag = false, lx = 0, ly = 0;
  function size() { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; }
  function proj(p, s, cx, cy) {
    let [x, y, z] = p;
    let c = Math.cos(ry), sn = Math.sin(ry); [x, z] = [x * c + z * sn, -x * sn + z * c];
    c = Math.cos(rx); sn = Math.sin(rx); [y, z] = [y * c - z * sn, y * sn + z * c];
    const k = 3.2 / (3.2 + z); return [cx + x * s * k, cy + y * s * k, z];
  }
  function draw() {
    const w = cv.width, h = cv.height, s = Math.min(w, h) * .21, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h); ctx.lineWidth = Math.max(1, (window.devicePixelRatio || 1) * .9);
    const P = V.map(v => proj(v, s, cx, cy));
    edges.forEach(([a, b]) => { const z = (P[a][2] + P[b][2]) / 2; ctx.strokeStyle = `rgba(17,17,17,${.12 + (1 - (z + 1) / 2) * .7})`; ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke(); });
    rings.forEach((pts, i) => { ctx.strokeStyle = i === 1 ? 'rgba(66,112,255,.85)' : 'rgba(17,17,17,.35)'; ctx.beginPath(); pts.forEach((p, j) => { const q = proj(p, s, cx, cy); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke(); });
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
  function onScroll() {
    if (!home.classList.contains('active')) return;
    const y = window.scrollY, vh = window.innerHeight;
    if (!reduce) { const k = Math.min(1, y / (vh * .8)); intro.style.transform = `translateY(${-k * 80}px)`; intro.style.opacity = 1 - k; st.style.opacity = 1 - k * .8; }
    const top = think.getBoundingClientRect().top + y, span = think.offsetHeight - vh;
    const p = reduce ? 1 : Math.min(1, Math.max(0, (y - top) / span));
    const idx = Math.min(2, Math.floor(p * 3)); const local = p * 3 - idx;
    items.forEach((li, i) => li.classList.toggle('on', reduce || i === idx));
    arts.forEach((svg, i) => { svg.style.opacity = i === idx ? 1 : 0; svg.style.transition = 'opacity .4s ease'; });
    shapes.forEach((list, i) => {
      const d = i === idx ? Math.min(1, local * 2.6 + .15) : 0;
      list.forEach(([el, L], j) => { const q = Math.min(1, Math.max(0, d * (list.length * .45 + 1) - j * .45)); el.style.strokeDashoffset = L * (1 - (reduce ? 1 : q)); });
    });
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
