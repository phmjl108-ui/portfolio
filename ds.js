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
        var center = ad < 0.5;
        if (c.classList.contains('is-center') !== center || c.__c === undefined) {
          c.classList.toggle('is-center', center); c.__c = center;
          var live = c.querySelector('.kp'); if (live) live.inert = !center; // 옆 카드 안 부품은 포커스·클릭 안 됨
        }
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
      if (e.target.closest && e.target.closest('.kp')) return; // 패널 안 부품의 방향키는 부품이 씀
      if (e.key === 'ArrowLeft') { go(target - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(target + 1); e.preventDefault(); }
    });

    // 드래그·스와이프: 끄는 만큼 돌아가고, 놓으면 가까운 카드로(빠르게 밀면 한 장 더)
    var down = false, sx = 0, sp = 0, moved = 0, lastX = 0, lastT = 0, vel = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      // 가운데 카드 안의 부품(버튼·입력·목록·슬라이더)을 누르면 드래그를 시작하지 않고 클릭을 그대로 부품에 넘김
      var cc = e.target.closest && e.target.closest('.cf-card.is-center');
      if (cc && e.target.closest('button, input, select, textarea, a, label, [role=option], [role=slider], [role=listbox], [tabindex], table')) return;
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
      if (!head) return; // 실제 HTML 패널(.kp)은 아래 '철도연 패널' 스크립트가 접기·펼치기를 맡음
      new Image().src = pnl.dataset.off;
      head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { toggle(head); e.preventDefault(); } });
    });
    render();
  });
})();

/* 철도연 실제 UI: 디자인 시스템 판의 부품을 진짜로 동작시키기(입력·드롭다운·토글·세그먼트·페이지·슬라이더·트리·리스트·툴팁·표) */
(function () {
  function each(sel, fn, root) { (root || document).querySelectorAll(sel).forEach(fn); }
  function q(el, sel) { return el.querySelector(sel); }
  function qa(el, sel) { return [].slice.call(el.querySelectorAll(sel)); }

  // 1. 비밀번호 보기/숨기기
  each('.kr .kr-eye', function (b) {
    var inp = b.parentNode.querySelector('input');
    b.addEventListener('click', function () {
      var show = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', show); b.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기');
      inp.type = show ? 'text' : 'password';
    });
  });

  // 열고 닫는 목록 공통: 바깥 클릭·ESC 로 닫힘, 위·아래 키로 이동, Enter/Space 로 고름
  var openers = [];
  function popup(root, btn, panel, opts, onPick) {
    var act = -1;
    function isOpen() { return btn.getAttribute('aria-expanded') === 'true'; }
    function mark(i) { act = i; opts.forEach(function (o, k) { o.classList.toggle('is-act', k === i); }); if (opts[i]) opts[i].scrollIntoView && opts[i].scrollIntoView({ block: 'nearest' }); }
    function open(v) {
      btn.setAttribute('aria-expanded', v); panel.hidden = !v; root.classList.toggle('is-open', v);
      if (v) { var s = opts.findIndex(function (o) { return o.getAttribute('aria-selected') === 'true'; }); mark(s < 0 ? 0 : s); (panel.getAttribute('role') === 'listbox' ? panel : panel.querySelector('[role=listbox]')).focus({ preventScroll: true }); }
      else mark(-1);
    }
    function pick(i) { opts.forEach(function (o, k) { o.setAttribute('aria-selected', k === i); }); onPick(opts[i]); open(false); btn.focus(); }
    btn.addEventListener('click', function () { open(!isOpen()); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(true); } });
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { pick(i); });
      o.addEventListener('mouseenter', function () { mark(i); });
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(Math.min(opts.length - 1, act + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(0, act - 1)); }
      else if (e.key === 'Home') { e.preventDefault(); mark(0); }
      else if (e.key === 'End') { e.preventDefault(); mark(opts.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (act >= 0) pick(act); }
      else if (e.key === 'Tab') open(false);
    });
    openers.push({ root: root, isOpen: isOpen, close: function (focus) { open(false); if (focus) btn.focus(); } });
  }
  document.addEventListener('mousedown', function (e) { openers.forEach(function (p) { if (p.isOpen() && !p.root.contains(e.target)) p.close(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openers.forEach(function (p) { if (p.isOpen()) p.close(true); }); });

  // 3. 드롭다운(속도)
  each('.kr[data-kr="dd"]', function (dd) {
    var btn = q(dd, '.kr-dd-btn'), list = q(dd, '.kr-dd-list'), v = q(dd, '.kr-dd-v');
    popup(dd, btn, list, qa(list, '.kr-dd-opt'), function (o) { v.textContent = o.textContent; dd.classList.add('has-v'); });
  });
  // 12. 업무영역 선택
  each('.kr[data-kr="sp"]', function (sp) {
    var btn = q(sp, '.kr-sp-btn'), panel = q(sp, '.kr-sp-panel'), v = q(sp, '.kr-sp-v');
    popup(sp, btn, panel, qa(panel, '.kr-li'), function (o) { v.textContent = o.textContent; });
  });

  // 6. 뷰어 버튼: 회전·확대·축소는 하나만 선택(다시 누르면 해제), 재생↔일시정지, 정지
  each('.kr[data-kr="viewer"]', function (g) {
    var modes = qa(g, '.kr-vbtn'), play = q(g, '.kr-play'), stop = q(g, '.kr-stop');
    modes.forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; modes.forEach(function (o) { o.setAttribute('aria-pressed', o === b && on); }); }); });
    play.addEventListener('click', function () { var on = play.getAttribute('aria-pressed') !== 'true'; play.setAttribute('aria-pressed', on); play.setAttribute('aria-label', on ? '일시정지' : '재생'); stop.setAttribute('aria-pressed', 'false'); });
    stop.addEventListener('click', function () { play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-label', '재생'); stop.setAttribute('aria-pressed', 'true'); });
  });

  // 7. 토글 스위치
  each('.kr .kr-sw', function (s) { s.addEventListener('click', function () { if (!s.disabled) s.setAttribute('aria-checked', s.getAttribute('aria-checked') !== 'true'); }); });

  // 8. 세그먼트: 단일 선택 + 좌우 방향키
  each('.kr[data-kr="radio"], .kr [data-kr="radio"]', function (g) {
    var bs = qa(g, '[role=radio]');
    function sel(b) { bs.forEach(function (o) { o.setAttribute('aria-checked', o === b); o.tabIndex = o === b ? 0 : -1; }); }
    bs.forEach(function (b) {
      b.addEventListener('click', function () { sel(b); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (!d) return;
        e.preventDefault(); var ok = bs.filter(function (o) { return !o.disabled; }), k = ok.indexOf(b), n = ok[(k + d + ok.length) % ok.length]; sel(n); n.focus();
      });
    });
    sel(bs.filter(function (o) { return o.getAttribute('aria-checked') === 'true'; })[0] || bs[0]);
  });

  // 9. 상태 표시·범례: 누르면 켜짐/꺼짐
  each('.kr[data-kr="press"] [aria-pressed]', function (b) {
    b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); if (b.dataset.on) b.textContent = on ? b.dataset.on : b.dataset.off; });
  });

  // 10. 페이지 이동: 전체 n쪽을 5개씩, ‹ › 한 쪽씩, « » 5쪽 묶음씩
  each('.kr[data-kr="pager"]', function (p) {
    var n = +p.dataset.pages || 10, per = +p.dataset.per || 5, cur = 1, bs = qa(p, '[data-p]');
    function go(k) {
      cur = Math.max(1, Math.min(n, k));
      var start = Math.floor((cur - 1) / per) * per + 1;
      bs.forEach(function (b, i) { var num = start + i; b.hidden = num > n; b.textContent = num; b.dataset.p = num; b.setAttribute('aria-label', num + '쪽'); if (num === cur) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    }
    p.addEventListener('click', function (e) {
      var b = e.target.closest('[data-p],[data-go]'); if (!b) return;
      var start = Math.floor((cur - 1) / per) * per + 1;
      if (b.dataset.p) go(+b.dataset.p); else go({ first: start - per, prev: cur - 1, next: cur + 1, last: start + per }[b.dataset.go]);
    });
    go(1);
  });

  // 11. 슬라이더: 드래그·클릭·방향키(1씩, Shift 10씩)·Home/End
  each('.kr[data-kr="slider"]', function (s) {
    var tr = q(s, '.kr-sl-track'), fill = q(s, '.kr-sl-fill'), th = q(s, '.kr-sl-thumb'), val = q(s, '.kr-sl-val'), drag = false;
    function set(v) { v = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = v + '%'; th.style.left = 'calc(8px + (100% - 16px) * ' + (v / 100) + ')'; th.setAttribute('aria-valuenow', v); th.setAttribute('aria-valuetext', v + '%'); val.textContent = v + '%'; s.dataset.value = v; }
    function at(e) { var r = tr.getBoundingClientRect(); set((e.clientX - r.left - 8) / (r.width - 16) * 100); }
    tr.addEventListener('pointerdown', function (e) { drag = true; tr.setPointerCapture(e.pointerId); at(e); th.focus({ preventScroll: true }); e.preventDefault(); });
    tr.addEventListener('pointermove', function (e) { if (drag) at(e); });
    tr.addEventListener('pointerup', function () { drag = false; });
    tr.addEventListener('pointercancel', function () { drag = false; });
    th.addEventListener('keydown', function (e) {
      var v = +s.dataset.value, st = e.shiftKey ? 10 : 1, m = { ArrowRight: v + st, ArrowUp: v + st, ArrowLeft: v - st, ArrowDown: v - st, PageUp: v + 10, PageDown: v - 10, Home: 0, End: 100 };
      if (e.key in m) { set(m[e.key]); e.preventDefault(); }
    });
    set(+s.dataset.value || 0);
  });

  // 13. 트리: 누르면 선택 + 펼침·접힘, 눈 아이콘은 보이기/숨기기, 키보드(위·아래·좌·우·Enter)
  each('.kr[data-kr="tree"]', function (t) {
    var items = qa(t, '[role=treeitem]');
    function visible() { return items.filter(function (li) { return li.offsetParent !== null; }); }
    function focusItem(li) { items.forEach(function (o) { o.tabIndex = o === li ? 0 : -1; }); li.focus(); }
    function toggle(li, v) { var g = li.querySelector(':scope > ul'); if (!g) return; if (v === undefined) v = li.getAttribute('aria-expanded') !== 'true'; li.setAttribute('aria-expanded', v); g.hidden = !v; }
    function select(li) { items.forEach(function (o) { o.setAttribute('aria-selected', o === li); }); }
    items.forEach(function (li) {
      var row = li.querySelector(':scope > .kr-tn'), vis = row.querySelector('.kr-vis');
      row.addEventListener('click', function (e) {
        if (e.target.closest('.kr-vis')) return;
        select(li); toggle(li); focusItem(li);
      });
      vis.addEventListener('click', function () { var on = vis.getAttribute('aria-pressed') !== 'true'; vis.setAttribute('aria-pressed', on); var nm = row.querySelector('span').textContent; vis.setAttribute('aria-label', nm + (on ? ' 보이기' : ' 숨기기')); });
      li.addEventListener('keydown', function (e) {
        if (e.target !== li) return;
        var vs = visible(), k = vs.indexOf(li), ex = li.getAttribute('aria-expanded');
        if (e.key === 'ArrowDown' && vs[k + 1]) focusItem(vs[k + 1]);
        else if (e.key === 'ArrowUp' && vs[k - 1]) focusItem(vs[k - 1]);
        else if (e.key === 'ArrowRight') { if (ex === 'false') toggle(li, true); else if (ex === 'true') focusItem(li.querySelector('[role=treeitem]')); }
        else if (e.key === 'ArrowLeft') { if (ex === 'true') toggle(li, false); else { var p = li.parentNode.closest('[role=treeitem]'); if (p) focusItem(p); } }
        else if (e.key === 'Enter' || e.key === ' ') { select(li); toggle(li); }
        else if (e.key === 'v' || e.key === 'V') row.querySelector('.kr-vis').click();
        else return;
        e.preventDefault();
      });
    });
    if (items[0]) items[0].tabIndex = 0;
  });

  // 14. 리스트: 한 항목 선택(체크), 위·아래 키
  each('.kr[data-kr="list"]', function (l) {
    var os = qa(l, '[role=option]'), act = -1;
    function mark(i) { act = i; os.forEach(function (o, k) { o.classList.toggle('is-act', k === i); }); }
    function sel(i) { os.forEach(function (o, k) { o.setAttribute('aria-selected', k === i); }); }
    os.forEach(function (o, i) { o.addEventListener('click', function () { sel(i); mark(-1); }); });
    l.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') mark(Math.min(os.length - 1, act + 1));
      else if (e.key === 'ArrowUp') mark(Math.max(0, act - 1));
      else if ((e.key === 'Enter' || e.key === ' ') && act >= 0) sel(act);
      else return;
      e.preventDefault();
    });
    l.addEventListener('blur', function () { mark(-1); });
  });

  // 15. 툴팁: 정보 아이콘에 마우스를 올리거나 키보드 포커스 시 표시, ESC 로 닫힘
  each('.kr[data-kr="tip"]', function (t) {
    var b = q(t, '.kr-tt-i');
    function on(v) { t.classList.toggle('is-on', v); }
    b.addEventListener('mouseenter', function () { on(true); });
    b.addEventListener('mouseleave', function () { if (document.activeElement !== b) on(false); });
    b.addEventListener('focus', function () { on(true); });
    b.addEventListener('blur', function () { on(false); });
    b.addEventListener('click', function () { on(!t.classList.contains('is-on')); });
    b.addEventListener('keydown', function (e) { if (e.key === 'Escape') on(false); });
  });

  // 16. 표: 행 hover, 누르면 한 행 선택(다시 누르면 해제). 아이콘 버튼은 행 선택과 따로
  each('.kr[data-kr="table"]', function (w) {
    var rows = qa(w, 'tbody tr');
    function sel(r) { var on = r.getAttribute('aria-selected') !== 'true'; rows.forEach(function (o) { o.setAttribute('aria-selected', o === r && on); }); }
    rows.forEach(function (r) {
      r.addEventListener('click', function (e) { if (!e.target.closest('button')) sel(r); });
      r.addEventListener('keydown', function (e) {
        if (e.target !== r) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(r); }
        else if (e.key === 'ArrowDown' && r.nextElementSibling) { e.preventDefault(); r.nextElementSibling.focus(); }
        else if (e.key === 'ArrowUp' && r.previousElementSibling) { e.preventDefault(); r.previousElementSibling.focus(); }
      });
    });
  });
})();

/* 철도연 패널(카드 슬라이드 안 실제 HTML): 제목 줄 ∧ 로 접기·펼치기(높이 애니메이션), 센서 그래프, 데이터 표시 ON/OFF */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.kp').forEach(function (p) {
    var tg = p.querySelector('.kp-tg'), body = p.querySelector('.kp-body'), name = p.querySelector('.kp-t').textContent;
    tg.addEventListener('click', function () {
      var open = tg.getAttribute('aria-expanded') !== 'true';
      tg.setAttribute('aria-expanded', open); tg.setAttribute('aria-label', name + (open ? ' 접기' : ' 펼치기'));
      p.classList.toggle('is-off', !open);
      var h = body.scrollHeight;
      if (reduce) { body.style.height = open ? '' : '0px'; body.classList.toggle('is-shut', !open); return; }
      if (open) {
        body.classList.remove('is-shut'); body.style.height = '0px'; body.offsetHeight; body.style.height = h + 'px';
        body.addEventListener('transitionend', function f(e) { if (e.target !== body) return; body.removeEventListener('transitionend', f); if (tg.getAttribute('aria-expanded') === 'true') body.style.height = ''; });
      } else {
        body.style.height = h + 'px'; body.offsetHeight; body.style.height = '0px';
        body.addEventListener('transitionend', function f(e) { if (e.target !== body) return; body.removeEventListener('transitionend', f); if (tg.getAttribute('aria-expanded') !== 'true') body.classList.add('is-shut'); });
      }
    });
  });

  // 센서 패널: 부품·센서 종류·계측 방향·위치가 바뀌면 그래프 모양과 속도 값이 바뀜(피그마 선 모양을 기준으로 변형)
  document.querySelectorAll('.kp[data-kp="0"]').forEach(function (p) {
    var line = p.querySelector('.kp-line'), val = p.querySelector('.kp-gv');
    var BASE = [64.35, 56.16, 60.84, 52.65, 46.8, 50.31, 43.29, 49.14, 40.95, 35.1, 39.78, 32.76, 37.44, 29.25, 33.93, 25.74, 30.42, 23.4, 28.08, 66.5];
    var STEP = 14.4641;
    function key() {
      var s = [p.querySelector('.kr-dd-v').textContent];
      p.querySelectorAll('[role=radio][aria-checked="true"]').forEach(function (b) { s.push(b.textContent); });
      return s.join('|');
    }
    function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function draw() {
      var k = key(), h = hash(k), first = k === '선택|변위|수직 (Z)|전위 우';
      var amp = 0.6 + (h % 70) / 100, ph = (h >> 8) % 628 / 100, sh = ((h >> 16) % 25) - 12;
      var d = BASE.map(function (y, i) {
        var yy = first ? y : (i === BASE.length - 1 ? y : 69.5 + (y - 69.5) * amp + Math.sin(i * 0.9 + ph) * 6 + sh * (i / BASE.length));
        return (i ? 'L' : 'M') + (i === BASE.length - 1 ? 273.11 : +(i * STEP).toFixed(2)) + ' ' + Math.max(4, Math.min(136, yy)).toFixed(2);
      }).join('');
      line.setAttribute('d', d);
      val.textContent = (first ? 182 : 150 + h % 140) + 'km/h';
    }
    p.addEventListener('click', function (e) { if (e.target.closest('[role=radio], [role=option]')) setTimeout(draw, 0); });
    p.addEventListener('keydown', function () { setTimeout(draw, 0); });
  });

  // 구조해석 패널: 데이터 표시 ON/OFF — OFF 면 그라데이션 막대·세그먼트 비활성
  document.querySelectorAll('.kp .kp-onoff').forEach(function (b) {
    var box = b.closest('.kp-sa').querySelector('.kp-sa-b');
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on); b.textContent = on ? 'ON' : 'OFF';
      box.classList.toggle('is-off', !on);
      box.querySelectorAll('button').forEach(function (x) { x.disabled = !on; });
    });
  });
})();
