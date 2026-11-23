/* 정비 VR 실제 UI 동작 — #view-vr-maintenance 안에서만 */
(function () {
  var root = document.getElementById('view-vr-maintenance'); if (!root) return;
  function each(s, fn) { [].forEach.call(root.querySelectorAll(s), fn); }

  // 선택형 버튼(팝업·주기·키워드·기본·리스트·장비 카드): 누를 때마다 선택 ↔ 해제
  each('.vb [data-vb="toggle"]', function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
  });

  // 메뉴 버튼 묶음: 하나만 선택(다시 누르면 해제)
  each('.vb-mnbar', function (bar) {
    var bs = [].slice.call(bar.querySelectorAll('.vb-mn'));
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        bs.forEach(function (o) { o.setAttribute('aria-pressed', o === b && on); });
      });
    });
  });

  // 로딩 표시: 화면에 보일 때만 회전
  each('.vb-ind', function (el) {
    if (!('IntersectionObserver' in window)) { el.classList.add('is-run'); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { el.classList.toggle('is-run', e.isIntersecting); }); }, { threshold: 0.1 }).observe(el);
  });
})();

/* 2026-11-23 Components 팝업 카드(.vc-cf) 동작 — 카드 슬라이드는 ds.js 의 .cf 공용 코드 */
(function () {
  var root = document.getElementById('view-vr-maintenance'); if (!root) return;
  var cf = root.querySelector('.vc-cf'); if (!cf) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function each(s, fn, el) { [].forEach.call((el || cf).querySelectorAll(s), fn); }
  function q(el, s) { return el.querySelector(s); }

  // 옆 카드 안 부품은 포커스·클릭 안 됨(가운데 카드만)
  each('.cf-card', function (c) {
    var p = q(c, '.cf-panel');
    function sync() { p.inert = !c.classList.contains('is-center'); }
    new MutationObserver(sync).observe(c, { attributes: true, attributeFilter: ['class'] }); sync();
  });

  // 닫기·Yes·No·Next·뒤로 → 닫히는 모션 후 1.2초 뒤 다시 뜸
  each('.cf-panel', function (p) {
    each('[data-close]', function (b) { b.addEventListener('click', function () {
      p.classList.add('is-closed'); clearTimeout(p.__rt);
      p.__rt = setTimeout(function () { p.classList.remove('is-closed'); }, 1200);
    }); }, p);
  });

  // 정비 목록: 부위(키워드)·주기 하나씩 선택, 초기화, 학습률 차오름
  each('.vc-ml', function (ml) {
    function single(sel) {
      var bs = [].slice.call(ml.querySelectorAll(sel));
      bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
      return bs;
    }
    var kws = single('.vc-kws .vb-kw'), cys = single('.vc-cys .vb-cy');
    var rs = q(ml, '.vc-reset');
    rs.addEventListener('click', function () {
      kws.concat(cys).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      rs.classList.remove('is-spin'); void rs.offsetWidth; rs.classList.add('is-spin');
    });
    var nums = [].slice.call(ml.querySelectorAll('[data-count]')), card = ml.closest('.cf-card'), was = false;
    function run() {
      nums.forEach(function (n) {
        var to = +n.dataset.count, suf = n.dataset.suf || '', t0 = 0;
        if (reduce) { n.textContent = to + suf; return; }
        function tick(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 900); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
      });
    }
    new MutationObserver(function () { var c = card.classList.contains('is-center'); if (c && !was) run(); was = c; }).observe(card, { attributes: true, attributeFilter: ['class'] });
  });

  // 정비 항목: 줄 누르면 완료 표시 전환, 머리글로 정렬, 오른쪽 이동 버튼으로 목록 스크롤
  each('.vc-si-p', function (p) {
    var list = q(p, '.vc-sil');
    each('.vc-si', function (r) { r.addEventListener('click', function () { r.setAttribute('aria-pressed', r.getAttribute('aria-pressed') !== 'true'); }); }, p);
    each('.vc-sort', function (b) { b.addEventListener('click', function () {
      var desc = b.dataset.dir !== 'desc'; b.dataset.dir = desc ? 'desc' : 'asc';
      var rows = [].slice.call(list.children), k = b.dataset.k;
      rows.sort(function (a, c) {
        var x = k === 'nm' ? q(a, '.nm').textContent : +a.dataset.i, y = k === 'nm' ? q(c, '.nm').textContent : +c.dataset.i;
        return (k === 'nm' ? x.localeCompare(y) : x - y) * (desc ? -1 : 1);
      });
      rows.forEach(function (r) { list.appendChild(r); });
    }); }, p);
    var step = 76;
    q(p, '.vc-top').addEventListener('click', function () { list.scrollTop = 0; });
    q(p, '.vc-up').addEventListener('click', function () { list.scrollTop -= step; });
    q(p, '.vc-dn').addEventListener('click', function () { list.scrollTop += step; });
  });
})();
