/* 한국기술교육대 XR 실제 UI: 디자인 시스템 판 부품 + 팝업 카드 (#view-koreatech-xr 안에서만 동작) */
(function () {
  var root = document.getElementById('view-koreatech-xr'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function each(sel, fn, el) { [].forEach.call((el || root).querySelectorAll(sel), fn); }
  function q(el, sel) { return el.querySelector(sel); }
  var ITEMS = ['2.1.1 Selective Soldering', '2.1.2 AOI 품질검사', '2.1.3 ICT 기능검사', '2.1.5 Confomal Coating', '2.1.6 Router', '2.1.7 Casing', '2.1.8 OEM'];

  // 토스트: 체크가 튀어나오고 글자가 한 자씩 쳐짐
  function toast(el, text, hold) {
    var b = q(el, 'b'); clearTimeout(el.__t); (el.__ts || []).forEach(clearTimeout); el.__ts = [];
    el.classList.remove('is-ck'); b.textContent = ''; el.classList.add('is-in');
    el.__ts.push(setTimeout(function () { el.classList.add('is-ck'); }, 150));
    for (var i = 1; i <= text.length; i++) (function (k) { el.__ts.push(setTimeout(function () { b.textContent = text.slice(0, k); }, reduce ? 0 : 350 + k * 70)); })(i);
    el.__t = setTimeout(function () { el.classList.remove('is-in', 'is-ck'); }, (reduce ? 0 : 350 + text.length * 70) + (hold || 1800));
  }

  // 드롭다운: 열고 고르기(마우스·방향키·Enter·Esc), 밖을 누르면 닫힘
  each('[data-kx="dd"]', function (dd) {
    var btn = q(dd, '.kx-dd-btn'), list = q(dd, '.kx-dd-list'), v = q(dd, '.kx-dd-v'), opts = [].slice.call(list.querySelectorAll('[role=option]')), act = -1;
    function mark(i) { opts.forEach(function (o, k) { o.classList.toggle('is-act', k === i); }); act = i; if (opts[i]) opts[i].scrollIntoView({ block: 'nearest' }); }
    function open(v2) {
      dd.classList.toggle('is-open', v2); list.hidden = !v2; btn.setAttribute('aria-expanded', v2);
      if (v2) { mark(opts.findIndex(function (o) { return o.getAttribute('aria-selected') === 'true'; })); list.focus({ preventScroll: true }); }
    }
    function pick(o) {
      opts.forEach(function (x) { x.setAttribute('aria-selected', x === o); });
      v.textContent = o.textContent; open(false); btn.focus();
      // 위쪽 학습 드롭다운을 바꾸면 3뎁스 학습 이동 막대도 같은 항목으로
      if (ITEMS.indexOf(o.textContent) > -1) root.dispatchEvent(new CustomEvent('kx-item', { detail: ITEMS.indexOf(o.textContent) }));
    }
    btn.addEventListener('click', function () { open(list.hidden); });
    opts.forEach(function (o) { o.addEventListener('click', function () { pick(o); }); o.addEventListener('mousemove', function () { mark(opts.indexOf(o)); }); });
    list.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { mark(Math.min(opts.length - 1, act + 1)); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { mark(Math.max(0, act - 1)); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ') { if (opts[act]) pick(opts[act]); e.preventDefault(); }
      else if (e.key === 'Escape' || e.key === 'Tab') { open(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target) && !list.hidden) open(false); });
  });

  // 2뎁스 학습(펼침·접힘) + 3뎁스 학습 이전·다음
  each('[data-kx="nav"]', function (g) {
    var d2 = q(g, '.kx-d2'), d3 = q(g, '.kx-d3'), t = q(g, '.kx-d3-t'), prev = q(g, '.is-prev'), next = q(g, '.is-next'), k = 3;
    function show(i, dir) {
      k = Math.max(0, Math.min(ITEMS.length - 1, i));
      t.innerHTML = ''; var s = document.createElement('span'); s.textContent = ITEMS[k]; if (dir) s.className = dir < 0 ? 'is-l' : 'is-r'; t.appendChild(s);
      prev.disabled = k === 0; next.disabled = k === ITEMS.length - 1;
    }
    prev.addEventListener('click', function () { show(k - 1, -1); });
    next.addEventListener('click', function () { show(k + 1, 1); });
    d2.addEventListener('click', function () { var o = d2.getAttribute('aria-expanded') !== 'true'; d2.setAttribute('aria-expanded', o); d3.style.display = o ? '' : 'none'; });
    root.addEventListener('kx-item', function (e) { show(e.detail, e.detail > k ? 1 : -1); });
    show(k);
  });

  // 아이콘 버튼: 누르면 아이콘이 돌거나 밀림
  each('.kx-ib[data-fx]', function (b) {
    b.addEventListener('click', function () { var c = 'is-' + b.dataset.fx; b.classList.remove(c); void b.offsetWidth; b.classList.add(c); setTimeout(function () { b.classList.remove(c); }, 600); });
  });

  // 라디오 묶음(목록·이미지 보기, 학습 선택)
  each('[data-kx="radio"]', function (g) {
    var bs = [].slice.call(g.querySelectorAll('[role=radio]'));
    function pick(b, f) { bs.forEach(function (x) { x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; }); if (f) b.focus(); }
    bs.forEach(function (b, i) {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (d) { e.preventDefault(); pick(bs[(i + d + bs.length) % bs.length], true); }
      });
    });
  });

  // 체크·선택 칸·완료 표시
  each('.kx-ck, .kx-sel', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); }); });
  each('.kx-pin', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); });
  each('.kx-side', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') !== 'true'); }); });

  // 강제소환: 누르면 알림 토스트(1분 후 강제소환됩니다.) — 피그마 popup_invite_alarm 문구
  each('[data-kx="recall"]', function (g) {
    var b = q(g, '.kx-recall'), t = q(g, '.kx-toast');
    b.addEventListener('click', function () { toast(t, '1분 후 강제소환됩니다.', 1800); });
  });

  // 재생 조작 바: 진행 막대가 차오르고, 일시정지·처음부터·닫기(잠시 뒤 다시 나타남)
  each('[data-kx="ctrl"]', function (g) {
    var bar = q(g, '.kx-ctrl'), pp = q(g, '.kx-c-pp'), rot = q(g, '.kx-c-rot'), x = q(g, '.kx-c-x'), fill = q(g, '.kx-prog i'), p = 0, last = 0, paused = false;
    function tick(ts) { if (!paused && last) { p = (p + (ts - last) / 8000) % 1; fill.style.width = (p * 100).toFixed(2) + '%'; } last = ts; requestAnimationFrame(tick); }
    if (!reduce) requestAnimationFrame(tick); else fill.style.width = '40%';
    pp.addEventListener('click', function () { paused = !paused; pp.setAttribute('aria-pressed', paused); pp.setAttribute('aria-label', paused ? '재생' : '일시정지'); });
    rot.addEventListener('click', function () { p = 0; fill.style.width = '0%'; rot.classList.remove('is-spin'); void rot.offsetWidth; rot.classList.add('is-spin'); });
    x.addEventListener('click', function () { bar.classList.add('is-gone'); setTimeout(function () { bar.classList.remove('is-gone'); }, 1400); });
  });

  // 상태 바: 측정중(진행 막대) → 양품, 누르면 다시 측정
  each('[data-kx="stat"]', function (s) {
    var b = q(s, 'b'), tm = 0;
    function run() {
      clearTimeout(tm); s.classList.remove('is-good', 'is-run'); b.textContent = '측정중'; void s.offsetWidth; s.classList.add('is-run');
      tm = setTimeout(function () { s.classList.remove('is-run'); s.classList.add('is-good'); b.textContent = '양품'; }, reduce ? 300 : 2400);
    }
    s.addEventListener('click', run);
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); io.disconnect(); } }); io.observe(s); } else run();
  });

  // ===== 팝업 카드 =====
  // 닫기(X·확인·Close) → 팝업이 사라지고 '다시 열기'
  each('.kx-cf .cf-panel', function (p) {
    var re = q(p, '.kx-reopen');
    each('[data-close]', function (b) { b.addEventListener('click', function () { p.classList.add('is-closed'); setTimeout(function () { re.focus(); }, 50); }); }, p);
    re.addEventListener('click', function () { p.classList.remove('is-closed'); var f = q(p, '.kx-pop button'); f && f.focus(); });
  });
  // 학습 선택 확인: 고른 항목으로 시작 표시
  each('.kx-learn', function (pop) {
    var go = q(pop, '.kx-go');
    go.addEventListener('click', function () {
      var s = q(pop, '.kx-opt[aria-checked="true"]'); go.classList.add('is-done'); go.textContent = '시작!';
      setTimeout(function () { go.classList.remove('is-done'); go.textContent = '확인'; }, 1100);
      go.setAttribute('aria-label', (s ? s.firstChild.textContent : '') + ' 학습 시작');
    });
  });
  // 지침서 표: 줄을 누르면 선택 표시(키보드 Enter 도)
  each('[data-kx="rows"] tbody tr', function (tr) {
    function sel() { each('tr', function (x) { x.classList.toggle('is-on', x === tr); }, tr.parentNode); }
    tr.addEventListener('click', sel); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { sel(); e.preventDefault(); } });
  });
  // 입고검수: 이미지 탭 전환, Save → 진행 표시 → 토스트
  each('.kx-ib-pop', function (pop) {
    var tabs = [].slice.call(pop.querySelectorAll('[role=tab]')), img = q(pop, '.kx-ph img'), empty = q(pop, '.kx-empty'), save = q(pop, '.kx-save'), t = q(pop, '.kx-toast');
    function pick(b, f) {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === b); x.tabIndex = x === b ? 0 : -1; });
      var i = tabs.indexOf(b); img.hidden = i === 1; empty.hidden = i !== 1; if (f) b.focus();
    }
    tabs.forEach(function (b, i) {
      b.tabIndex = i ? -1 : 0;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); pick(tabs[(i + d + 3) % 3], true); } });
    });
    save.addEventListener('click', function () {
      save.classList.add('is-busy');
      setTimeout(function () { save.classList.remove('is-busy'); toast(t, '입고검수 결과를 저장했습니다.', 1600); }, reduce ? 0 : 900);
    });
  });
})();

/* 한기대 XR 카드 슬라이드: 팝업 폭(506~1194px)이 제각각이라 카드 폭에 맞춰 간격을 잡는 자체 구현
   드래그·스와이프·가로 휠·화살표·점·옆 카드 누르기로 이동, 옆 카드 안 부품은 포커스·클릭 안 됨 */
(function () {
  var root = document.getElementById('view-koreatech-xr'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  [].forEach.call(root.querySelectorAll('.kx-cf'), function (cf) {
    var stage = cf.querySelector('.cf-stage'), cards = [].slice.call(cf.querySelectorAll('.cf-card')), dots = [].slice.call(cf.querySelectorAll('.cf-dots button'));
    var prev = cf.querySelector('.cf-prev'), next = cf.querySelector('.cf-next');
    var n = cards.length, pos = 0, target = 0, raf = 0, W = [], H = [], sw = 1000, sh = 780;
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function sc(ad) { return Math.max(0.6, 1 - ad * 0.2); }
    function measure() {
      W = cards.map(function (c) { return c.querySelector('.cf-panel').offsetWidth; });
      H = cards.map(function (c) { return c.querySelector('.cf-panel').offsetHeight + 30; });
      sw = stage.clientWidth || 1000; sh = stage.clientHeight || 780;
    }
    // 가운데 카드가 화면 폭·높이에 들어오도록 줄이는 비율(좁은 화면용)
    function fitOf(k) { return Math.min(1, (sw - (sw > 700 ? 120 : 40)) / W[k], (sh - 20) / H[k]);
    }
    // 가운데가 k 일 때 각 카드 중심의 x (옆 카드는 가운데 카드 가장자리 밖으로 150·70px 만큼 보이게)
    // 옆 카드는 가운데 카드보다 크게 보이지 않도록 가운데 카드 크기에 맞춰 더 줄임
    function lim(i, k) { return i === k ? 1 : Math.min(1, Math.max(0.4, W[k] * 0.9 / W[i])); }
    function layout(k) {
      var xs = [], ss = []; xs[k] = 0; ss[k] = 1;
      [1, -1].forEach(function (s) {
        var edge = W[k] / 2;
        for (var i = k + s, j = 1; i >= 0 && i < n; i += s, j++) {
          ss[i] = sc(j) * lim(i, k);
          edge += j === 1 ? 150 : 70;
          xs[i] = s * Math.max(edge - W[i] * ss[i] / 2, j === 1 ? W[k] * 0.4 + W[i] * ss[i] / 2 : 0); // 가운데 카드와 겹치는 폭은 가운데 카드의 10% 까지
          if (j > 1) xs[i] = s * Math.max(Math.abs(xs[i]), Math.abs(xs[i - s]) + 40);
          edge = Math.max(edge, Math.abs(xs[i]) + W[i] * ss[i] / 2);
        }
      });
      return { x: xs, s: ss };
    }
    function render() {
      var a = Math.floor(clamp(pos, 0, n - 1)), b = Math.min(n - 1, a + 1), t = clamp(pos, 0, n - 1) - a;
      var la = layout(a), lb = layout(b), over = pos - clamp(pos, 0, n - 1), fit = fitOf(a) * (1 - t) + fitOf(b) * t;
      cards.forEach(function (c, i) {
        var d = i - pos, ad = Math.abs(d), sd = clamp(d, -1, 1);
        var x = (la.x[i] * (1 - t) + lb.x[i] * t - over * 200) * fit, sk = la.s[i] * (1 - t) + lb.s[i] * t;
        c.style.transform = 'translate(-50%, -50%) translateX(' + x.toFixed(1) + 'px) translateZ(' + (-ad * 120) + 'px) rotateY(' + (sd * 30) + 'deg) scale(' + (sk * fit).toFixed(3) + ')';
        c.style.filter = 'brightness(' + (1 - Math.min(ad, 3) * 0.15) + ')';
        c.style.zIndex = String(100 - Math.round(ad * 10));
        var center = ad < 0.5;
        if (c.__c !== center) { c.__c = center; c.classList.toggle('is-center', center); c.querySelector('.cf-panel').inert = !center; }
      });
      var k = Math.round(clamp(pos, 0, n - 1));
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i === k); d.setAttribute('aria-current', i === k ? 'true' : 'false'); });
      prev.disabled = target <= 0; next.disabled = target >= n - 1;
    }
    function tick() {
      var diff = target - pos;
      if (reduce || Math.abs(diff) < 0.001) { pos = target; render(); raf = 0; return; }
      pos += diff * 0.14; render(); raf = requestAnimationFrame(tick);
    }
    function go(k) { target = clamp(Math.round(k), 0, n - 1); if (!raf) raf = requestAnimationFrame(tick); }
    prev.addEventListener('click', function () { go(target - 1); });
    next.addEventListener('click', function () { go(target + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    cf.addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('.cf-panel')) return; // 패널 안 부품의 방향키는 부품이 씀
      if (e.key === 'ArrowLeft') { go(target - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(target + 1); e.preventDefault(); }
    });
    var down = false, sx = 0, sp = 0, moved = 0, lastX = 0, lastT = 0, vel = 0, PX = 320;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var cc = e.target.closest && e.target.closest('.cf-card.is-center');
      if (cc && e.target.closest('button, input, select, textarea, a, label, [role=radio], [role=switch], [tabindex], table')) return;
      down = true; moved = 0; sx = lastX = e.clientX; lastT = performance.now(); sp = pos; vel = 0;
      stage.setPointerCapture(e.pointerId); stage.classList.add('is-drag'); cancelAnimationFrame(raf); raf = 0;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      var now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
      pos = clamp(sp - dx / PX, -0.4, n - 0.6); target = pos; render();
    });
    function up(e) {
      if (!down) return;
      down = false; stage.classList.remove('is-drag');
      if (moved < 6) {
        stage.releasePointerCapture && stage.releasePointerCapture(e.pointerId);
        var el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest('.cf-card');
        if (c && cards.indexOf(c) > -1 && !c.classList.contains('is-center')) { go(+c.dataset.i); return; }
        go(target); return;
      }
      go(pos - vel * 0.35);
    }
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    var wheelT = 0;
    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); var now = Date.now(); if (now - wheelT < 350) return;
      wheelT = now; go(target + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });
    function refresh() { measure(); render(); }
    window.addEventListener('resize', refresh);
    if (window.ResizeObserver) new ResizeObserver(refresh).observe(stage); // 화면이 처음 보일 때(display:none → block) 폭을 다시 잼
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    refresh();
  });
})();
