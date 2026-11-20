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
