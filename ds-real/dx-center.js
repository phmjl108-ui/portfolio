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

  // 6. 다이얼로그: 버튼을 누르면 닫히고 '다시 열기', 토스트는 보이면 떠올랐다 사라짐(반복)
  each('[data-dx="dlg"]', function (st) {
    var d = st.querySelector('.dx-dlg'), re = st.querySelector('.dx-reopen');
    qa(d, '[data-close]').forEach(function (b) { b.addEventListener('click', function () { d.hidden = true; re.hidden = false; re.focus(); }); });
    re.addEventListener('click', function () { re.hidden = true; d.hidden = false; d.querySelector('.dx-p').focus(); });
  });
  each('[data-dx="toast"]', function (t) { if (reduce) return; onSeen(t, function () { t.classList.add('is-anim'); }, function () { t.classList.remove('is-anim'); }); });

  // 7. 상태 인디케이터: ✕ 로 닫고 다시 열기
  each('[data-dx="si"]', function (c) {
    var re = c.parentNode.querySelector('.dx-reopen');
    c.querySelector('.dx-x').addEventListener('click', function () { c.hidden = true; re.hidden = false; re.focus(); });
    re.addEventListener('click', function () { re.hidden = true; c.hidden = false; });
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

  // 9. 장비 정보 패널(카드): ✕ 로 닫고 다시 열기
  each('[data-dx="ep"]', function (p) {
    var h = p.querySelector('.dx-ep-h'), b = p.querySelector('.dx-ep-b'), c = p.querySelector('.dx-ep-closed');
    p.querySelector('.dx-x').addEventListener('click', function () { h.hidden = b.hidden = true; c.hidden = false; c.querySelector('button').focus(); });
    c.querySelector('button').addEventListener('click', function () { h.hidden = b.hidden = false; c.hidden = true; });
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
