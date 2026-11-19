/* 한국기술교육대 재료시험 실습 실제 UI: 디자인 시스템 판 부품 + 패널 카드 (#view-koreatech-step 안에서만 동작) */
(function () {
  var root = document.getElementById('view-koreatech-step'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function each(sel, fn, el) { [].forEach.call((el || root).querySelectorAll(sel), fn); }
  function q(el, sel) { return el.querySelector(sel); }
  function shown() { return root.offsetParent !== null || root.getClientRects().length > 0; }

  // 키 안내 버튼: 실제 키보드(W·A·S·D·R·F)를 누르는 동안 켜지고, 마우스로 눌러도 켜짐
  each('[data-ks="keys"]', function (g) {
    var map = {}; each('.ks-key', function (k) { map[k.dataset.key] = k; }, g);
    function set(k, on) { if (k) k.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    document.addEventListener('keydown', function (e) {
      if (!shown() || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      var k = map[(e.key || '').toLowerCase()]; if (k) set(k, true);
    });
    document.addEventListener('keyup', function (e) { set(map[(e.key || '').toLowerCase()], false); });
    window.addEventListener('blur', function () { for (var x in map) set(map[x], false); });
    each('.ks-key', function (k) {
      k.addEventListener('pointerdown', function () { set(k, true); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { k.addEventListener(ev, function () { set(k, false); }); });
      k.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { set(k, true); e.preventDefault(); } });
      k.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') set(k, false); });
    }, g);
  });

  // 이전 · 다음: 5단계 사이를 오가며 점이 옮겨 감, 끝에서는 비활성
  each('[data-ks="step"]', function (g) {
    var dots = g.querySelectorAll('.ks-dots i'), vh = q(g, '.ks-vh'), prev = q(g, '.is-prev'), next = q(g, '.is-next'), k = 1;
    function show() {
      [].forEach.call(dots, function (d, i) { d.classList.toggle('is-on', i === k); });
      vh.textContent = (k + 1) + ' / ' + dots.length + ' 단계'; prev.disabled = k === 0; next.disabled = k === dots.length - 1;
    }
    function hit(b) { b.classList.remove('is-hit'); void b.offsetWidth; b.classList.add('is-hit'); setTimeout(function () { b.classList.remove('is-hit'); }, 220); }
    prev.addEventListener('click', function () { if (k > 0) { k--; hit(prev); show(); } });
    next.addEventListener('click', function () { if (k < dots.length - 1) { k++; hit(next); show(); } });
    show();
  });

  // 라디오 묶음(시험편 탭은 role=tab, 나머지는 radio)
  each('[data-ks="radio"], [data-ks="tabs"]', function (g) {
    var role = g.dataset.ks === 'tabs' ? 'tab' : 'radio', attr = role === 'tab' ? 'aria-selected' : 'aria-checked';
    var bs = [].slice.call(g.querySelectorAll('[role=' + role + ']'));
    function pick(b, f) {
      bs.forEach(function (x) { x.setAttribute(attr, x === b); x.tabIndex = x === b ? 0 : -1; });
      if (g.classList.contains('ks-seg')) g.classList.toggle('is-2', bs.indexOf(b) === 1);
      if (f) b.focus();
    }
    bs.forEach(function (b, i) {
      b.tabIndex = b.getAttribute(attr) === 'true' ? 0 : -1;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var cols = g.classList.contains('ks-rad') ? 2 : 1;
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? cols : e.key === 'ArrowUp' ? -cols : 0;
        if (!d) return; e.preventDefault(); pick(bs[(i + d + bs.length) % bs.length], true);
      });
    });
    var cur = bs.filter(function (b) { return b.getAttribute(attr) === 'true'; })[0]; if (cur) pick(cur);
  });

  // 슬라이더: 끌기·누르기·방향키, 스피커를 누르면 음소거(값은 기억)
  each('[data-ks="slider"]', function (s) {
    var tr = q(s, '.ks-sl-tr'), f = q(s, '.ks-sl-f'), k = q(s, '.ks-sl-k'), spk = q(s, '.ks-spk'), v = +tr.getAttribute('aria-valuenow'), drag = false;
    function set(n) { v = Math.max(0, Math.min(100, Math.round(n))); f.style.width = v + '%'; k.style.left = v + '%'; tr.setAttribute('aria-valuenow', v); tr.setAttribute('aria-valuetext', v + '%'); if (v > 0 && spk.getAttribute('aria-pressed') === 'true') mute(false); }
    function at(e) { var r = tr.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    function mute(m) { spk.setAttribute('aria-pressed', m); s.classList.toggle('is-mute', m); }
    tr.addEventListener('pointerdown', function (e) { drag = true; tr.setPointerCapture(e.pointerId); tr.classList.add('is-drag'); at(e); e.preventDefault(); });
    tr.addEventListener('pointermove', function (e) { if (drag) at(e); });
    function up() { drag = false; tr.classList.remove('is-drag'); }
    tr.addEventListener('pointerup', up); tr.addEventListener('pointercancel', up);
    tr.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 10, PageDown: -10 }[e.key];
      if (e.key === 'Home') { set(0); e.preventDefault(); } else if (e.key === 'End') { set(100); e.preventDefault(); } else if (d) { set(v + d); e.preventDefault(); }
    });
    spk.addEventListener('click', function () { mute(spk.getAttribute('aria-pressed') !== 'true'); });
    set(v);
  });

  // 조견표: 제목 줄 버튼으로 접기·펼치기(높이 애니메이션), 줄을 누르면 선택 표시
  each('[data-ks="ref"]', function (p) {
    var tg = q(p, '.ks-ref-tg'), body = q(p, '.ks-ref-b');
    tg.addEventListener('click', function () {
      var open = tg.getAttribute('aria-expanded') !== 'true';
      tg.setAttribute('aria-expanded', open); tg.setAttribute('aria-label', '브리넬 조견표 ' + (open ? '접기' : '펼치기')); p.classList.toggle('is-off', !open);
      var h = body.scrollHeight;
      if (reduce) { body.style.height = open ? '' : '0px'; body.classList.toggle('is-shut', !open); return; }
      if (open) { body.classList.remove('is-shut'); body.style.height = '0px'; body.offsetHeight; body.style.height = h + 'px'; setTimeout(function () { if (tg.getAttribute('aria-expanded') === 'true') body.style.height = ''; }, 320); }
      else { body.style.height = h + 'px'; body.offsetHeight; body.style.height = '0px'; setTimeout(function () { if (tg.getAttribute('aria-expanded') !== 'true') body.classList.add('is-shut'); }, 320); }
    });
    each('tbody tr', function (tr) {
      tr.tabIndex = 0;
      function sel() { each('tr', function (x) { x.classList.toggle('is-on', x === tr); }, tr.parentNode); }
      tr.addEventListener('click', sel); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { sel(); e.preventDefault(); } });
    }, p);
  });

  // 메인 메뉴: 로고를 누르면 둥근 메뉴가 펼쳐지고 버튼이 바깥으로 퍼짐, 항목 위에 설명 말풍선, 닫기·Esc 로 접힘
  each('[data-ks="mm"]', function (m) {
    var logo = q(m, '.ks-logo'), items = [].slice.call(m.querySelectorAll('.ks-mi')), msg = q(m, '.ks-mm-msg'), tm = 0;
    items.forEach(function (b) { b.style.setProperty('--tx', (172 - parseFloat(b.style.left)) + 'px'); b.style.setProperty('--ty', (172 - parseFloat(b.style.top)) + 'px'); });
    function open(v) {
      m.classList.toggle('is-open', v); logo.setAttribute('aria-expanded', v); logo.setAttribute('aria-label', v ? '메인 메뉴 닫기' : '메인 메뉴 열기');
      items.forEach(function (b) { b.tabIndex = v ? 0 : -1; });
    }
    function say(t) { msg.textContent = t; msg.classList.add('is-on'); clearTimeout(tm); tm = setTimeout(function () { msg.classList.remove('is-on'); }, 1400); }
    logo.addEventListener('click', function () { open(!m.classList.contains('is-open')); });
    items.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.act === 'close') { open(false); logo.focus(); return; }
        items.forEach(function (x) { x.classList.toggle('is-act', x === b); });
        say(q(b, '.ks-vh').textContent + ' 열기');
      });
    });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape' && m.classList.contains('is-open')) { open(false); logo.focus(); } });
  });

  // 환경설정: 닫기 → 다시 열기
  each('.ks-pop', function (pop) {
    var z = pop.parentNode, x = q(pop, '.ks-pop-x'), re = q(z, '.ks-reopen');
    x.addEventListener('click', function () { z.classList.add('is-closed'); setTimeout(function () { re.focus(); }, 50); });
    re.addEventListener('click', function () { z.classList.remove('is-closed'); x.focus(); });
  });
})();

/* 한기대 실습 카드 슬라이드: 패널 폭(400~1084px)이 제각각이라 카드 폭에 맞춰 간격을 잡는 자체 구현
   드래그·스와이프·가로 휠·화살표·점·옆 카드 누르기로 이동, 옆 카드 안 부품은 포커스·클릭 안 됨 */
(function () {
  var root = document.getElementById('view-koreatech-step'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  [].forEach.call(root.querySelectorAll('.ks-cf'), function (cf) {
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
