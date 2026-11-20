/* NHN Edu MCU 마약 예방 VR 실제 UI 동작 — #view-mcu 안에서만 (접두사 mb-) */
(function () {
  var root = document.getElementById('view-mcu'); if (!root) return;
  function each(s, fn) { [].slice.call(root.querySelectorAll(s)).forEach(fn); }

  // 체크박스: 누르면 선택(#0f95ff) ↔ 해제(#cecece)
  each('.mb-chk', function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    });
  });

  // 키보드(Enter·Space)로 눌러도 피그마 'Pressed 90% Scale' 이 보이게
  each('.mb-btn', function (b) {
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') b.classList.add('is-press'); });
    b.addEventListener('keyup', function () { b.classList.remove('is-press'); });
    b.addEventListener('blur', function () { b.classList.remove('is-press'); });
  });
})();
