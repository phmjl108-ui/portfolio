/* 철도연 디지털 트윈(krri-dt) 패널 카드 동작 — #view-krri-dt 의 .kc-cf 안에서만 */
(function () {
  var root = document.getElementById('view-krri-dt'); if (!root) return;
  var cf = root.querySelector('.kc-cf'); if (!cf) return;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function each(s, fn) { qa(cf, s).forEach(fn); }

  // 숫자 입력칸: 숫자·음수·소수점만
  function numOnly(i) { i.addEventListener('input', function () { var v = i.value.replace(/[^0-9.\-]/g, '').replace(/(?!^)-/g, '').replace(/(\..*)\./g, '$1'); if (v !== i.value) i.value = v; }); }

  // 드롭다운: 열고 고르기(바깥 누르기·Esc 로 닫기, 위·아래 키)
  var openDd = null;
  function wireDd(w) {
    var b = w.querySelector('.kc-dd-b'), l = w.querySelector('.kc-dd-l'), v = w.querySelector('.kc-dd-v'), opts = qa(l, '[role=option]'), k = 0;
    function hl() { opts.forEach(function (o, i) { o.classList.toggle('is-kb', i === k); }); }
    function open(o) { if (o && openDd && openDd !== close) openDd(); b.setAttribute('aria-expanded', o); l.hidden = !o; openDd = o ? close : null; if (o) { k = Math.max(0, opts.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; })); hl(); l.focus({ preventScroll: true }); } }
    function close() { open(false); }
    function pick(o) { opts.forEach(function (x) { x.setAttribute('aria-selected', x === o); }); v.textContent = o.textContent; w.classList.add('has-v'); open(false); b.focus(); }
    b.addEventListener('click', function () { open(l.hidden); });
    opts.forEach(function (o) { o.addEventListener('click', function () { pick(o); }); });
    l.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { k = Math.min(opts.length - 1, k + 1); hl(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { k = Math.max(0, k - 1); hl(); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ') { pick(opts[k]); e.preventDefault(); }
      else if (e.key === 'Escape') { open(false); b.focus(); }
    });
    w.__reset = function () { pick(opts[0]); w.classList.remove('has-v'); b.blur(); };
  }
  document.addEventListener('mousedown', function (e) { if (openDd && !e.target.closest('.kc-dd')) openDd(); });

  // 1. 신규 시나리오 등록: 섹션 접기·펼치기, 구간 추가·삭제(번호 다시 매김), 숫자만 입력,
  //    시작 위치 ≥ 종료 위치면 두 칸 오류(빨강), 시나리오명이 있어야 '시나리오 등록' 활성, 초기화, 닫기·등록 → 1.2초 뒤 다시 뜸
  each('[data-kc="md"]', function (m) {
    var body = m.querySelector('.kc-md-b'), sb = m.querySelector('.kc-sb'), th = sb.querySelector('i'), name = m.querySelector('.kc-name'), ok = m.querySelector('.kc-ok');
    var tpls = {};
    qa(m, '.kc-rows').forEach(function (r) { tpls[r.dataset.tpl] = r.firstElementChild.cloneNode(true); });
    function wireRow(row) {
      qa(row, 'input').forEach(function (i) { numOnly(i); i.addEventListener('input', function () { check(row); }); });
      qa(row, '[data-kc="dd"]').forEach(wireDd);
      row.querySelector('.kc-del').addEventListener('click', function () {
        var rows = row.parentNode;
        if (rows.children.length === 1) { qa(row, 'input').forEach(function (i) { i.value = ''; }); qa(row, '[data-kc="dd"]').forEach(function (d) { d.__reset(); }); check(row); return; }
        row.remove(); renum(rows); sync();
      });
    }
    function check(row) {
      var ins = qa(row, '.kc-in'), a = ins[0].querySelector('input').value, b = ins[1].querySelector('input').value;
      var bad = a !== '' && b !== '' && !isNaN(+a) && !isNaN(+b) && +a >= +b;
      ins[0].classList.toggle('is-err', bad); ins[1].classList.toggle('is-err', bad);
    }
    function renum(rows) { qa(rows, '.kc-no').forEach(function (n, i) { n.textContent = i + 1; }); }
    qa(m, '.kc-row').forEach(wireRow);
    qa(m, '.kc-add').forEach(function (b) {
      b.addEventListener('click', function () {
        var rows = b.closest('.kc-sec-b').querySelector('.kc-rows'), r = tpls[rows.dataset.tpl].cloneNode(true);
        r.classList.add('is-new'); rows.appendChild(r); wireRow(r); renum(rows); sync();
        var f = r.querySelector('input'); if (f) f.focus({ preventScroll: true }); r.scrollIntoView({ block: 'nearest' });
      });
    });
    qa(m, '.kc-sec-h button').forEach(function (b) {
      var sec = document.getElementById(b.getAttribute('aria-controls'));
      b.addEventListener('click', function () { var o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', o); sec.hidden = !o; sync(); });
    });
    function valid() { ok.disabled = !name.value.trim(); }
    name.addEventListener('input', valid);
    function reset() {
      name.value = '';
      qa(m, '.kc-rows').forEach(function (rows) { while (rows.children.length > 1) rows.lastElementChild.remove(); });
      qa(m, '.kc-row input').forEach(function (i) { i.value = ''; });
      qa(m, '.kc-in.is-err').forEach(function (i) { i.classList.remove('is-err'); });
      qa(m, '[data-kc="dd"]').forEach(function (d) { d.__reset(); });
      qa(m, '.kc-sec-h button').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); document.getElementById(b.getAttribute('aria-controls')).hidden = false; });
      body.scrollTop = 0; valid(); sync();
    }
    m.querySelector('.kc-reset').addEventListener('click', reset);
    function gone() { m.classList.add('is-gone'); clearTimeout(m.__t); m.__t = setTimeout(function () { reset(); m.classList.remove('is-gone'); }, 1200); }
    m.querySelector('.kc-x').addEventListener('click', gone);
    ok.addEventListener('click', gone);
    // 스크롤 막대(피그마 Scrollbar 4px): 내용에 맞춰 크기·위치, 끌기·트랙 누르기
    var drag = null;
    function sync() {
      var h = sb.clientHeight, r = body.clientHeight / body.scrollHeight, t = Math.max(40, Math.round(h * Math.min(1, r))), max = body.scrollHeight - body.clientHeight;
      th.style.height = t + 'px'; th.style.transform = 'translateY(' + (max > 0 ? body.scrollTop / max * (h - t) : 0) + 'px)'; sb.style.visibility = r >= 1 ? 'hidden' : '';
    }
    body.addEventListener('scroll', sync, { passive: true });
    th.addEventListener('pointerdown', function (e) { drag = { y: e.clientY, s: body.scrollTop }; th.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
    th.addEventListener('pointermove', function (e) { if (!drag) return; var z = parseFloat(getComputedStyle(m.parentNode).zoom) || 1; body.scrollTop = drag.s + (e.clientY - drag.y) / z / (sb.clientHeight - th.offsetHeight) * (body.scrollHeight - body.clientHeight); });
    th.addEventListener('pointerup', function () { drag = null; });
    sb.addEventListener('pointerdown', function (e) { if (e.target === th) return; e.stopPropagation(); var r = sb.getBoundingClientRect(); body.scrollTo({ top: (e.clientY - r.top) / r.height * body.scrollHeight - body.clientHeight / 2, behavior: 'smooth' }); });
    if (window.ResizeObserver) new ResizeObserver(sync).observe(body.firstElementChild);
    valid(); sync();
  });

  // 2·3. 오른쪽 패널: 제목 줄 버튼으로 접기·펼치기(높이 애니메이션)
  each('[data-kc="pn"]', function (p) {
    var b = p.querySelector('.kc-tg'), body = p.querySelector('.kc-pn-b'), title = p.querySelector('.kc-pn-t').textContent;
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open); b.setAttribute('aria-label', title + (open ? ' 접기' : ' 펼치기'));
      var h = body.scrollHeight; p.classList.toggle('is-off', !open);
      if (open) { body.classList.remove('is-shut'); body.style.height = '0px'; body.offsetHeight; body.style.height = h + 'px'; }
      else { body.style.height = h + 'px'; body.offsetHeight; body.style.height = '0px'; }
      clearTimeout(body.__t); body.__t = setTimeout(function () { if (open) body.style.height = ''; else body.classList.add('is-shut'); }, 320);
    });
  });

  // 3. 설계 변경 이력: 표 본문 실제 스크롤 + 피그마 스크롤 막대(끌기·트랙 누르기)
  each('.kc-dh', function (p) {
    var s = p.querySelector('.kc-dh-s'), sb = p.querySelector('.kc-dh-sb'), th = sb.querySelector('i'), drag = null;
    function sync() {
      var h = sb.clientHeight, r = s.clientHeight / s.scrollHeight, t = Math.max(32, Math.round(h * Math.min(1, r))), max = s.scrollHeight - s.clientHeight;
      th.style.height = t + 'px'; th.style.transform = 'translateY(' + (max > 0 ? s.scrollTop / max * (h - t) : 0) + 'px)';
    }
    s.addEventListener('scroll', sync, { passive: true });
    th.addEventListener('pointerdown', function (e) { drag = { y: e.clientY, s: s.scrollTop }; th.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
    th.addEventListener('pointermove', function (e) { if (drag) s.scrollTop = drag.s + (e.clientY - drag.y) / (sb.clientHeight - th.offsetHeight) * (s.scrollHeight - s.clientHeight); });
    th.addEventListener('pointerup', function () { drag = null; });
    sb.addEventListener('pointerdown', function (e) { if (e.target === th) return; e.stopPropagation(); var r = sb.getBoundingClientRect(); s.scrollTo({ top: (e.clientY - r.top) / r.height * s.scrollHeight - s.clientHeight / 2, behavior: 'smooth' }); });
    if (window.ResizeObserver) new ResizeObserver(sync).observe(s); sync();
  });

  // 4. 차량 시스템 선택: 누르면 그 차량이 눌린 상태(피그마 Pressed), 하나만
  each('[data-kc="gw"]', function (g) {
    var bs = qa(g, '.kc-gw-b');
    bs.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', function () { bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
  });

  // 카드 슬라이드: 가운데가 아닌 카드 안 부품은 포커스·클릭 안 되게, 패널 안 방향키는 부품이 씀
  qa(cf, '.cf-card').forEach(function (c) {
    var p = c.querySelector('.kc-pnl');
    function upd() { p.inert = !c.classList.contains('is-center'); if (p.inert && openDd) openDd(); }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
    p.addEventListener('keydown', function (e) { e.stopPropagation(); });
  });
})();
