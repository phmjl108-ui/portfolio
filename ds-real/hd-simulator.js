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

  // 카드 슬라이드: 가운데가 아닌 카드 안 부품은 포커스·클릭 안 되게
  each('.hs-cf .cf-card', function (c) {
    var p = q(c, '.hs-p'); if (!p) return;
    function upd() { p.inert = !c.classList.contains('is-center'); }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  });
})();
