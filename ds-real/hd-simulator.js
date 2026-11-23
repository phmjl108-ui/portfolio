/* 굴착기 시뮬레이터(hd-simulator) 실제 UI: 판의 부품과 카드 슬라이드 패널을 실제로 동작시키기 (view-hd-simulator 안에서만) */
(function () {
  var root = document.getElementById('view-hd-simulator'); if (!root) return;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function q(el, s) { return el.querySelector(s); }
  function each(s, fn) { qa(root, s).forEach(fn); }

  // 게임 메뉴처럼: 마우스를 올리면 그 버튼이 선택(청록), 누르면 확정, 방향키로 이동
  each('[data-hs="focus"]', function (g) {
    var bs = qa(g, '[role=radio]');
    function set(b) { bs.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; }); }
    bs.forEach(function (b, i) {
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') set(b); });
      b.addEventListener('click', function () {
        set(b);
        var pop = b.closest('.hs-pop'); if (pop) { pop.classList.remove('is-done'); void pop.offsetWidth; pop.classList.add('is-done'); }
        if (b.closest('.hs-at-row')) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      });
      b.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!k) return;
        e.preventDefault(); var n = bs[(i + k + bs.length) % bs.length]; set(n); n.focus(); if (n.closest('.hs-at-row')) n.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    });
    var cur = q(g, '[aria-checked="true"]') || bs[0]; set(cur);
  });

  // 키 안내: 누르면 잠깐 청록(마우스·터치·키보드 A~D, 판이 화면에 보일 때만)
  each('[data-hs="keys"]', function (g) {
    var vis = false;
    function flash(k) { if (!k) return; k.classList.add('is-on'); clearTimeout(k.__t); k.__t = setTimeout(function () { k.classList.remove('is-on'); }, 260); }
    qa(g, '.hs-key').forEach(function (k) { k.addEventListener('click', function () { flash(k); }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(g);
    document.addEventListener('keydown', function (e) {
      if (!vis || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
      flash(q(g, '[data-k="' + (e.key || '').toLowerCase() + '"]'));
    });
  });

  // 어태치먼트 가로 목록: 휠(세로)도 가로로 넘김
  each('.hs-at', function (a) {
    var sc = q(a, '.hs-at-sc');
    sc.addEventListener('wheel', function (e) {
      e.stopPropagation(); // 카드 슬라이드의 가로 휠로 넘어가지 않게
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, max = sc.scrollWidth - sc.clientWidth;
      if ((d < 0 && sc.scrollLeft <= 0) || (d > 0 && sc.scrollLeft >= max - 1)) return;
      e.preventDefault(); sc.scrollLeft += d;
    }, { passive: false });
    sc.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    var sel = q(a, '[aria-checked="true"]'); if (sel) setTimeout(function () { sc.scrollLeft = sel.getBoundingClientRect().left - sc.getBoundingClientRect().left + sc.scrollLeft - 40; }, 0);
  });

  // 콘텐츠 선택 카드: 누르면 선택(Hover 와 같은 청록), 다시 누르면 해제
  each('[data-hs="card"] .hs-cs', function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });
  });

  // 음량 슬라이더: 끌기·누르기·방향키, 값(0~100)과 채움 폭이 같이 바뀜
  each('[data-hs="slider"] .hs-sl', function (sl) {
    var cr = q(sl, '.hs-sl-cr'), v = q(sl, '.hs-sl-v'), W = 3816;
    function set(n) { n = Math.max(0, Math.min(100, Math.round(n))); cr.setAttribute('width', W * n / 100); v.textContent = n; sl.setAttribute('aria-valuenow', n); }
    function at(e) { var r = sl.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    sl.addEventListener('pointerdown', function (e) { e.preventDefault(); sl.setPointerCapture(e.pointerId); sl.classList.add('is-drag'); sl.focus(); at(e); });
    sl.addEventListener('pointermove', function (e) { if (sl.classList.contains('is-drag')) at(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) { sl.addEventListener(t, function () { sl.classList.remove('is-drag'); }); });
    sl.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key], n = +sl.getAttribute('aria-valuenow');
      if (e.key === 'Home') d = -n; if (e.key === 'End') d = 100 - n; if (d == null) return;
      e.preventDefault(); set(n + d);
    });
    set(+sl.getAttribute('aria-valuenow'));
  });

  // 설정 항목: 좌우 화살표로 값 순환(미터 m ↔ 인치 in)
  each('[data-hs="option"] .hs-opt', function (o) {
    var vals = ['미터 m', '인치 in'], i = 0, out = q(o, '.hs-opt-v');
    qa(o, '.hs-opt-b').forEach(function (b) { b.addEventListener('click', function () { i = (i + (+b.getAttribute('data-d')) + vals.length) % vals.length; out.textContent = vals[i]; }); });
  });

  // ── 2026-11-20 카드 교체 ──
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onCenter(el, fn) { // 그 카드가 가운데로 올 때마다 fn(true), 벗어나면 fn(false)
    var c = el.closest('.cf-card'); if (!c) { fn(true); return; }
    var was = null;
    function upd() { var on = c.classList.contains('is-center'); if (on !== was) { was = on; fn(on); } }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  }
  // 1. 작업 단계 가이드: 누르기·Enter·Space·→ 다음 단계, ← 이전 단계, 가운데에 있는 동안 4.5초마다 자동 진행(마우스를 올리면 멈춤)
  each('[data-hs="steps"]', function (p) {
    var li = qa(p, '.hs-st li'), i = 0, t = 0, hover = false, live = false;
    function show(k) {
      i = (k + li.length) % li.length;
      li.forEach(function (x, j) { x.hidden = j !== i; x.classList.toggle('is-on', j === i); });
    }
    function loop() { clearTimeout(t); if (live && !hover && !reduce) t = setTimeout(function () { show(i + 1); loop(); }, 4500); }
    p.addEventListener('click', function () { show(i + 1); loop(); });
    p.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, Enter: 1, ' ': 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
      e.preventDefault(); e.stopPropagation(); show(i + d); loop();
    });
    p.addEventListener('pointerenter', function () { hover = true; clearTimeout(t); });
    p.addEventListener('pointerleave', function () { hover = false; loop(); });
    onCenter(p, function (on) { live = on; if (on) show(0); loop(); });
  });
  // 2·3. 목록 행이 왼쪽부터 차례로 채워지며 들어옴(카드가 가운데로 올 때마다)
  each('[data-hs="rise"], [data-hs="score"]', function (p) {
    onCenter(p, function (on) { p.classList.remove('is-play'); if (on) { void p.offsetWidth; p.classList.add('is-play'); } });
  });
  // 3. 시험 채점: 감점 합계가 0 → -19 로 세어 올라감, 목록 세로 스크롤 + 피그마 스크롤 막대(끌기 가능)
  each('[data-hs="score"]', function (p) {
    var nums = qa(p, '.hs-sh b[data-to]');
    onCenter(p, function (on) {
      nums.forEach(function (b) {
        var to = +b.getAttribute('data-to'); cancelAnimationFrame(b.__r);
        if (!on || reduce) { b.textContent = to; return; }
        var t0 = performance.now();
        (function f(now) { var k = Math.min(1, (now - t0) / 900); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) b.__r = requestAnimationFrame(f); })(t0);
      });
    });
    var sc = q(p, '.hs-sc'), th = q(p, '.hs-sc-th'), T0 = 271, T1 = 1199 - 155; // 막대 이동 범위(피그마 좌표)
    function sync() { var m = sc.scrollHeight - sc.clientHeight; th.style.top = (T0 + (m > 0 ? sc.scrollTop / m : 0) * (T1 - T0)) + 'px'; }
    sc.addEventListener('scroll', sync, { passive: true });
    sc.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });
    var drag = null;
    th.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation(); th.setPointerCapture(e.pointerId); th.classList.add('is-drag');
      var k = p.getBoundingClientRect().height / 1263; // 화면 px ↔ 피그마 px
      drag = { y: e.clientY, s: sc.scrollTop, k: k };
    });
    th.addEventListener('pointermove', function (e) {
      if (!drag) return; var m = sc.scrollHeight - sc.clientHeight;
      sc.scrollTop = drag.s + (e.clientY - drag.y) / drag.k / (T1 - T0) * m;
    });
    ['pointerup', 'pointercancel'].forEach(function (t) { th.addEventListener(t, function () { drag = null; th.classList.remove('is-drag'); }); });
    sync();
  });

  // 카드 슬라이드: 가운데가 아닌 카드 안 부품은 포커스·클릭 안 되게
  each('.hs-cf .cf-card', function (c) {
    var p = q(c, '.hs-p'); if (!p) return;
    function upd() { p.inert = !c.classList.contains('is-center'); }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  });
})();
