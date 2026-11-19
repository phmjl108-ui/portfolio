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

  // 어태치먼트 가로 목록: 휠(세로)도 가로로 넘김, 아래 막대가 위치를 따라감(누르면 그 위치로)
  each('.hs-at', function (a) {
    var sc = q(a, '.hs-at-sc'), bar = q(a, '.hs-at-bar'), th = q(bar, 'span');
    function sync() { var w = sc.clientWidth / sc.scrollWidth, max = sc.scrollWidth - sc.clientWidth; th.style.width = (w * 100) + '%'; th.style.left = (max ? sc.scrollLeft / max * (1 - w) * 100 : 0) + '%'; }
    sc.addEventListener('scroll', sync, { passive: true });
    sc.addEventListener('wheel', function (e) {
      e.stopPropagation(); // 카드 슬라이드의 가로 휠로 넘어가지 않게
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, max = sc.scrollWidth - sc.clientWidth;
      if ((d < 0 && sc.scrollLeft <= 0) || (d > 0 && sc.scrollLeft >= max - 1)) return;
      e.preventDefault(); sc.scrollLeft += d;
    }, { passive: false });
    bar.addEventListener('pointerdown', function (e) { e.stopPropagation(); var r = bar.getBoundingClientRect(); sc.scrollTo({ left: (e.clientX - r.left) / r.width * sc.scrollWidth - sc.clientWidth / 2, behavior: 'smooth' }); });
    sc.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    sync(); window.addEventListener('resize', sync);
    var sel = q(a, '[aria-checked="true"]'); if (sel) setTimeout(function () { sc.scrollLeft = sel.getBoundingClientRect().left - sc.getBoundingClientRect().left + sc.scrollLeft - 40; sync(); }, 0);
  });

  // 카드 슬라이드: 가운데가 아닌 카드 안 부품은 포커스·클릭 안 되게
  each('.hs-cf .cf-card', function (c) {
    var p = q(c, '.hs-p'); if (!p) return;
    function upd() { p.inert = !c.classList.contains('is-center'); }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  });
})();
