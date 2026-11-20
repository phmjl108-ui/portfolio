/* HD현대 XR(hd-xr) 실제 UI: 판의 부품과 카드 슬라이드 패널을 실제로 동작시키기 (view-hd-xr 안에서만) */
(function () {
  var root = document.getElementById('view-hd-xr'); if (!root) return;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function q(el, s) { return el.querySelector(s); }
  function each(s, fn) { qa(root, s).forEach(fn); }

  // 열린 목록 하나만: 바깥 누르기·Esc 로 닫기
  var openOne = null;
  function closeOpen() { if (openOne) { openOne(); openOne = null; } }
  document.addEventListener('pointerdown', function (e) { if (openOne && !(e.target.closest && e.target.closest('.is-open'))) closeOpen(); });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openOne) { closeOpen(); } });

  // 목록(listbox) 공통: 위·아래 키로 이동, Enter·Space 로 고르기
  function listKeys(list, opts, pick) {
    list.addEventListener('keydown', function (e) {
      var i = opts.indexOf(q(list, '.is-act')); if (i < 0) i = opts.indexOf(q(list, '[aria-selected="true"]'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); i = Math.max(0, Math.min(opts.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
        opts.forEach(function (o, k) { o.classList.toggle('is-act', k === i); });
      } else if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { e.preventDefault(); pick(opts[i]); }
    });
  }
  function select(opts, o) { opts.forEach(function (x) { x.setAttribute('aria-selected', x === o ? 'true' : 'false'); x.classList.remove('is-act'); }); }

  // 드롭다운(시점·언어): 버튼으로 열고 항목으로 고르기
  function popup(box, btn, list, onPick) {
    var opts = qa(list, '[role=option]');
    function shut() { list.hidden = true; box.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    function open() { closeOpen(); list.hidden = false; box.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); openOne = shut; list.focus({ preventScroll: true }); }
    btn.addEventListener('click', function () { if (list.hidden) open(); else { shut(); openOne = null; } });
    function pick(o) { select(opts, o); onPick(o); shut(); openOne = null; btn.focus({ preventScroll: true }); }
    opts.forEach(function (o) { o.addEventListener('click', function () { pick(o); }); });
    listKeys(list, opts, pick);
  }
  each('[data-hx="dd"]', function (dd) {
    var btn = q(dd, 'button'), v = q(dd, '.hx-dd-v');
    popup(dd, btn, q(dd, '.hx-dd-list'), function (o) { v.textContent = o.textContent.trim(); });
  });
  // 제어판 ▾: 카메라 회전·투명도 방식 고르기(고르면 옆 버튼이 선택 상태)
  each('[data-hx="cpd"]', function (g) {
    var main = q(g, '.hx-cb'), car = q(g, '.hx-cc');
    popup(g, car, q(g, '.hx-cp-list'), function (o) { main.setAttribute('aria-pressed', 'true'); main.setAttribute('title', o.textContent.trim()); });
  });

  // 1. 검색: 돋보기 → 입력칸 펼침, X → 닫힘
  each('[data-hx="search"]', function (s) {
    var op = q(s, '.hx-search-open'), box = q(s, '.hx-search-box'), inp = q(s, 'input'), x = q(s, '.hx-search-close');
    op.addEventListener('click', function () { op.hidden = true; box.hidden = false; op.setAttribute('aria-expanded', 'true'); inp.focus(); });
    x.addEventListener('click', function () { inp.value = ''; box.hidden = true; op.hidden = false; op.setAttribute('aria-expanded', 'false'); op.focus(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Escape') x.click(); });
  });

  // 3. 페이지 이동
  each('[data-hx="pager"]', function (p) {
    var ns = qa(p, '.hx-pg-n'), prev = q(p, '.hx-pg-prev'), next = q(p, '.hx-pg-next'), cur = 0;
    function set(k) { cur = Math.max(0, Math.min(ns.length - 1, k)); ns.forEach(function (b, i) { if (i === cur) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); prev.disabled = cur === 0; next.disabled = cur === ns.length - 1; }
    ns.forEach(function (b, i) { b.addEventListener('click', function () { set(i); }); });
    prev.addEventListener('click', function () { set(cur - 1); }); next.addEventListener('click', function () { set(cur + 1); });
    set(0);
  });

  // 5. 제어판 버튼: 누르면 선택(남색)·다시 누르면 해제, 초기화는 한 바퀴 회전
  each('.hx-cp > .hx-cb[aria-pressed], .hx-3d, .hx-btn-about', function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
  });
  each('.hx-cpd > .hx-cb', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); });
  function spin(b) { b.classList.remove('is-spin'); void b.offsetWidth; b.classList.add('is-spin'); }
  each('.hx-reload', function (b) {
    b.addEventListener('click', function () { spin(b); qa(b.closest('.hx-cp'), '[aria-pressed]').forEach(function (x, i) { x.setAttribute('aria-pressed', i === 1 ? 'true' : 'false'); }); });
  });

  // 7. 메뉴 버튼: 홈은 선택 토글, 알림은 누르면 빨간 점이 사라지고 선택 상태
  each('.hx-mb', function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
      if (b.classList.contains('hx-noti') && on) { b.classList.remove('is-new'); b.setAttribute('aria-label', '알림'); }
    });
  });

  // 설정 패널: 연결 다시 시도(깜빡이며 기다린 뒤 Connected ↔ Disconnected)
  each('[data-hx="conn"]', function (c) {
    var b = q(c, '.hx-rl'), v = q(c, '.hx-st-v'), t = 0;
    b.addEventListener('click', function () {
      spin(b); clearTimeout(t); c.classList.add('is-wait');
      t = setTimeout(function () { var on = !c.classList.contains('is-on'); c.classList.remove('is-wait'); c.classList.toggle('is-on', on); v.textContent = on ? 'Connected' : 'Disconnected'; }, 900);
    });
  });
  // IP 적용: 회전, 입력이 있으면 잠깐 적용 표시
  each('.hx-rl-t', function (b) {
    var row = b.closest('.hx-ipr');
    b.addEventListener('click', function () { spin(b); var ok = qa(row, 'input').some(function (i) { return i.value.trim(); }); row.classList.toggle('is-ok', ok); setTimeout(function () { row.classList.remove('is-ok'); }, 1200); });
  });
  // 글자 크기 슬라이더: 끌기·누르기·방향키
  each('[data-hx="slider"]', function (s) {
    var fill = q(s, '.hx-sl-fill'), th = q(s, '.hx-sl-th'), drag = false;
    function set(v) { v = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = v + '%'; th.style.left = v + '%'; s.setAttribute('aria-valuenow', v); }
    function at(e) { var r = s.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    s.addEventListener('pointerdown', function (e) { drag = true; s.classList.add('is-drag'); s.setPointerCapture(e.pointerId); at(e); e.preventDefault(); s.focus({ preventScroll: true }); });
    s.addEventListener('pointermove', function (e) { if (drag) at(e); });
    function up() { drag = false; s.classList.remove('is-drag'); }
    s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
    s.addEventListener('keydown', function (e) { var v = +s.getAttribute('aria-valuenow'); if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(v + 10); e.preventDefault(); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(v - 10); e.preventDefault(); } });
    set(50);
  });

  // 알림 목록 패널: 실제 스크롤 + 피그마 스크롤 막대(끌기·트랙 누르기)
  each('.hx-am', function (p) {
    var list = q(p, '.hx-am-list'), sb = q(p, '.hx-sb'), th = q(p, '.hx-sb-th'), drag = null;
    function sync() {
      var h = sb.clientHeight, ratio = list.clientHeight / list.scrollHeight, th_h = Math.max(32, Math.round(h * ratio));
      th.style.height = th_h + 'px';
      var max = list.scrollHeight - list.clientHeight; th.style.transform = 'translateY(' + (max ? list.scrollTop / max * (h - th_h) : 0) + 'px)';
      sb.style.visibility = ratio >= 1 ? 'hidden' : '';
    }
    list.addEventListener('scroll', sync, { passive: true });
    th.addEventListener('pointerdown', function (e) { drag = { y: e.clientY, s: list.scrollTop }; th.setPointerCapture(e.pointerId); sb.classList.add('is-drag'); e.preventDefault(); e.stopPropagation(); });
    th.addEventListener('pointermove', function (e) { if (!drag) return; var h = sb.clientHeight - th.offsetHeight; list.scrollTop = drag.s + (e.clientY - drag.y) / h * (list.scrollHeight - list.clientHeight); });
    function up() { drag = null; sb.classList.remove('is-drag'); }
    th.addEventListener('pointerup', up); th.addEventListener('pointercancel', up);
    sb.addEventListener('pointerdown', function (e) { e.stopPropagation(); if (e.target === th) return; var r = sb.getBoundingClientRect(); list.scrollTo({ top: (e.clientY - r.top) / r.height * list.scrollHeight - list.clientHeight / 2, behavior: 'smooth' }); });
    sync(); window.addEventListener('resize', sync);
  });

  // 카메라 회전 목록(패널): 누르거나 방향키로 고르기
  each('[data-hx="list"]', function (l) {
    var opts = qa(l, '[role=option]');
    function pick(o) { select(opts, o); }
    opts.forEach(function (o) { o.addEventListener('click', function () { pick(o); }); });
    listKeys(l, opts, pick);
  });

  // 라벨 메뉴: 누른 항목으로 왼쪽 원형 표시가 옮겨감
  each('.hx-lm', function (m) {
    var dot = q(m, '.hx-lm-dot'), its = qa(m, '[role=menuitemradio]');
    function place(b) { dot.style.top = (b.offsetTop + b.offsetHeight / 2 - 10 + q(m, '.hx-lm-list').offsetTop) + 'px'; }
    its.forEach(function (b) { b.addEventListener('click', function () { its.forEach(function (x) { x.setAttribute('aria-checked', x === b); }); place(b); }); });
    var back = q(m, '.hx-lm-back'); back.addEventListener('click', function () { var b = its[0]; its.forEach(function (x) { x.setAttribute('aria-checked', x === b); }); place(b); });
    var cur = q(m, '[aria-checked="true"]'); if (cur) place(cur);
  });

  // 카드 슬라이드: 가운데가 아닌 카드 안 부품은 포커스·클릭 안 되게(ds.js 의 .cf 가 is-center 를 바꿀 때 따라감)
  each('.hx-cf .cf-card', function (c) {
    var p = q(c, '.hx-p'); if (!p) return;
    function upd() { p.inert = !c.classList.contains('is-center'); if (p.inert && openOne && p.contains(document.activeElement)) closeOpen(); }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  });
  // 로그인 입력: 글자가 있으면 테두리 흰색(입력됨), 눈 버튼으로 비밀번호 보기/숨기기
  each('[data-hx="login"] .hx-in', function (l) {
    var inp = q(l, 'input'), eye = q(l, '.hx-eye');
    function upd() { l.classList.toggle('is-filled', !!inp.value); }
    inp.addEventListener('input', upd); upd();
    if (eye) eye.addEventListener('click', function () {
      var on = eye.getAttribute('aria-pressed') !== 'true';
      eye.setAttribute('aria-pressed', on ? 'true' : 'false'); eye.setAttribute('aria-label', on ? '비밀번호 숨기기' : '비밀번호 보기');
      inp.type = on ? 'text' : 'password'; inp.focus();
    });
  });

  // 아이디 저장 체크박스
  each('.hx-save', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); }); });

  // 원형 진행률: 화면에 보일 때 0→100% 차오르고 잠시 뒤 다시
  each('[data-hx="ring"]', function (r) {
    var c = q(r, '.hx-ring-f'), v = q(r, '.hx-ring-v'), n = 0, t = null, vis = false;
    function set(x) { c.setAttribute('stroke-dasharray', x + ' 100'); v.textContent = x + '%'; r.setAttribute('aria-valuenow', x); }
    function tick() { if (!vis) { t = null; return; } n = n >= 100 ? 0 : n + 1; set(n); t = setTimeout(tick, n === 100 ? 1200 : 28); }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { set(70); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !t) tick(); }).observe(r);
    else { vis = true; tick(); }
  });

  // 업데이트 진행 카드: 누르면 상세(On) ↔ 축소(Off), 처음 보일 때 막대가 현재 단계까지 차오름
  each('[data-hx="update"]', function (b) {
    var bar = q(b, '.hx-up-bar i'), w = bar.style.width; bar.style.width = '0';
    b.addEventListener('click', function () { b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); });
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { bar.style.width = w; io.disconnect(); } }); io.observe(b); } else bar.style.width = w;
  });
})();
