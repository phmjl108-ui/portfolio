/* AR 가이던스(ar-guidance) 실제 UI: 판의 부품과 카드 슬라이드 패널을 실제로 동작시키기 (view-ar-guidance 안에서만) */
(function () {
  var root = document.getElementById('view-ar-guidance'); if (!root) return;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function q(el, s) { return el.querySelector(s); }
  function each(s, fn) { qa(root, s).forEach(fn); }

  var openOne = null;
  function closeOpen() { if (openOne) { openOne(); openOne = null; } }
  document.addEventListener('pointerdown', function (e) { if (openOne && !(e.target.closest && e.target.closest('.is-open'))) closeOpen(); });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openOne) closeOpen(); });

  // 드롭다운(언어·VOC 유형): 열고 고르기, 위·아래 키
  each('[data-ag="dd"]', function (dd) {
    var btn = q(dd, 'button'), list = q(dd, '[role=listbox]'), v = q(dd, '.ag-dd-v'), opts = qa(list, '[role=option]');
    function shut() { list.hidden = true; dd.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    function open() { closeOpen(); list.hidden = false; dd.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); openOne = shut; list.focus({ preventScroll: true }); }
    function pick(o) { opts.forEach(function (x) { x.setAttribute('aria-selected', x === o ? 'true' : 'false'); x.classList.remove('is-act'); }); v.textContent = o.textContent.trim(); dd.classList.add('has-v'); shut(); openOne = null; btn.focus({ preventScroll: true }); }
    btn.addEventListener('click', function () { if (list.hidden) open(); else { shut(); openOne = null; } });
    opts.forEach(function (o) { o.addEventListener('click', function () { pick(o); }); });
    list.addEventListener('keydown', function (e) {
      var i = opts.indexOf(q(list, '.is-act')); if (i < 0) i = opts.indexOf(q(list, '[aria-selected="true"]'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = Math.max(0, Math.min(opts.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))); opts.forEach(function (o, k) { o.classList.toggle('is-act', k === i); }); }
      else if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { e.preventDefault(); pick(opts[i]); }
    });
  });

  // 수치 입력: 숫자만 받아 00:00:00 꼴로 자동 정리
  each('.ag-num input', function (inp) {
    function fmt() { var d = inp.value.replace(/\D/g, '').slice(0, 6), o = ''; for (var i = 0; i < d.length; i++) { if (i && i % 2 === 0) o += ':'; o += d[i]; } inp.value = o; inp.classList.toggle('is-v', o.length > 0); }
    inp.addEventListener('input', fmt); fmt();
  });

  // 체크(토글), 라디오 묶음(라디오·세그먼트·기능 목록)
  each('.ag-chk, .ag-ckb', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); }); });
  each('[data-ag="radio"]', function (g) {
    var rs = qa(g, '[role=radio]');
    function set(r) { rs.forEach(function (x) { x.setAttribute('aria-checked', x === r ? 'true' : 'false'); x.tabIndex = x === r ? 0 : -1; }); }
    rs.forEach(function (r, i) {
      r.addEventListener('click', function () { set(r); });
      r.addEventListener('keydown', function (e) { var k = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (!k) return; e.preventDefault(); var n = rs[(i + k + rs.length) % rs.length]; set(n); n.focus(); });
    });
  });
  each('.ag-tg, .ag-ib[aria-pressed], .ag-start[aria-pressed], .ag-gd', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); });

  // 탭
  each('[data-ag="tabs"]', function (t) {
    var ts = qa(t, '[role=tab]');
    ts.forEach(function (x) { x.addEventListener('click', function () { ts.forEach(function (y) { y.setAttribute('aria-selected', y === x ? 'true' : 'false'); }); }); });
  });

  // 키 안내: 누르는 동안 주황(마우스·터치), 키보드 W·Shift 도 따라감(판이 화면에 보일 때만)
  each('[data-ag="keys"]', function (g) {
    var ks = qa(g, '.ag-key'), vis = false;
    function on(k, v) { if (k) k.setAttribute('aria-pressed', v ? 'true' : 'false'); }
    ks.forEach(function (k) {
      k.addEventListener('pointerdown', function () { on(k, true); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { k.addEventListener(ev, function () { on(k, false); }); });
      k.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') on(k, true); });
      k.addEventListener('keyup', function () { on(k, false); });
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(g);
    function find(e) { var n = e.key === 'Shift' ? 'shift' : (e.key || '').toLowerCase() === 'w' ? 'w' : ''; return n && q(g, '[data-key="' + n + '"]'); }
    document.addEventListener('keydown', function (e) { if (!vis || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return; on(find(e), true); });
    document.addEventListener('keyup', function (e) { on(find(e), false); });
  });

  // 단계 표시: 누르면 현재 단계(주황) ↔ 기본
  each('[data-ag="steps"]', function (s) {
    var bs = qa(s, '.ag-step');
    bs.forEach(function (b) { b.addEventListener('click', function () { if (bs.length === 1) { if (b.hasAttribute('aria-current')) b.removeAttribute('aria-current'); else b.setAttribute('aria-current', 'step'); return; } bs.forEach(function (x) { if (x === b) x.setAttribute('aria-current', 'step'); else x.removeAttribute('aria-current'); }); }); });
  });

  // VOC 팝업: 사진 칸 + 누르면 사진 추가(빈 칸이 채워짐), 사진 누르면 선택, 휴지통은 선택 사진 삭제
  each('[data-ag="attach"]', function (a) {
    var slots = qa(a, '.ag-thumb'), del = q(a, '.ag-del'), img = slots[0].style.backgroundImage;
    function upd() { del.disabled = !q(a, '.ag-thumb.is-sel'); }
    slots.forEach(function (t, i) {
      t.addEventListener('click', function () {
        if (!t.classList.contains('is-img')) { t.classList.add('is-img', 'is-new'); t.style.backgroundImage = img; t.setAttribute('aria-label', '첨부 사진 ' + (i + 1) + ' 선택'); t.setAttribute('aria-pressed', 'false'); if (!q(t, '.ag-tck')) { var c = slots[0].querySelector('.ag-tck').cloneNode(true); t.appendChild(c); } setTimeout(function () { t.classList.remove('is-new'); }, 300); }
        else { var s = !t.classList.contains('is-sel'); t.classList.toggle('is-sel', s); t.setAttribute('aria-pressed', s); }
        upd();
      });
    });
    del.addEventListener('click', function () { slots.forEach(function (t) { if (t.classList.contains('is-sel')) { t.classList.remove('is-img', 'is-sel'); t.style.backgroundImage = ''; t.removeAttribute('aria-pressed'); t.setAttribute('aria-label', '사진 추가'); } }); upd(); });
    upd();
  });
  each('.ag-voc', function (f) {
    var ap = q(f, '.ag-apply'), cn = q(f, '.ag-bt-s');
    cn.addEventListener('click', function () { qa(f, 'input:not([readonly]), textarea').forEach(function (i) { i.value = ''; }); f.classList.remove('is-sent'); });
    ap.addEventListener('click', function () { f.classList.add('is-sent'); });
  });

  // 사전 점검 팝업: 네 항목을 모두 체크해야 Confirm 활성(피그마 Btn - Apply Disabled 상태 사용)
  each('[data-ag="allcheck"]', function (p) {
    var cs = qa(p, '.ag-ckb'), b = q(p, '.ag-confirm');
    function upd() { var ok = cs.every(function (c) { return c.getAttribute('aria-checked') === 'true'; }); if (b.disabled === ok) { b.disabled = !ok; p.classList.toggle('is-ok', ok); } }
    cs.forEach(function (c) { c.addEventListener('click', function () { setTimeout(upd, 0); }); }); upd();
  });

  // 카드 슬라이드: 가운데가 아닌 카드 안 부품은 포커스·클릭 안 되게
  each('.ag-cf .cf-card', function (c) {
    var p = q(c, '.ag-p'); if (!p) return;
    function upd() { p.inert = !c.classList.contains('is-center'); }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  });
})();
