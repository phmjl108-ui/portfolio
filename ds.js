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

/* 패널 3D 카드 슬라이드: 드래그·스와이프·가로 휠·화살표·점·카드 누르기로 이동, 가운데 카드 제목 줄로 접기·펼치기 */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.cf').forEach(function (cf) {
    var stage = cf.querySelector('.cf-stage'), cards = [].slice.call(cf.querySelectorAll('.cf-card')), dots = [].slice.call(cf.querySelectorAll('.cf-dots button'));
    var prev = cf.querySelector('.cf-prev'), next = cf.querySelector('.cf-next');
    var n = cards.length, pos = 0, target = 0, raf = 0, GAP = 260;
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function render() {
      cards.forEach(function (c, i) {
        var d = i - pos, ad = Math.abs(d), sd = clamp(d, -1, 1);
        c.style.transform = 'translateY(-50%) translateX(' + (d * GAP) + 'px) translateZ(' + (-ad * 120) + 'px) rotateY(' + (sd * 30) + 'deg) scale(' + Math.max(0.6, 1 - ad * 0.2) + ')';
        c.style.filter = 'brightness(' + (1 - Math.min(ad, 3) * 0.15) + ')';
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.classList.toggle('is-center', ad < 0.5);
      });
      var k = Math.round(clamp(pos, 0, n - 1));
      dots.forEach(function (b, i) { b.classList.toggle('is-on', i === k); b.setAttribute('aria-current', i === k ? 'true' : 'false'); });
      prev.disabled = target <= 0; next.disabled = target >= n - 1;
    }
    function tick() {
      var diff = target - pos;
      if (reduce || Math.abs(diff) < 0.001) { pos = target; render(); raf = 0; return; }
      pos += diff * 0.14; render(); raf = requestAnimationFrame(tick);
    }
    function go(k) { target = clamp(Math.round(k), 0, n - 1); if (!raf) raf = requestAnimationFrame(tick); }
    prev.addEventListener('click', function () { go(target - 1); });
    next.addEventListener('click', function () { go(target + 1); });
    dots.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    cf.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(target - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(target + 1); e.preventDefault(); }
    });

    // 드래그·스와이프: 끄는 만큼 돌아가고, 놓으면 가까운 카드로(빠르게 밀면 한 장 더)
    var down = false, sx = 0, sp = 0, moved = 0, lastX = 0, lastT = 0, vel = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      down = true; moved = 0; sx = lastX = e.clientX; lastT = performance.now(); sp = pos; vel = 0;
      stage.setPointerCapture(e.pointerId); stage.classList.add('is-drag'); cancelAnimationFrame(raf); raf = 0;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      var now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
      pos = clamp(sp - dx / GAP, -0.4, n - 0.6); target = pos; render();
    });
    function up(e) {
      if (!down) return;
      down = false; stage.classList.remove('is-drag');
      if (moved < 6) { // 누르기: 옆 카드면 가운데로, 가운데 카드 제목 줄이면 접기·펼치기
        stage.releasePointerCapture && stage.releasePointerCapture(e.pointerId);
        var el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest('.cf-card');
        if (c && !c.classList.contains('is-center')) { go(+c.dataset.i); return; }
        var hd = el && el.closest('.cf-head'); if (hd) toggle(hd);
        go(target); return;
      }
      go(pos - vel * 0.35);
    }
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    // 가로 휠(트랙패드 좌우)만 사용, 세로 스크롤은 그대로 둠
    var wheelT = 0;
    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); var now = Date.now(); if (now - wheelT < 350) return;
      wheelT = now; go(target + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });

    // 제목 줄: 접기·펼치기(피그마 On·Off 상태)
    function toggle(head) {
      var c = head.closest('.cf-card'); if (!c.classList.contains('is-center')) return;
      var pnl = head.parentNode, img = pnl.querySelector('img'), open = head.getAttribute('aria-expanded') !== 'true';
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      img.src = open ? pnl.dataset.on : pnl.dataset.off;
    }
    cards.forEach(function (c) {
      var pnl = c.querySelector('.cf-panel'), head = pnl.querySelector('.cf-head');
      new Image().src = pnl.dataset.off;
      head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { toggle(head); e.preventDefault(); } });
    });
    render();
  });
})();
