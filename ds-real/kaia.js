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
    c.style.minWidth = c.offsetWidth + 'px'; // 글자가 쳐지는 동안 칩·바탕 폭이 들썩이지 않게
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

  // 8. 무전기: 신호 아이콘은 늘 수신 모션(CSS), 누르면 통화 중(Talking) ↔ 기본 전환
  each('[data-ka="radio"]', function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
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

  // ===== 패널 카드(작업계획서·운행안전협의서·적합성 기록부·단계 카드) =====
  var cf = root.querySelector('.ka-cf');
  if (cf) {
    // 옆 카드 안 부품은 포커스·클릭 안 되게
    qa(cf, '.cf-card').forEach(function (c) {
      var pn = c.querySelector('.ka-pn');
      function sync() { pn.inert = !c.classList.contains('is-center'); }
      new MutationObserver(sync).observe(c, { attributes: true, attributeFilter: ['class'] });
      sync();
      pn.addEventListener('keydown', function (e) { e.stopPropagation(); });
    });
    // 문서 본문 스크롤 + 피그마 스크롤 막대(손잡이 끌기, 트랙 누르면 한 화면씩)
    qa(cf, '.kd-body').forEach(function (b) {
      var vp = b.querySelector('.kd-vp.is-scroll'), sb = b.querySelector('.kd-sb'); if (!vp || !sb) return;
      var hd = sb.querySelector('.kd-sb-h');
      function max() { return Math.max(1, vp.scrollHeight - vp.clientHeight); }
      function draw() {
        var th = sb.clientHeight, hh = Math.max(24, th * vp.clientHeight / vp.scrollHeight);
        hd.style.height = hh + 'px'; hd.style.transform = 'translateY(' + ((th - hh) * vp.scrollTop / max()).toFixed(1) + 'px)';
      }
      vp.addEventListener('scroll', draw, { passive: true });
      window.addEventListener('resize', draw); window.addEventListener('load', draw); draw();
      var drag = false, sy = 0, st = 0, k = 1;
      sb.addEventListener('pointerdown', function (e) {
        e.stopPropagation(); e.preventDefault();
        if (e.target === hd) {
          var r = sb.getBoundingClientRect(), hr = hd.getBoundingClientRect();
          drag = true; sy = e.clientY; st = vp.scrollTop; k = max() / Math.max(1, r.height - hr.height);
          sb.classList.add('is-drag'); sb.setPointerCapture(e.pointerId);
        } else {
          var below = e.clientY > hd.getBoundingClientRect().top;
          vp.scrollBy({ top: (below ? 1 : -1) * vp.clientHeight * 0.9, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
      sb.addEventListener('pointermove', function (e) { if (drag) vp.scrollTop = st + (e.clientY - sy) * k; });
      function up() { drag = false; sb.classList.remove('is-drag'); }
      sb.addEventListener('pointerup', up); sb.addEventListener('pointercancel', up);
    });
    // 문서용 체크박스
    qa(cf, '.kd-ck').forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); }); });
    // 적합성 기록부: ○ 양호 → △ 보통 → × 불량, 하나라도 × 면 판정 '부적합'·사유에 항목 이름
    var MK = ['○', '△', '×'], ML = ['양호', '보통', '불량'];
    qa(cf, '.kf-d3 .kd-r').forEach(function (r) {
      var ms = qa(r, '.kf-m'); if (!ms.length) return;
      var j = r.querySelector('.kf-j'), y = r.querySelector('.kf-y');
      var names = qa(cf.querySelector('.kf-d3'), '.kd-r')[2].querySelectorAll('.kd-c');
      ms.forEach(function (m) {
        m.addEventListener('click', function () {
          var v = (+m.dataset.v + 1) % 3; m.dataset.v = v; m.textContent = MK[v]; m.setAttribute('aria-label', ML[v]);
          var bad = ms.filter(function (x) { return x.dataset.v === '2'; }).map(function (x) { return names[[].indexOf.call(x.closest('.kd-r').children, x.parentNode)].textContent; });
          j.textContent = bad.length ? '부적합' : '적합'; y.textContent = bad.length ? bad.join(', ') : '-';
        });
      });
    });
    // 단계 카드: 현재 단계의 버튼을 누르면 다음 단계로(피그마 Progress 사전→1→2→3단계), 완료한 단계 버튼은 그 단계부터 다시
    qa(cf, '[data-ka="stepcards"]').forEach(function (g) {
      var cs = qa(g, '.kg-card');
      function render(p, anim) {
        g.dataset.p = p;
        cs.forEach(function (c, i) {
          var cur = i === p, lock = i > p, dis = i === 3 && i !== p || (i === 3 && p >= 3), b = c.querySelector('.kg-b');
          if (i === 3 && p < 3) { cur = false; lock = true; dis = true; } else if (i === 3) { cur = false; lock = true; dis = true; }
          var was = c.classList.contains('is-cur');
          c.classList.toggle('is-cur', cur); c.classList.toggle('is-lock', lock); c.classList.toggle('is-dis', dis);
          c.classList.remove('is-new'); if (cur && !was && anim && !reduce) { c.offsetWidth; c.classList.add('is-new'); }
          b.classList.toggle('ka-p', cur); b.classList.toggle('ka-s', !cur); b.disabled = lock;
          b.setAttribute('aria-current', cur ? 'step' : 'false');
        });
      }
      cs.forEach(function (c, i) {
        c.querySelector('.kg-b').addEventListener('click', function () { var p = +g.dataset.p; render(i === p ? i + 1 : i, true); });
      });
      render(+g.dataset.p || 0, false);
    });
  }
})();
