/* 디자인 시스템 판: 부품을 실제처럼 동작시키기
   - img[data-hover]  : 마우스를 올리면 Hover 상태 이미지
   - img[data-toggle] : 누를 때마다 두 상태를 오감(토글·탭·드롭다운 펼침 등)
   - img.dsb-i        : 누르는 동안 살짝 눌린 모션
   - .dsb-toast       : 화면에 보이면 체크가 나오고 글자가 타이핑됨(반복) */
(function () {
  function preload(u) { if (u) { var i = new Image(); i.src = u; } }

  function initImg(img) {
    if (img.__dsb) return; img.__dsb = 1;
    var base = img.getAttribute('src'), alt = img.dataset.toggle || null, hover = img.dataset.hover || null;
    var on = false; // 토글된 상태인지
    preload(alt); preload(hover);
    function rest() { return on ? alt : base; }
    if (hover) {
      img.addEventListener('mouseenter', function () { if (!on) img.src = hover; });
      img.addEventListener('mouseleave', function () { img.src = rest(); });
    }
    if (alt) {
      img.addEventListener('click', function () { on = !on; img.src = rest(); });
    }
    if (img.dataset.cycle) { // 누를 때마다 다음 상태(예: 기본 → 포커스 → 입력 중 → 입력됨)
      var list = img.dataset.cycle.split(','), k = 0;
      list.forEach(preload);
      img.addEventListener('click', function () { k = (k + 1) % list.length; img.src = list[k]; });
    }
  }

  // 상태 보기: 접힌 상태 이미지 펼치기/접기
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.dsx-btn'); if (!b) return;
    var p = document.getElementById(b.getAttribute('aria-controls')); if (!p) return;
    var open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.textContent = open ? '상태 접기' : '상태 보기';
    p.hidden = !open;
    if (open) p.querySelectorAll('img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; });
  });

  function typeToast(el) {
    if (el.__run) return; el.__run = 1;
    var tx = el.querySelector('.dsb-toast-tx'), text = el.dataset.text || '', timers = [];
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function cycle() {
      clear(); el.classList.remove('is-in'); tx.textContent = '';
      timers.push(setTimeout(function () { el.classList.add('is-in'); }, 400));
      for (var i = 1; i <= text.length; i++) {
        (function (n) { timers.push(setTimeout(function () { tx.textContent = text.slice(0, n); }, 900 + n * 120)); })(i);
      }
      timers.push(setTimeout(cycle, 900 + text.length * 120 + 2200));
    }
    el.__start = cycle; el.__stop = function () { clear(); el.__run = 0; };
    cycle();
  }

  function scan(root) {
    (root || document).querySelectorAll('.dsb img[data-hover], .dsb img[data-toggle], .dsb img[data-cycle]').forEach(initImg);
    var ts = (root || document).querySelectorAll('.dsb-toast');
    if (!('IntersectionObserver' in window)) { ts.forEach(typeToast); return; }
    var io = scan.io || (scan.io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) typeToast(e.target);
        else if (e.target.__stop) e.target.__stop();
      });
    }, { threshold: 0.4 }));
    ts.forEach(function (t) { io.observe(t); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); });
  else scan();
})();
