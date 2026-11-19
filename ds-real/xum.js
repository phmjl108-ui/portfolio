/* KISTI XU:M 실제 UI: 디자인 시스템 판 부품 + 팝업·버튼 카드 슬라이드 (#view-xum 안에서만 동작) */
(function () {
  var root = document.getElementById('view-xum'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function each(sel, fn, el) { [].forEach.call((el || root).querySelectorAll(sel), fn); }
  function q(el, sel) { return el.querySelector(sel); }

  // 스위치·체크박스·주석(누를 때마다 켬/끔)
  each('.xu-lock, .xu-check', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); }); });
  each('.xu-annot, [data-xu="press"] [aria-pressed]', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); });

  // 라디오 묶음(3D 조작 도구 · 성별 토글 탭): 누르거나 방향키로 하나만 선택
  each('[data-xu="radio"]', function (g) {
    var bs = [].slice.call(g.querySelectorAll('[role=radio]'));
    function pick(b, focus) { bs.forEach(function (x) { var on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); if (focus) b.focus(); }
    bs.forEach(function (b, i) {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!d) return; e.preventDefault(); pick(bs[(i + d + bs.length) % bs.length], true);
      });
    });
  });

  // 툴팁: 전체화면 버튼 위 말풍선, 누르면 전체화면 ↔ 화면축소
  each('[data-xu="tip"]', function (t) {
    var b = q(t, '.xu-fs'), tip = q(t, '.xu-tip');
    function show(v) { t.classList.toggle('is-on', v); }
    show(true); // 판에서는 말풍선을 늘 보여 주고, 누르면 문구·아이콘이 바뀜
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on); tip.textContent = on ? '화면축소' : '전체화면'; b.setAttribute('aria-label', tip.textContent); show(true);
    });
  });

  // 파일 아이콘 버튼: 누르면 클릭 색(#9D81FF)으로 바뀌고 화살표가 한 바퀴
  each('[data-xu="file"] .xu-file', function (b) {
    var tm = 0;
    b.addEventListener('click', function () {
      b.classList.remove('is-hit'); void b.offsetWidth; b.classList.add('is-hit');
      clearTimeout(tm); tm = setTimeout(function () { b.classList.remove('is-hit'); }, 700);
    });
  });

  // 로그인 팝업: 빈 칸이면 흔들림, 채워져 있으면 확인 → 진행 표시 → 결과 문구
  each('[data-xu="login"]', function (f) {
    var ins = f.querySelectorAll('.xu-inp'), ok = q(f, '.xu-ok'), msg = q(f, '.xu-msg'), tm = 0;
    function say(t) { msg.textContent = t; msg.classList.add('is-on'); clearTimeout(tm); tm = setTimeout(function () { msg.classList.remove('is-on'); }, 1800); }
    [].forEach.call(ins, function (i) { i.addEventListener('input', function () { i.classList.remove('is-err'); }); });
    q(f, '.xu-reset').addEventListener('click', function () { say('비밀번호 재설정 메일을 보냈습니다.'); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var empty = [].filter.call(ins, function (i) { return !i.value.trim(); });
      if (empty.length) { empty.forEach(function (i) { i.classList.remove('is-err'); void i.offsetWidth; i.classList.add('is-err'); }); empty[0].focus(); say('아이디와 비밀번호를 입력해 주세요.'); return; }
      ok.classList.add('is-busy');
      setTimeout(function () { ok.classList.remove('is-busy'); say('로그인되었습니다.'); }, reduce ? 0 : 1100);
    });
  });

  // 그룹 만들기: 이름 입력 후 Enter 로 멤버 추가, ✕ 로 빼기, 그룹 명이 비면 확인 비활성, 취소는 처음 상태로
  each('[data-xu="group"]', function (f) {
    var list = q(f, '.xu-memlist'), add = q(f, '.xu-msearch input'), name = q(f, 'input.xu-gi'), desc = q(f, 'textarea.xu-gi'), ok = q(f, '.xu-gbtn.is-p');
    var first = list.innerHTML, X = q(list, 'button svg').outerHTML;
    function sync() { desc.classList.toggle('has-v', !!desc.value); name.classList.remove('is-err'); }
    function bind(chip) {
      q(chip, 'button').addEventListener('click', function () {
        var nx = chip.nextElementSibling || chip.previousElementSibling;
        chip.classList.add('is-out');
        setTimeout(function () { chip.remove(); if (nx) { var b = q(nx, 'button'); b && b.focus(); } else add.focus(); }, reduce ? 0 : 180);
      });
    }
    function bindAll() { each('.xu-mem', bind, list); }
    add.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      var v = add.value.trim(); if (!v) return;
      var chip = document.createElement('span'); chip.className = 'xu-mem is-in';
      chip.appendChild(document.createTextNode(v));
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', v + ' 빼기'); b.innerHTML = X;
      chip.appendChild(b); list.appendChild(chip); bind(chip); add.value = '';
      list.scrollTop = list.scrollHeight;
    });
    name.addEventListener('input', sync); desc.addEventListener('input', sync);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!name.value.trim()) { name.classList.remove('is-err'); void name.offsetWidth; name.classList.add('is-err'); name.focus(); return; }
      ok.textContent = '완료'; setTimeout(function () { ok.textContent = '확인'; }, 1200); });
    f.addEventListener('reset', function () { setTimeout(function () { list.innerHTML = first; bindAll(); sync(); }, 0); });
    bindAll(); sync();
  });
})();

/* XU:M 카드 슬라이드: 패널 폭(298~768px)이 제각각이라 카드 폭에 맞춰 간격을 잡는 자체 구현
   드래그·스와이프·가로 휠·화살표·점·옆 카드 누르기로 이동, 옆 카드 안 부품은 포커스·클릭 안 됨 */
(function () {
  var root = document.getElementById('view-xum'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  [].forEach.call(root.querySelectorAll('.xu-cf'), function (cf) {
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
