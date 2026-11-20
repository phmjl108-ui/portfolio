/* 삼성 XR(XRT) 실제 UI 동작 — #view-samsung-xr 안에서만 */
(function () {
  var root = document.getElementById('view-samsung-xr'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function each(s, fn) { qa(root, s).forEach(fn); }
  function onSeen(el, start, stop) {
    if (!('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else if (stop) stop(); }); }, { threshold: 0.3 }).observe(el);
  }
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  // 숫자가 0 → 목표까지 올라감
  function countUp(dur, fn, done) {
    if (reduce) { fn(1); if (done) done(); return; }
    var t0 = 0; function tick(now) { if (!t0) t0 = now; var x = Math.min(1, (now - t0) / dur); fn(ease(x)); if (x < 1) requestAnimationFrame(tick); else if (done) done(); }
    requestAnimationFrame(tick);
  }

  // 1. 단계 헤더: 보이는 동안 STEP 이 01 → 07 로 차례로 넘어가며 막대가 차오름(반복)
  each('[data-sx="step"]', function (g) {
    var n = +g.dataset.n, v = 1, bar = g.querySelector('.sx-step-bar'), f = bar.querySelector('i'), c = g.querySelector('.sx-step-c'), tm = 0;
    function pad(x) { return (x < 10 ? '0' : '') + x; }
    function draw() { f.style.width = (v / n * 100) + '%'; c.textContent = 'STEP ' + pad(v) + ' / ' + pad(n); bar.setAttribute('aria-valuenow', v); }
    function stepNext() { v = v >= n ? 1 : v + 1; draw(); tm = setTimeout(stepNext, v >= n ? 2400 : 1300); }
    draw();
    if (reduce) return;
    onSeen(g, function () { if (!tm) tm = setTimeout(stepNext, 900); }, function () { clearTimeout(tm); tm = 0; });
  });

  // 2. 판독 패널: 보이면(또는 누르면) 측정값이 올라가고, 기준을 넘으면 ✓ 줄이 나타남
  each('[data-sx="read"]', function (b) {
    var val = +b.dataset.v, out = b.querySelector('.sx-read-v b');
    function run() {
      if (b.__busy) return; b.__busy = 1; b.classList.add('is-meas');
      countUp(1100, function (x) { out.textContent = (val * x).toFixed(2); }, function () { b.classList.remove('is-meas'); b.__busy = 0; });
    }
    b.addEventListener('click', run);
    b.__run = run;
    if (!b.closest('.cf')) onSeen(b, function () { if (!b.__s) { b.__s = 1; run(); } });
  });

  // 3. 측정 태그: 보이면 값이 올라감
  each('[data-sx="mtag"]', function (t) {
    var val = +t.dataset.v;
    onSeen(t, function () { if (!t.__s) { t.__s = 1; countUp(1000, function (x) { t.textContent = (val * x).toFixed(2) + 'mm'; }); } });
  });

  // 4. 원형 게이지: 0 → 100% 차오름(반복), 눈금 60칸이 순서대로 켜짐
  each('[data-sx="ring"]', function (g) {
    var on = qa(g, '.sx-ring-on rect'), v = g.querySelector('.sx-ring-v'), raf = 0, t0 = 0, DUR = 3600, HOLD = 1400;
    function set(p) { var k = Math.round(p / 100 * on.length); on.forEach(function (r, i) { r.classList.toggle('on', i < k); }); v.textContent = p + '%'; g.setAttribute('aria-valuenow', p); }
    function tick(now) { if (!t0) t0 = now; var e = now - t0; if (e > DUR + HOLD) { t0 = now; e = 0; } set(Math.round(ease(Math.min(1, e / DUR)) * 100)); raf = requestAnimationFrame(tick); }
    if (reduce) { set(60); return; }
    set(0);
    onSeen(g, function () { if (!raf) { t0 = 0; raf = requestAnimationFrame(tick); } }, function () { cancelAnimationFrame(raf); raf = 0; });
  });

  // 5. 진행 막대(가로): 0 → 100% 칸이 차오름(반복), 칸 모양·색은 피그마 ui_bg_indicator_line_gauge 그대로
  each('[data-sx="line"]', function (g) {
    var segs = qa(g, '.sx-line-on rect'), v = g.querySelector('.sx-line-v'), raf = 0, t0 = 0, DUR = 3200, HOLD = 1400;
    function set(p) { var k = Math.round(p / 100 * segs.length); segs.forEach(function (s, i) { s.classList.toggle('on', i < k); }); v.textContent = p + '%'; g.setAttribute('aria-valuenow', p); }
    function tick(now) { if (!t0) t0 = now; var e = now - t0; if (e > DUR + HOLD) { t0 = now; e = 0; } set(Math.round(ease(Math.min(1, e / DUR)) * 100)); raf = requestAnimationFrame(tick); }
    if (reduce) { set(60); return; }
    set(0);
    onSeen(g, function () { if (!raf) { t0 = 0; raf = requestAnimationFrame(tick); } }, function () { cancelAnimationFrame(raf); raf = 0; });
  });

  // 6. 핸드 메뉴: 누른 버튼이 Focused 로 남음
  each('[data-sx="hand"]', function (h) {
    var navs = qa(h, '.sx-nav');
    function pick(b) { navs.forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); }); }
    navs.forEach(function (b) { b.addEventListener('click', function () { pick(b); }); });
  });

  // 7. 완료 알림: 보이면 체크가 튀어나오고 '단계 완료'가 타이핑됨(반복)
  function toast(el) {
    var tx = el.querySelector('.sx-toast-t'), text = el.dataset.text, timers = [];
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function cycle() {
      clear(); el.classList.add('is-anim'); el.classList.remove('is-in'); tx.textContent = '';
      timers.push(setTimeout(function () { el.classList.add('is-in'); }, 350));
      for (var i = 1; i <= text.length; i++) (function (n) { timers.push(setTimeout(function () { tx.textContent = text.slice(0, n); }, 800 + n * 130)); })(i);
      timers.push(setTimeout(cycle, 800 + text.length * 130 + 2400));
    }
    el.__start = function () { if (!timers.length) cycle(); };
    el.__stop = function () { clear(); el.classList.remove('is-anim', 'is-in'); tx.textContent = text; };
  }
  each('[data-sx="toast"]', function (el) {
    toast(el); if (reduce) return;
    if (!el.closest('.cf')) onSeen(el, el.__start, el.__stop);
  });

  // 8. 대상 태그: 누르면 활성(Active) ↔ 강조(Highlight)
  each('[data-sx="tags"] .sx-tag', function (b) {
    b.addEventListener('click', function () { var on = !b.classList.contains('is-act'); b.classList.toggle('is-act', on); b.setAttribute('aria-pressed', on); });
  });

  // 9. 진단 앱: 왼쪽 메뉴 고르기, 목록 항목 누르기
  each('[data-sx="hass"]', function (h) {
    var tabs = qa(h, '.sx-ha-r:not(.is-home)');
    tabs.forEach(function (t) { t.addEventListener('click', function () { tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t); }); }); });
    var items = qa(h, '.sx-ha-l button');
    items.forEach(function (b) { b.addEventListener('click', function () { items.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
  });

  // 10. 훈련 선택: 카드를 고르면 선택(Pressed 모양 유지)
  each('[data-sx="tsel"]', function (p) {
    var cards = qa(p, '.sx-card:not(:disabled)');
    cards.forEach(function (c) { c.addEventListener('click', function () { cards.forEach(function (x) { x.setAttribute('aria-selected', x === c); }); }); });
  });

  // ===== 패널 카드: 가운데 카드만 조작, 가운데로 오면 모션 재생 =====
  var cf = root.querySelector('.sx-cf');
  if (cf) qa(cf, '.cf-card').forEach(function (c) {
    var pn = c.querySelector('.sx-pn');
    function sync() {
      var center = c.classList.contains('is-center'); pn.inert = !center;
      if (center !== c.__was) {
        var t = pn.querySelector('[data-sx="toast"]'), r = pn.querySelector('[data-sx="read"]');
        if (t && !reduce) { if (center) t.__start(); else t.__stop(); }
        if (r && center && r.__run) r.__run();
      }
      c.__was = center;
    }
    new MutationObserver(sync).observe(c, { attributes: true, attributeFilter: ['class'] });
    sync();
    pn.addEventListener('keydown', function (e) { e.stopPropagation(); });
  });
})();
