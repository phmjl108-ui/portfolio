/* 선박 XR 실제 UI 동작 — #view-ship-xr 안에서만 */
(function () {
  var root = document.getElementById('view-ship-xr'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function each(s, fn) { qa(root, s).forEach(fn); }
  function toggleAttr(b, a) { var v = b.getAttribute(a) !== 'true'; b.setAttribute(a, v); return v; }

  // 1. 입력: 칸 아무 데나 누르면 입력으로, 비밀번호 보기·숨기기
  each('.sh-in', function (box) { box.addEventListener('mousedown', function (e) { var i = box.querySelector('input'); if (e.target !== i && !e.target.closest('button')) { e.preventDefault(); i.focus(); } }); });
  each('.sh-eye', function (b) {
    var inp = b.parentNode.querySelector('input');
    b.addEventListener('click', function () { var s = toggleAttr(b, 'aria-pressed'); inp.type = s ? 'text' : 'password'; b.setAttribute('aria-label', s ? '비밀번호 숨기기' : '비밀번호 보기'); });
  });
  // 2. 아이디 저장 체크
  each('.sh-save', function (b) { b.addEventListener('click', function () { toggleAttr(b, 'aria-checked'); }); });
  // 3. 메뉴 검색: 글자가 있으면 지우기(✕) 버튼(피그마 Active 상태)
  each('[data-sh="search"]', function (l) {
    var inp = l.querySelector('input'), x = l.querySelector('.sh-search-x');
    function sync() { var v = !!inp.value; x.hidden = !v; l.classList.toggle('has-v', v); }
    inp.addEventListener('input', sync);
    x.addEventListener('click', function () { inp.value = ''; sync(); inp.focus(); });
  });
  // 4. 언어 선택: 열고 고르기(바깥 클릭·ESC 닫힘, 위·아래 키 이동)
  each('[data-sh="lang"]', function (w) {
    var b = w.querySelector('.sh-lang-b'), l = w.querySelector('.sh-lang-l'), opts = qa(l, '[role="option"]'), k = 0;
    function open(v) { b.setAttribute('aria-expanded', v); l.hidden = !v; if (v) { k = opts.findIndex(function (o) { return o.getAttribute('aria-selected') === 'true'; }); hl(); l.focus(); } }
    function hl() { opts.forEach(function (o, i) { o.classList.toggle('is-kb', i === k); }); }
    function pick(o) { opts.forEach(function (x) { x.setAttribute('aria-selected', x === o); }); open(false); b.focus(); }
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
  // 5. 페이지 구분 탭
  each('[data-sh="tabs"]', function (t) {
    var tabs = qa(t, '[role="tab"]');
    tabs.forEach(function (b) { b.addEventListener('click', function () { tabs.forEach(function (x) { x.setAttribute('aria-selected', x === b); }); }); });
  });
  // 6. 스크롤 마크·재생·이름표 토글
  each('.sh-mark', function (b) { b.addEventListener('click', function () { toggleAttr(b, 'aria-pressed'); }); });
  each('.sh-play:not(:disabled)', function (b) { b.addEventListener('click', function () { var p = toggleAttr(b, 'aria-pressed'); b.setAttribute('aria-label', p ? '일시정지' : '재생'); }); });
  each('.sh-tag', function (b) { b.addEventListener('click', function () { var on = toggleAttr(b, 'aria-pressed'); b.querySelector('span').textContent = on ? '이름표 숨기기' : '이름표 표시하기'; }); });
  // 7. 상세 항목: 누르면 선택(체크) ↔ 해제
  each('[data-sh="detail"] .sh-det', function (b) { b.addEventListener('click', function () { toggleAttr(b, 'aria-pressed'); }); });
  // 8. 사이드바: 1·2단계는 펼치기·접기, 3단계는 고르기
  each('[data-sh="side"]', function (s) {
    qa(s, '.sh-si1, .sh-si2').forEach(function (b) {
      b.addEventListener('click', function () { var li = b.parentNode, g = li.querySelector(':scope > ul'); var o = toggleAttr(li, 'aria-expanded'); if (g && g.children.length) g.hidden = !o; });
    });
    var leaves = qa(s, '.sh-si3');
    leaves.forEach(function (b) { b.addEventListener('click', function () { leaves.forEach(function (x) { x.parentNode.setAttribute('aria-selected', x === b); }); }); });
  });
  // 9. 시스템 팝업: 버튼을 누르면 닫히고(자리 유지) 잠시 뒤 다시 뜸 — 피그마에 없는 '다시 열기' 버튼은 두지 않음
  each('[data-sh="pop"]', function (st) {
    var pop = st.querySelector('.sh-pop'), t = 0;
    qa(pop, '[data-close]').forEach(function (b) { b.addEventListener('click', function () {
      pop.classList.add('is-gone'); clearTimeout(t);
      t = setTimeout(function () { pop.classList.remove('is-gone'); pop.style.animation = 'none'; pop.offsetWidth; pop.style.animation = ''; }, 1200);
    }); });
  });

  // 10. 미니맵: 머리 줄 버튼으로 접기·펼치기, 투명도 슬라이더(끌기·방향키)
  each('[data-sh="mm"]', function (m) {
    var dd = m.querySelector('.sh-dd'), body = m.querySelector('.sh-mm-b'), img = m.querySelector('.sh-mm-img img');
    dd.addEventListener('click', function () {
      var open = toggleAttr(dd, 'aria-expanded'); dd.setAttribute('aria-label', open ? '미니맵 접기' : '미니맵 펼치기');
      var h = body.scrollHeight;
      if (reduce) { body.style.height = open ? '' : '0px'; body.classList.toggle('is-shut', !open); return; }
      if (open) { body.classList.remove('is-shut'); body.style.height = '0px'; body.offsetHeight; body.style.height = h + 'px'; setTimeout(function () { if (dd.getAttribute('aria-expanded') === 'true') body.style.height = ''; }, 320); }
      else { body.style.height = h + 'px'; body.offsetHeight; body.style.height = '0px'; setTimeout(function () { if (dd.getAttribute('aria-expanded') !== 'true') body.classList.add('is-shut'); }, 320); }
    });
    var sl = m.querySelector('.sh-sl'), f = sl.querySelector('.sh-sl-f'), t = sl.querySelector('.sh-sl-t'), out = m.querySelector('output'), v = 100, drag = false;
    function set(x) { v = Math.max(0, Math.min(100, Math.round(x))); f.style.width = v + '%'; t.style.left = v + '%'; out.textContent = v + ' %'; sl.setAttribute('aria-valuenow', v); img.style.opacity = (0.15 + 0.85 * v / 100).toFixed(2); }
    function fromX(e) { var r = sl.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    sl.addEventListener('pointerdown', function (e) { drag = true; sl.classList.add('is-drag'); sl.setPointerCapture(e.pointerId); fromX(e); e.preventDefault(); });
    sl.addEventListener('pointermove', function (e) { if (drag) fromX(e); });
    function up() { drag = false; sl.classList.remove('is-drag'); }
    sl.addEventListener('pointerup', up); sl.addEventListener('pointercancel', up);
    sl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(v + 5); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(v - 5); e.preventDefault(); }
      else if (e.key === 'Home') { set(0); e.preventDefault(); } else if (e.key === 'End') { set(100); e.preventDefault(); }
    });
    set(100);
  });
  // 11. 3D 조작 버튼: 하나 고르면 활성(#D9EBFF), ✕ 로 접고 + 로 펼침
  each('[data-sh="cbar"]', function (c) {
    var rs = qa(c, '[role="radio"]'), x = c.querySelector('.sh-cb-x');
    rs.forEach(function (b) { b.addEventListener('click', function () { rs.forEach(function (o) { o.setAttribute('aria-checked', o === b); }); }); });
    x.addEventListener('click', function () { var open = toggleAttr(x, 'aria-expanded'); c.classList.toggle('is-off', !open); x.setAttribute('aria-label', open ? '조작 버튼 닫기' : '조작 버튼 열기'); rs.forEach(function (b) { b.tabIndex = open ? 0 : -1; }); });
  });
  // 12. 장비 라벨: 누르면 Active ↔ Default (Hover 는 CSS)
  each('[data-sh="eq"] .sh-eq', function (eq) { eq.addEventListener('click', function () { toggleAttr(eq, 'aria-pressed'); }); });

  // 패널 카드: 가운데 카드만 조작
  var cf = root.querySelector('.sh-cf');
  if (cf) qa(cf, '.cf-card').forEach(function (c) {
    var pn = c.querySelector('.sh-pn');
    function sync() { pn.inert = !c.classList.contains('is-center'); }
    new MutationObserver(sync).observe(c, { attributes: true, attributeFilter: ['class'] }); sync();
    pn.addEventListener('keydown', function (e) { e.stopPropagation(); });
  });
})();
