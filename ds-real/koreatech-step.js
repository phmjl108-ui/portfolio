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

  // 이전 · 다음 버튼: 누르면 눌림 모션(자막을 넘기는 실제 동작은 하단 자막 그룹)
  each('[data-ks="step"] .ks-arw', function (b) {
    b.addEventListener('click', function () { b.classList.remove('is-hit'); void b.offsetWidth; b.classList.add('is-hit'); setTimeout(function () { b.classList.remove('is-hit'); }, 220); });
  });

  // 라디오 묶음(시험편 탭은 role=tab, 나머지는 radio)
  each('[data-ks="radio"], [data-ks="tabs"]', function (g) {
    var role = g.dataset.ks === 'tabs' ? 'tab' : 'radio', attr = role === 'tab' ? 'aria-selected' : 'aria-checked';
    var bs = [].slice.call(g.querySelectorAll('[role=' + role + ']'));
    function pick(b, f) {
      bs.forEach(function (x) { x.setAttribute(attr, x === b); x.tabIndex = x === b ? 0 : -1; });
      if (g.classList.contains('ks-seg') || g.classList.contains('ks-iso')) g.classList.toggle('is-2', bs.indexOf(b) === 1);
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
    var logo = q(m, '.ks-logo'), items = [].slice.call(m.querySelectorAll('.ks-mi'));
    items.forEach(function (b) { b.style.setProperty('--tx', (172 - parseFloat(b.style.left)) + 'px'); b.style.setProperty('--ty', (172 - parseFloat(b.style.top)) + 'px'); });
    function open(v) {
      m.classList.toggle('is-open', v); logo.setAttribute('aria-expanded', v); logo.setAttribute('aria-label', v ? '메인 메뉴 닫기' : '메인 메뉴 열기');
      items.forEach(function (b) { b.tabIndex = v ? 0 : -1; });
    }
    logo.addEventListener('click', function () { open(!m.classList.contains('is-open')); });
    items.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.act === 'close') { open(false); logo.focus(); return; }
        items.forEach(function (x) { x.classList.toggle('is-act', x === b); });
      });
    });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape' && m.classList.contains('is-open')) { open(false); logo.focus(); } });
  });

  // 환경설정: 닫기 → 닫히는 모션 뒤 다시 나타남(다시 열기 버튼은 피그마에 없어 두지 않음)
  each('.ks-pop', function (pop) {
    var z = pop.parentNode, x = q(pop, '.ks-pop-x');
    x.addEventListener('click', function () { z.classList.add('is-closed'); setTimeout(function () { z.classList.remove('is-closed'); }, 1100); });
  });

  // 상단 메뉴: 2뎁스 탭 선택(초록 표시가 미끄러져 옮겨 감), 3뎁스 드롭다운 열고 고르기, 오른쪽 버튼으로 메뉴 접기
  each('[data-ks="tm"]', function (t) {
    var scn = t.closest('.ks-scn'), tabs = [].slice.call(t.querySelectorAll('.ks-tm-tabs [role=tab]')), ind = q(t, '.ks-tm-ind');
    var dd = q(t, '.ks-tm-dd'), list = q(t, '.ks-dd'), opts = [].slice.call(list.querySelectorAll('[role=option]')), t3 = q(t, '.ks-tm-t3'), fold = q(t, '.ks-tm-fold'), sub = q(t, '.ks-tm-sub');
    function pick(b, f) { tabs.forEach(function (x, i) { var on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; if (on) ind.style.transform = 'translateX(' + (i * 335) + 'px)'; }); if (f) b.focus(); }
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); } });
    });
    pick(tabs[0]);
    function openDD(v) { t.classList.toggle('is-dd', v); if (scn) scn.classList.toggle('is-open', v); dd.setAttribute('aria-expanded', v); dd.setAttribute('aria-label', v ? '세부 단계 닫기' : '세부 단계 열기'); opts.forEach(function (o) { o.tabIndex = v ? 0 : -1; }); }
    openDD(false);
    dd.addEventListener('click', function () { openDD(!t.classList.contains('is-dd')); });
    opts.forEach(function (o) {
      o.addEventListener('click', function () { opts.forEach(function (x) { x.setAttribute('aria-selected', x === o); }); t3.textContent = q(o, 'span').textContent; openDD(false); dd.focus(); });
    });
    document.addEventListener('pointerdown', function (e) { if (t.classList.contains('is-dd') && !sub.contains(e.target)) openDD(false); });
    t.addEventListener('keydown', function (e) { if (e.key === 'Escape' && t.classList.contains('is-dd')) { openDD(false); dd.focus(); } });
    fold.addEventListener('click', function () { var f = !t.classList.contains('is-fold'); openDD(false); t.classList.toggle('is-fold', f); fold.setAttribute('aria-expanded', !f); fold.setAttribute('aria-label', f ? '상단 메뉴 펼치기' : '상단 메뉴 접기'); });
  });

  // 하단 자막: 이전·다음으로 자막과 (현재/전체)가 바뀜, 처음·끝에서는 화살표가 비활성 모양, 가운데 위 화살표로 접기
  each('[data-ks="bc"]', function (c) {
    var caps = [].map.call(c.querySelectorAll('template'), function (x) { return x.innerHTML; }), tx = q(c, '.ks-bc-t'), n = q(c, '.ks-bc-n');
    var prev = q(c, '.is-prev'), next = q(c, '.is-next'), fold = q(c, '.ks-bc-fold'), k = 0, tm = 0;
    function show(anim) {
      prev.disabled = k === 0; next.disabled = k === caps.length - 1;
      function put() { tx.innerHTML = caps[k]; n.textContent = '(' + (k + 1) + '/' + caps.length + ')'; tx.classList.remove('is-fade'); }
      if (!anim || reduce) { put(); return; }
      tx.classList.add('is-fade'); clearTimeout(tm); tm = setTimeout(put, 180);
    }
    prev.addEventListener('click', function () { if (k > 0) { k--; show(true); } });
    next.addEventListener('click', function () { if (k < caps.length - 1) { k++; show(true); } });
    fold.addEventListener('click', function () { var f = !c.classList.contains('is-fold'); c.classList.toggle('is-fold', f); fold.setAttribute('aria-expanded', !f); fold.setAttribute('aria-label', f ? '자막 펼치기' : '자막 접기'); });
    show(false);
  });

  // 가이드북 · 조견표 버튼, 오브젝트 라벨: 누르면 선택(Active) ↔ 기본
  each('.ks-sbs .ks-sb, .ks-lb', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); });

  // 조작키 보기: 버튼 → 조작키 목록·키 펼침(공간 차지 없이 겹쳐 뜸), 닫기 버튼·Esc 로 접힘, 키보드를 누르면 해당 키가 켜짐
  each('[data-ks="op"]', function (o) {
    var scn = o.closest('.ks-scn'), btn = q(o, '.ks-op-open'), p = q(o, '.ks-op-p'), x = q(o, '.ks-op-x');
    function set(v) { p.hidden = !v; o.classList.toggle('is-open', v); if (scn) scn.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', v); (v ? x : btn).focus(); }
    btn.addEventListener('click', function () { set(true); });
    x.addEventListener('click', function () { set(false); });
    o.addEventListener('keydown', function (e) { if (e.key === 'Escape' && o.classList.contains('is-open')) set(false); });
  });

  // 토스트: 나타나며 종이 흔들리고 글자가 쳐진 뒤 잠시 머물다 사라짐(반복), 화면에 보일 때만 돎
  each('[data-ks="toast"]', function (t) {
    var b = q(t, 'b'), full = b.getAttribute('data-t'), timers = [], on = false;
    function later(f, ms) { timers.push(setTimeout(f, ms)); }
    function stop() { timers.forEach(clearTimeout); timers = []; }
    function cycle() {
      stop(); b.style.width = ''; b.textContent = full; b.style.width = Math.ceil(b.offsetWidth) + 1 + 'px'; b.textContent = '';
      t.classList.remove('is-ring'); void t.offsetWidth; t.classList.add('is-in', 'is-ring');
      if (reduce) { b.textContent = full; later(function () { t.classList.remove('is-in'); }, 3600); later(cycle, 4400); return; }
      var i = 0; later(function step() { b.textContent = full.slice(0, ++i); if (i < full.length) later(step, 45); else { later(function () { t.classList.remove('is-in'); }, 2200); later(cycle, 3000); } }, 380);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !on) { on = true; cycle(); } else if (!e.isIntersecting && on) { on = false; stop(); t.classList.remove('is-in'); } }); }).observe(t.parentNode);
    else cycle();
  });
})();

/* 2026-11-23 한기대 실습 카드 4장(전체메뉴·조작법 가이드·로크웰 패널·평가결과) 동작 */
(function () {
  var root = document.getElementById('view-koreatech-step'); if (!root) return;
  var cf = root.querySelector('.ks-cf'); if (!cf) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function each(sel, fn, el) { [].forEach.call((el || cf).querySelectorAll(sel), fn); }
  function q(el, sel) { return el.querySelector(sel); }

  // 닫기(X·확인·하단 버튼) → 닫히는 모션 후 1.2초 뒤 다시 뜸
  each('.cf-panel', function (p) {
    each('[data-close]', function (b) { b.addEventListener('click', function () {
      p.classList.add('is-closed'); clearTimeout(p.__rt);
      p.__rt = setTimeout(function () { p.classList.remove('is-closed'); }, 1200);
    }); }, p);
  });

  // 전체메뉴: 2뎁스 항목 누르면 State=On(주황 그라데이션) — 전체에서 하나만
  each('.ks-mn', function (m) {
    var bs = [].slice.call(m.querySelectorAll('.ks-mn-2'));
    bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
  });

  // 로크웰 패널: 선택 버튼 → 스케일 선택 화면 / 유지 시간 키패드 → 값이 버튼에 들어감
  each('.ks-rw', function (rw) {
    var views = {}; each('.ks-rw-v', function (v) { views[v.classList[1].slice(3)] = v; }, rw);
    var from = null, buf = '', out = q(views.kp, '.is-out b');
    function show(k) { for (var x in views) views[x].hidden = x !== k; var f = q(views[k], 'button, input'); if (f) f.focus({ preventScroll: true }); }
    function setVal(btn, v) { q(btn, 'span').textContent = v; btn.classList.add('is-set'); }
    each('[data-go]', function (b) { b.addEventListener('click', function () {
      from = b; var k = b.dataset.go;
      if (k === 'kp') { buf = /^[0-9.]+$/.test(q(b, 'span').textContent) ? q(b, 'span').textContent : ''; out.textContent = buf; }
      else each('.ks-rw-opt', function (o) { o.classList.toggle('is-cur', o.dataset.v === q(b, 'span').textContent); }, views[k]);
      show(k);
    }); }, rw);
    each('.ks-rw-opt', function (o) { o.addEventListener('click', function () { setVal(from, o.dataset.v); show('main'); from.focus({ preventScroll: true }); }); }, rw);
    each('.ks-rw-back', function (b) { b.addEventListener('click', function () { show('main'); if (from) from.focus({ preventScroll: true }); }); }, rw);
    each('.ks-rw-key', function (k) { k.addEventListener('click', function () {
      var v = k.dataset.v;
      if (v === 'Del') buf = buf.slice(0, -1);
      else if (v === '.' ? buf.indexOf('.') < 0 && buf.length < 6 : buf.length < 6) buf += (v === '.' && !buf ? '0.' : v);
      out.textContent = buf;
    }); }, rw);
    q(views.kp, '.ks-rw-ok').addEventListener('click', function () { if (buf && from) setVal(from, buf); show('main'); if (from) from.focus({ preventScroll: true }); });
    // 입력칸은 숫자·소수점만
    each('input', function (i) { i.addEventListener('input', function () { var v = i.value.replace(/[^0-9.]/g, ''); var p = v.split('.'); if (p.length > 2) v = p[0] + '.' + p.slice(1).join(''); if (v !== i.value) i.value = v; }); }, rw);
  });

  // 평가결과: 화면에 보이면 점수·진행도가 0 부터 차오름
  each('.ks-ev', function (ev) {
    var nums = [].slice.call(ev.querySelectorAll('[data-count]'));
    function run() {
      nums.forEach(function (n) {
        var to = +n.dataset.count, suf = n.dataset.suf || '', t0 = 0;
        if (reduce) { n.textContent = to + suf; return; }
        function tick(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 900); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
      });
    }
    var card = ev.closest('.cf-card'), was = false;
    new MutationObserver(function () { var c = card.classList.contains('is-center'); if (c && !was) run(); was = c; }).observe(card, { attributes: true, attributeFilter: ['class'] });
    if (card.classList.contains('is-center')) { was = true; run(); }
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
          var hw = W[i] * ss[i] / 2;
          xs[i] = s * (j === 1 ? edge + 48 + hw : Math.max(edge + 70 - hw, 0)); // 옆 카드는 가운데 카드 가장자리에서 48px 띄워 겹치지 않게(3D 회전 여유 포함)
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
