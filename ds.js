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
    if (img.dataset.s) { // 자리는 고정, 바뀐 상태 이미지는 제 크기로 위에 겹쳐 그림
      var sc = +img.dataset.s;
      img.addEventListener('load', function () { img.style.width = (img.naturalWidth / sc) + 'px'; img.style.height = 'auto'; });
    }
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

/* 철도연 디자인 시스템: 슬라이더·페이지 이동·트리·툴팁·표 행 선택, 누른 부품을 맨 위로 */
(function () {
  var Z = 10;
  document.addEventListener('mousedown', function (e) {
    var h = e.target.closest && e.target.closest('.dsx-hold, .dsx-tree, .dsx-tip');
    if (h) h.style.zIndex = ++Z;
  });

  function each(sel, fn) { document.querySelectorAll(sel).forEach(fn); }

  // 슬라이더: 드래그·클릭·방향키
  each('.dsx-slider', function (s) {
    var tr = s.querySelector('.dsx-sl-track'), fill = s.querySelector('.dsx-sl-fill'), th = s.querySelector('.dsx-sl-thumb'), val = s.querySelector('.dsx-sl-val');
    function set(v) { v = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = v + '%'; th.style.left = v + '%'; th.setAttribute('aria-valuenow', v); if (val) val.textContent = v + '%'; s.dataset.value = v; }
    function at(x) { var r = tr.getBoundingClientRect(); set((x - r.left) / r.width * 100); }
    var drag = false;
    s.addEventListener('pointerdown', function (e) { drag = true; s.setPointerCapture(e.pointerId); at(e.clientX); e.preventDefault(); });
    s.addEventListener('pointermove', function (e) { if (drag) at(e.clientX); });
    s.addEventListener('pointerup', function () { drag = false; });
    th.addEventListener('keydown', function (e) { var v = +s.dataset.value; if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(v + 5); e.preventDefault(); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(v - 5); e.preventDefault(); } });
    set(+s.dataset.value || 0);
  });

  // 페이지 이동: 전체 n쪽을 5개씩 보여 줌. 번호 누르기, ‹ › 한 쪽씩, « » 5쪽 묶음씩
  each('.dsx-pager', function (p) {
    var n = +p.dataset.pages || 10, per = +p.dataset.per || 5, cur = 1, bs = p.querySelectorAll('.dsx-pg');
    function go(k) {
      cur = Math.max(1, Math.min(n, k));
      var start = Math.floor((cur - 1) / per) * per + 1;
      bs.forEach(function (b, i) { var num = start + i; b.hidden = num > n; b.textContent = num; b.dataset.p = num; var on = num === cur; b.classList.toggle('is-on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    }
    p.addEventListener('click', function (e) {
      var b = e.target.closest('[data-p],[data-go]'); if (!b) return;
      var start = Math.floor((cur - 1) / per) * per + 1;
      if (b.dataset.p) go(+b.dataset.p);
      else go({ first: start - per, prev: cur - 1, next: cur + 1, last: start + per }[b.dataset.go]);
    });
    go(1);
  });

  // 트리: 항목을 누르면 선택, 하위가 있으면 펼침·접힘(1단계 → 2단계 → 3단계)
  each('.dsx-tree', function (t) {
    var items = t.querySelectorAll('.dsx-tn');
    function paint(k) { k.src = k.classList.contains('is-sel') ? (k.dataset.sel || k.dataset.base) : (k.classList.contains('is-open') && k.dataset.open ? k.dataset.open : k.dataset.base); }
    items.forEach(function (k) {
      var kids = k.dataset.kids ? t.querySelector('#' + k.dataset.kids) : null;
      k.addEventListener('mouseenter', function () { if (!k.classList.contains('is-sel')) k.src = k.dataset.hover; });
      k.addEventListener('mouseleave', function () { paint(k); });
      k.addEventListener('click', function () {
        if (kids) { var open = !k.classList.contains('is-open'); k.classList.toggle('is-open', open); kids.hidden = !open; }
        items.forEach(function (o) { if (o !== k) { o.classList.remove('is-sel'); paint(o); } });
        k.classList.add('is-sel'); paint(k);
      });
    });
  });

  // 툴팁: 정보 아이콘에 마우스를 올리거나 누르면 표시
  each('.dsx-tip', function (t) {
    var hit = t.querySelector('.dsx-tip-hit');
    hit.addEventListener('mouseenter', function () { t.classList.add('is-on'); });
    hit.addEventListener('mouseleave', function () { t.classList.remove('is-on'); });
    hit.addEventListener('click', function () { t.classList.toggle('is-on'); });
  });

  // 표: 행 Hover, 누르면 선택(한 행)
  each('.dsx-table', function (tb) {
    var rows = tb.querySelectorAll('.dsx-r');
    rows.forEach(function (r) { r.addEventListener('click', function () { rows.forEach(function (o) { o.classList.toggle('is-sel', o === r && !r.classList.contains('is-sel')); }); }); });
  });
})();
