/* DX 센터 실제 UI 동작 — #view-dx-center 안에서만 */
(function () {
  var root = document.getElementById('view-dx-center'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function each(s, fn) { qa(root, s).forEach(fn); }
  function tg(b, a) { var v = b.getAttribute(a) !== 'true'; b.setAttribute(a, v); return v; }
  function onSeen(el, start, stop) {
    if (!('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else if (stop) stop(); }); }, { threshold: 0.3 }).observe(el);
  }

  // 닫기: 자리는 그대로 두고 감췄다가 잠시 뒤 다시 뜸(피그마에 없는 '다시 열기' 버튼 대신)
  function gone(el) {
    el.classList.add('is-gone'); clearTimeout(el.__t);
    el.__t = setTimeout(function () { el.classList.remove('is-gone'); el.style.animation = 'none'; el.offsetWidth; el.style.animation = ''; }, 1200);
  }

  // 1. 비밀번호 보기, 좌표·수치 입력은 숫자만
  each('.dx-eye[aria-pressed]', function (b) { var i = b.parentNode.querySelector('input'); b.addEventListener('click', function () { var s = tg(b, 'aria-pressed'); i.type = s ? 'text' : 'password'; b.setAttribute('aria-label', s ? '비밀번호 숨기기' : '비밀번호 보기'); }); });
  each('.dx-co input, .dx-eq-in input', function (i) { i.addEventListener('input', function () { var v = i.value.replace(/[^0-9.\-]/g, ''); if (v !== i.value) i.value = v; }); });

  // 2. 진행 표시: 0 → 100% 차오름(반복)
  each('[data-dx="prog"]', function (g) {
    var f = g.querySelector('.dx-prog-t i'), v = g.querySelector('.dx-prog-v'), raf = 0, t0 = 0, DUR = 3000, HOLD = 1300;
    function set(p) { f.style.width = p + '%'; v.textContent = p + '%'; g.setAttribute('aria-valuenow', p); }
    function tick(now) { if (!t0) t0 = now; var e = now - t0; if (e > DUR + HOLD) { t0 = now; e = 0; } var x = Math.min(1, e / DUR); set(Math.round((x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2) * 100)); raf = requestAnimationFrame(tick); }
    if (reduce) { set(50); return; }
    set(0); onSeen(g, function () { if (!raf) { t0 = 0; raf = requestAnimationFrame(tick); } }, function () { cancelAnimationFrame(raf); raf = 0; });
  });

  // 3. 드롭다운: 열고 고르기(바깥 클릭·ESC, 위·아래 키)
  each('[data-dx="dd"]', function (w) {
    var b = w.querySelector('.dx-dd-b'), l = w.querySelector('.dx-dd-l'), v = w.querySelector('.dx-dd-v'), opts = qa(l, '[role="option"]'), k = 0;
    function hl() { opts.forEach(function (o, i) { o.classList.toggle('is-kb', i === k); }); }
    function open(o) { b.setAttribute('aria-expanded', o); l.hidden = !o; if (o) { k = Math.max(0, opts.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; })); hl(); l.focus(); } }
    function pick(o) { opts.forEach(function (x) { x.setAttribute('aria-selected', x === o); }); v.textContent = o.textContent; open(false); b.focus(); }
    b.addEventListener('click', function () { open(l.hidden); });
    opts.forEach(function (o) { o.addEventListener('click', function () { pick(o); }); });
    l.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { k = Math.min(opts.length - 1, k + 1); hl(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { k = Math.max(0, k - 1); hl(); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ') { pick(opts[k]); e.preventDefault(); }
      else if (e.key === 'Escape') { open(false); b.focus(); }
    });
    document.addEventListener('click', function (e) { if (!w.contains(e.target) && !l.hidden) open(false); });
  });

  // 4. 누르면 켜지고 꺼지는 것들
  each('.dx-ann, .dx-head, .dx-onl:not(.is-static)', function (b) { b.addEventListener('click', function () { var on = tg(b, 'aria-pressed'); if (b.classList.contains('dx-onl')) b.querySelector('span').textContent = on ? 'Online' : 'Offline'; }); });
  each('.dx-radio', function (b) { b.addEventListener('click', function () { tg(b, 'aria-checked'); }); });
  each('.dx-hide', function (b) { b.addEventListener('click', function () { var o = tg(b, 'aria-expanded'); b.setAttribute('aria-label', o ? '패널 접기' : '패널 펼치기'); }); });
  each('[data-dx="radio"]', function (g) {
    var rs = qa(g, '[role="radio"]');
    rs.forEach(function (r, i) { r.addEventListener('click', function () { rs.forEach(function (x) { x.setAttribute('aria-checked', x === r); }); g.classList.toggle('is-2', i === 1); }); });
  });
  each('[data-dx="tab"]', function (t) { var bs = qa(t, '[role="tab"]'); bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.setAttribute('aria-selected', x === b); }); }); }); });
  each('[data-dx="spots"]', function (g) { var bs = qa(g, '.dx-spot:not(:disabled)'); bs.forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b && on); }); }); }); });

  // 5. 시나리오 버튼: 하위 메뉴(조건설정·흐름설정) 열기, 하위 메뉴 고르기
  each('[data-dx="sc"]', function (s) {
    var b = s.querySelector('.dx-sc-b'), m = s.querySelector('.dx-sc-m'), subs = qa(m, '.dx-sc-s');
    b.addEventListener('click', function () { m.hidden = !tg(b, 'aria-expanded'); });
    subs.forEach(function (x) { x.addEventListener('click', function () { subs.forEach(function (y) { y.classList.toggle('is-on', y === x); }); }); });
  });

  // 6. 다이얼로그: 버튼을 누르면 닫혔다가 잠시 뒤 다시 뜸, 토스트는 보이면 떠올랐다 사라짐(반복)
  each('[data-dx="dlg"]', function (st) {
    var d = st.querySelector('.dx-dlg');
    qa(d, '[data-close]').forEach(function (b) { b.addEventListener('click', function () { gone(d); }); });
  });
  each('[data-dx="toast"]', function (t) { if (reduce) return; onSeen(t, function () { t.classList.add('is-anim'); }, function () { t.classList.remove('is-anim'); }); });

  // 7. 상태 인디케이터: ✕ 로 닫으면 잠시 뒤 다시 뜸
  each('[data-dx="si"]', function (c) {
    c.querySelector('.dx-x').addEventListener('click', function () { gone(c); });
  });

  // 8. AI 챗봇: 보이면 안내 말풍선이 타이핑되고 이어서 질문이 올라옴(반복)
  each('[data-dx="ai"]', function (a) {
    var ms = qa(a, '.dx-ai-m'), timers = [];
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function cycle() {
      clear(); ms.forEach(function (m) { m.classList.add('is-wait'); });
      var bot = ms[0], p = bot.querySelector('p'), text = p.dataset.text, at = 300;
      timers.push(setTimeout(function () { bot.classList.remove('is-wait'); p.textContent = ''; p.classList.add('is-typing'); }, at));
      for (var i = 1; i <= text.length; i++) (function (n) { timers.push(setTimeout(function () { p.textContent = text.slice(0, n); }, at + 200 + n * 40)); })(i);
      at += 200 + text.length * 40;
      timers.push(setTimeout(function () { p.classList.remove('is-typing'); }, at + 50));
      timers.push(setTimeout(function () { ms[1].classList.remove('is-wait'); }, at + 900));
      timers.push(setTimeout(cycle, at + 4200));
    }
    if (reduce) return;
    onSeen(a, function () { if (!timers.length) cycle(); }, function () { clear(); ms.forEach(function (m) { m.classList.remove('is-wait'); var p = m.querySelector('p'); p.textContent = p.dataset.text; p.classList.remove('is-typing'); }); });
  });

  // 9. 패널 카드
  // 9-1. 실시간 장비상태: 장비 칸을 누르면 선택(한 대만, 다시 누르면 해제)
  each('.dx-k-es', function (g) {
    var bs = qa(g, '.dx-k-eq');
    bs.forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b && on); }); }); });
  });
  // 9-2. 시나리오 저장: 이름이 비면 확인 비활성, Enter = 확인, 취소·확인 → 닫혔다가 1.2초 뒤 다시 뜸(이름 원래대로)
  each('[data-dxk="dlg"]', function (d) {
    var i = d.querySelector('input'), ok = d.querySelector('[data-ok]'), v0 = i.value;
    function sync() { ok.disabled = !i.value.trim(); }
    i.addEventListener('input', sync);
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !ok.disabled) ok.click(); });
    qa(d, '[data-close]').forEach(function (b) {
      b.addEventListener('click', function () {
        d.classList.add('is-gone'); clearTimeout(d.__t);
        d.__t = setTimeout(function () { i.value = v0; sync(); d.classList.remove('is-gone'); }, 1200);
      });
    });
  });
  // 9-3. 관제 현황: 가동시간이 1초마다 올라감, 보이면 막대가 차오르고 숫자가 올라감, 접기 버튼 ↔ 접힌 탭
  each('[data-dxk="il"]', function (w) {
    var il = w.querySelector('.dx-k-il'), hide = w.querySelector('.dx-k-hide'), off = w.querySelector('.dx-k-off'), tm = 0;
    var bars = qa(w, '.dx-k-bar-t i');
    var clks = qa(w, '.dx-k-clk').map(function (c) { var p = c.textContent.split(':').map(function (x) { return parseInt(x, 10); }); return { el: c, s: ((p[0] * 24 + p[1]) * 60 + p[2]) * 60 + p[3] }; });
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function fmt(s) { return [pad(Math.floor(s / 86400)), pad(Math.floor(s / 3600) % 24), pad(Math.floor(s / 60) % 60), pad(s % 60)].join(' : '); }
    function tick() { clks.forEach(function (c) { c.s++; c.el.textContent = fmt(c.s); }); }
    function count() {
      qa(w, '.dx-k-big b[data-to]').forEach(function (b) {
        var to = +b.dataset.to, pd = +b.dataset.pad || 0, t0 = 0;
        function f(now) { if (!t0) t0 = now; var x = Math.min(1, (now - t0) / 900), s = String(Math.round(to * (1 - Math.pow(1 - x, 3)))); while (s.length < pd) s = '0' + s; b.textContent = s; if (x < 1) requestAnimationFrame(f); }
        requestAnimationFrame(f);
      });
    }
    function start() {
      if (!tm) tm = setInterval(tick, 1000);
      if (reduce) { il.classList.add('is-on'); return; }
      bars.forEach(function (i) { i.style.transition = 'none'; }); il.classList.remove('is-on'); il.offsetWidth;
      bars.forEach(function (i) { i.style.transition = ''; });
      requestAnimationFrame(function () { il.classList.add('is-on'); }); count();
    }
    function stop() { clearInterval(tm); tm = 0; }
    onSeen(w, start, stop);
    function set(open) { il.hidden = !open; hide.hidden = !open; off.hidden = open; (open ? hide : off).focus({ preventScroll: true }); if (open) start(); }
    hide.addEventListener('click', function () { set(false); });
    off.addEventListener('click', function () { set(true); });
  });

  // 패널 카드: 가운데 카드만 조작
  var cf = root.querySelector('.dx-cf');
  if (cf) qa(cf, '.cf-card').forEach(function (c) {
    var pn = c.querySelector('.dx-pn');
    function sync() { pn.inert = !c.classList.contains('is-center'); }
    new MutationObserver(sync).observe(c, { attributes: true, attributeFilter: ['class'] }); sync();
    pn.addEventListener('keydown', function (e) { e.stopPropagation(); });
  });
})();
