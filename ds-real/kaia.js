/* KAIA(RAIL-LUX) 실제 UI 동작 — #view-kaia 안에서만 */
(function () {
  var root = document.getElementById('view-kaia'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function each(s, fn) { qa(root, s).forEach(fn); }
  // 화면에 보일 때만 반복 모션을 돌림
  function onSeen(el, start, stop) {
    if (!('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else if (stop) stop(); }); }, { threshold: 0.3 }).observe(el);
  }

  // 1. 입력 필드: 클릭하면 입력으로 포커스, 필수 입력은 비면 오류
  each('.ka-in', function (box) {
    box.addEventListener('mousedown', function (e) { var i = box.querySelector('input'); if (e.target !== i && !e.target.closest('button') && !i.disabled) { e.preventDefault(); i.focus(); } });
  });
  each('[data-ka="req"]', function (f) {
    var inp = f.querySelector('input');
    function check() { var bad = !inp.value.trim(); f.classList.toggle('is-err', bad); inp.setAttribute('aria-invalid', bad); }
    inp.addEventListener('input', function () { if (inp.value.trim()) check(); });
    inp.addEventListener('blur', check);
  });

  // 2. 비밀번호 보기·숨기기
  each('.ka-eye', function (b) {
    var inp = b.parentNode.querySelector('input');
    b.addEventListener('click', function () {
      var show = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', show); b.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기');
      inp.type = show ? 'text' : 'password';
    });
  });

  // 3. 상단 바 '조작 안내' 토글(Toggle On/Off)
  each('.ka-tbtn[data-ka="press"]', function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
  });

  // 4. 안내 칩: 화면에 보이면 글자가 타이핑됨(반복)
  each('[data-ka="type"]', function (c) {
    var t = c.querySelector('.ka-chip-t'), text = c.dataset.text, timers = [];
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function cycle() {
      clear(); t.textContent = ''; c.classList.add('is-typing');
      for (var i = 1; i <= text.length; i++) (function (n) { timers.push(setTimeout(function () { t.textContent = text.slice(0, n); }, 300 + n * 90)); })(i);
      timers.push(setTimeout(function () { c.classList.remove('is-typing'); }, 300 + text.length * 90 + 200));
      timers.push(setTimeout(cycle, 300 + text.length * 90 + 2600));
    }
    if (reduce) return;
    onSeen(c, function () { if (!timers.length) cycle(); }, function () { clear(); t.textContent = text; c.classList.remove('is-typing'); });
  });

  // 5. 훈련 진행 막대: 이전·다음으로 단계 이동(채움이 늘어남)
  each('[data-ka="prog"]', function (g) {
    var n = +g.dataset.n, v = +g.dataset.v, bar = g.querySelector('.ka-prog'), f = g.querySelector('.ka-prog-f'), c = g.querySelector('.ka-prog-c');
    var prev = g.querySelector('[data-go="-1"]'), next = g.querySelector('[data-go="1"]');
    function draw() { f.style.width = (v / n * 100) + '%'; c.textContent = '(' + v + '/' + n + ')'; bar.setAttribute('aria-valuenow', v); prev.disabled = v <= 1; next.disabled = v >= n; }
    prev.addEventListener('click', function () { v = Math.max(1, v - 1); draw(); });
    next.addEventListener('click', function () { v = Math.min(n, v + 1); draw(); });
    f.style.width = '0%';
    onSeen(g, function () { if (!g.__s) { g.__s = 1; setTimeout(draw, 120); } });
  });

  // 6. 단계 표시기: 현재 → 완료, 다음 노드가 현재, 사이 선이 차오름
  each('[data-ka="steps"]', function (g) {
    var v = +g.dataset.v, nodes = qa(g, '.ka-node'), lines = qa(g, '.ka-line');
    var prev = g.querySelector('[data-go="-1"]'), next = g.querySelector('[data-go="1"]');
    function draw() {
      nodes.forEach(function (nd, i) {
        var k = i + 1; nd.classList.toggle('is-done', k < v); nd.classList.toggle('is-cur', k === v);
        nd.setAttribute('aria-label', k + '단계 ' + (k < v ? '완료' : k === v ? '현재' : '잠김'));
      });
      lines.forEach(function (l, i) { l.classList.toggle('is-on', i + 1 < v); });
      prev.disabled = v <= 1; next.disabled = v >= nodes.length;
    }
    prev.addEventListener('click', function () { v = Math.max(1, v - 1); draw(); });
    next.addEventListener('click', function () { v = Math.min(nodes.length, v + 1); draw(); });
    draw();
  });

  // 7. 사이드바: 그룹 머리 줄로 접기·펼치기(높이 애니메이션), 단계 항목 고르면 현재 단계
  each('[data-ka="side"]', function (s) {
    qa(s, '.ka-sg-h').forEach(function (h) {
      var body = document.getElementById(h.getAttribute('aria-controls'));
      h.addEventListener('click', function () {
        var open = h.getAttribute('aria-expanded') !== 'true';
        h.setAttribute('aria-expanded', open);
        var full = body.scrollHeight;
        if (reduce) { body.style.height = open ? '' : '0px'; body.classList.toggle('is-shut', !open); return; }
        if (open) {
          body.classList.remove('is-shut'); body.style.height = '0px'; body.offsetHeight; body.style.height = full + 'px';
          body.addEventListener('transitionend', function f(e) { if (e.target !== body) return; body.removeEventListener('transitionend', f); if (h.getAttribute('aria-expanded') === 'true') body.style.height = ''; });
        } else {
          body.style.height = full + 'px'; body.offsetHeight; body.style.height = '0px';
          body.addEventListener('transitionend', function f(e) { if (e.target !== body) return; body.removeEventListener('transitionend', f); if (h.getAttribute('aria-expanded') !== 'true') body.classList.add('is-shut'); });
        }
      });
    });
    qa(s, '.ka-sg-l[role="listbox"]').forEach(function (l) {
      var items = qa(l, '[role="option"]');
      function pick(k) {
        items.forEach(function (it, i) { it.setAttribute('aria-selected', i === k); it.classList.toggle('is-done', i < k); it.tabIndex = i === k ? 0 : -1; });
      }
      pick(items.findIndex(function (it) { return it.getAttribute('aria-selected') === 'true'; }));
      items.forEach(function (it, i) {
        it.addEventListener('click', function () { pick(i); it.focus(); });
        it.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown' && items[i + 1]) { e.preventDefault(); items[i + 1].focus(); }
          else if (e.key === 'ArrowUp' && items[i - 1]) { e.preventDefault(); items[i - 1].focus(); }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(i); }
        });
      });
    });
  });

  // 8. 무전기: 누르고 있는 동안 통화 중(Space·Enter 도 같음)
  each('[data-ka="radio"]', function (b) {
    function on() { b.setAttribute('aria-pressed', 'true'); }
    function off() { b.setAttribute('aria-pressed', 'false'); }
    b.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; b.setPointerCapture && b.setPointerCapture(e.pointerId); on(); });
    b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    b.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); on(); } });
    b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') off(); });
    b.addEventListener('blur', off);
    b.addEventListener('click', function (e) { e.preventDefault(); });
  });

  // 9. 이동 지점: 누르면 핀이 내려앉음
  each('[data-ka="tp"]', function (b) {
    b.addEventListener('click', function () { b.classList.remove('is-drop'); b.offsetWidth; b.classList.add('is-drop'); });
    b.addEventListener('animationend', function (e) { if (e.target.classList.contains('ka-tp-p')) b.classList.remove('is-drop'); });
  });

  // 10. 확인 팝업(판): 버튼을 누르면 닫히고, 로그아웃 아이콘으로 다시 열림
  each('[data-ka="pop"]', function (st) {
    var pop = st.querySelector('.ka-pop'), open = st.querySelector('.ka-pop-open');
    qa(pop, '[data-close]').forEach(function (b) { b.addEventListener('click', function () { pop.hidden = true; open.hidden = false; open.focus(); }); });
    open.addEventListener('click', function () { open.hidden = true; pop.hidden = false; pop.querySelector('button').focus(); });
  });

  // 11. 말풍선: 두 사람이 번갈아 말하고 글자가 타이핑됨(반복)
  each('[data-ka="talk"]', function (t) {
    var sbs = qa(t, '.ka-sb'), timers = [];
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function say(k, at) {
      var sb = sbs[k], m = sb.querySelector('.ka-msg'), text = m.dataset.text;
      timers.push(setTimeout(function () {
        sbs.forEach(function (o) { o.classList.toggle('is-on', o === sb); });
        sb.classList.remove('is-wait'); m.textContent = ''; m.classList.add('is-typing');
      }, at));
      for (var i = 1; i <= text.length; i++) (function (n) { timers.push(setTimeout(function () { m.textContent = text.slice(0, n); }, at + 350 + n * 45)); })(i);
      timers.push(setTimeout(function () { m.classList.remove('is-typing'); }, at + 350 + text.length * 45 + 100));
      return at + 350 + text.length * 45 + 1600;
    }
    function cycle() {
      clear(); sbs.forEach(function (o) { o.classList.add('is-wait'); o.classList.remove('is-on'); });
      var at = say(0, 300); at = say(1, at);
      timers.push(setTimeout(cycle, at + 1200));
    }
    if (reduce) { sbs[0].classList.add('is-on'); return; }
    onSeen(t, function () { if (!timers.length) cycle(); }, function () { clear(); sbs.forEach(function (o) { o.classList.remove('is-wait'); var m = o.querySelector('.ka-msg'); m.textContent = m.dataset.text; m.classList.remove('is-typing'); }); });
  });

  // 12. 로딩 게이지: 0 → 100% 차오르고 숫자가 따라감(반복)
  each('[data-ka="gauge"]', function (g) {
    var f = g.querySelector('.ka-g-f'), l = g.querySelector('.ka-g-l'), raf = 0, t0 = 0, DUR = 3200, HOLD = 1200;
    function set(p) { f.style.width = p + '%'; l.textContent = 'Loading... ' + p + '%'; g.setAttribute('aria-valuenow', p); }
    function tick(now) {
      if (!t0) t0 = now; var e = now - t0;
      if (e > DUR + HOLD) { t0 = now; e = 0; }
      var x = Math.min(1, e / DUR), p = Math.round((x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2) * 100);
      set(p); raf = requestAnimationFrame(tick);
    }
    if (reduce) { set(50); return; }
    set(0);
    onSeen(g, function () { if (!raf) { t0 = 0; raf = requestAnimationFrame(tick); } }, function () { cancelAnimationFrame(raf); raf = 0; });
  });

  // ===== 패널 카드 =====
  var cf = root.querySelector('.ka-cf');
  if (cf) {
    // 옆 카드 안 부품은 포커스·클릭 안 되게, 가운데 카드가 되면 모션 재생
    qa(cf, '.cf-card').forEach(function (c) {
      var pn = c.querySelector('.ka-pn');
      function sync() {
        var center = c.classList.contains('is-center'); pn.inert = !center;
        if (center && !c.__was) { var d = pn.querySelector('.ka-done'); if (d && !reduce) { d.classList.remove('is-play'); d.offsetWidth; d.classList.add('is-play'); } }
        c.__was = center;
      }
      new MutationObserver(sync).observe(c, { attributes: true, attributeFilter: ['class'] });
      sync();
      // 패널 안 방향키·스페이스는 부품이 씀(카드 넘김으로 새지 않게)
      pn.addEventListener('keydown', function (e) { e.stopPropagation(); });
    });
    // 로그인 패널: 비어 있으면 오류, 입력하면 오류 해제
    qa(cf, '[data-ka="login"]').forEach(function (form) {
      var flds = qa(form, '.ka-fld');
      function check(f) { var inp = f.querySelector('input'), bad = !inp.value.trim(); f.classList.toggle('is-err', bad); f.querySelector('.ka-help span').textContent = bad ? f.dataset.msg : ''; inp.setAttribute('aria-invalid', bad); return !bad; }
      flds.forEach(function (f) { var inp = f.querySelector('input'); inp.addEventListener('input', function () { if (f.classList.contains('is-err')) check(f); }); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = flds.map(check).every(Boolean);
        if (!ok) { var bad = form.querySelector('.ka-fld.is-err input'); if (bad) bad.focus(); }
      });
    });
  }
})();
