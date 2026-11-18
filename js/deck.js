/* 장면 넘김 — 첫 화면(.view-landing)의 .scene 을 휠·키·터치 한 번에 한 칸씩 넘긴다.
   장면이 화면보다 길면 그 안에서 한 화면씩 내려간 뒤 다음 장면으로 넘어간다.
   모바일 폭·'동작 줄이기' 설정·상세 화면에서는 평범한 스크롤. 주소(#)는 어느 쪽이든 현재 장면을 따라간다. */
(function () {
  var DUR = 750;                 // 넘김 시간(ms)
  var WHEEL_MIN = 24;            // 이만큼 굴려야 한 칸
  var IDLE = 180;                // 관성 스크롤이 멈췄다고 볼 간격(ms)
  var mqMobile = window.matchMedia('(max-width: 768px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;

  function scenes() { return Array.prototype.slice.call(document.querySelectorAll('#view-landing .scene')); }
  function onLanding() { return document.body.dataset.view === 'landing'; }
  function barH() { var b = document.getElementById('topbar'); return b ? b.offsetHeight : 0; }
  function deckOn() { return onLanding() && !mqMobile.matches && !mqReduce.matches; }
  function blocked() {
    return document.getElementById('loader') ||
      document.querySelector('.lightbox.open') ||
      /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
  }

  // 멈출 위치 목록: 각 장면 시작 + 긴 장면 안의 중간 지점
  function stops() {
    var vh = window.innerHeight, step = vh - barH(), max = root.scrollHeight - vh, out = [];
    scenes().forEach(function (s) {
      // 칸 수가 정해진 장면(프로젝트 넘겨보기)은 칸마다 멈춤
      if (s.dataset.steps && window.ComposeScene && s.id === 'compose') {
        window.ComposeScene.steps().forEach(function (y) { out.push({ y: Math.min(y, max), id: s.dataset.scene }); });
        return;
      }
      var top = s.offsetTop, end = top + s.offsetHeight - vh;
      var y = top;
      out.push({ y: Math.min(top, max), id: s.dataset.scene });
      while (y + step < end) { y += step; out.push({ y: Math.min(y, max), id: s.dataset.scene }); }
      if (end > top && end > y) out.push({ y: Math.min(end, max), id: s.dataset.scene });
    });
    return out.filter(function (p, i) { return i === 0 || p.y > out[i - 1].y + 2; });
  }
  function nearest(list) {
    var y = window.scrollY, best = 0;
    list.forEach(function (p, i) { if (Math.abs(p.y - y) < Math.abs(list[best].y - y)) best = i; });
    return best;
  }

  // 부드러운 이동
  var anim = null, lastWheel = 0;
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function scrollToY(y, instant) {
    if (anim) cancelAnimationFrame(anim.raf);
    root.style.scrollBehavior = 'auto';
    if (instant) { window.scrollTo(0, y); root.style.scrollBehavior = ''; anim = null; return; }
    var from = window.scrollY, t0 = performance.now();
    anim = {};
    (function frame(now) {
      var p = Math.min((now - t0) / DUR, 1);
      window.scrollTo(0, from + (y - from) * ease(p));
      if (p < 1) anim.raf = requestAnimationFrame(frame); else { anim = null; root.style.scrollBehavior = ''; }
    })(t0);
  }
  function move(dir) {
    var list = stops(), i = nearest(list);
    // 현재 위치가 멈춤 지점 사이면, 가는 방향의 가장 가까운 지점부터
    if (dir > 0 && list[i].y > window.scrollY + 2) i--;
    if (dir < 0 && list[i].y < window.scrollY - 2) i++;
    var j = Math.max(0, Math.min(list.length - 1, i + dir));
    if (list[j].y !== window.scrollY) scrollToY(list[j].y);
  }

  // 휠
  var acc = 0, wheelLocked = false;
  window.addEventListener('wheel', function (e) {
    if (!deckOn() || e.ctrlKey) return;
    e.preventDefault();
    if (blocked()) return;
    var now = performance.now(), gap = now - lastWheel;
    lastWheel = now;
    if (anim) return;                              // 넘기는 중
    if (wheelLocked) { if (gap < IDLE) return; wheelLocked = false; }  // 관성 꼬리 무시
    acc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (Math.abs(acc) >= WHEEL_MIN) { move(acc > 0 ? 1 : -1); acc = 0; wheelLocked = true; }
  }, { passive: false });

  // 키보드
  window.addEventListener('keydown', function (e) {
    if (!deckOn() || blocked() || e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key, dir = 0;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) dir = 1;
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) dir = -1;
    else if (k === 'Home' || k === 'End') {
      e.preventDefault(); var l = stops(); scrollToY(k === 'Home' ? 0 : l[l.length - 1].y); return;
    } else return;
    e.preventDefault();
    if (!anim) move(dir);
  });

  // 터치(태블릿 가로 등 넓은 터치 화면)
  var ty = null;
  window.addEventListener('touchstart', function (e) { ty = deckOn() ? e.touches[0].clientY : null; }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (ty !== null && !blocked()) e.preventDefault(); }, { passive: false });
  window.addEventListener('touchend', function (e) {
    if (ty === null || blocked()) return;
    var dy = ty - e.changedTouches[0].clientY; ty = null;
    if (Math.abs(dy) > 50 && !anim) move(dy > 0 ? 1 : -1);
  }, { passive: true });

  // 주소(#) 동기화 — 화면 가운데에 걸친 장면
  var current = null, ticking = false;
  function syncHash() {
    ticking = false;
    if (!onLanding()) { current = null; return; }
    var mid = window.scrollY + window.innerHeight / 2, id = null;
    scenes().forEach(function (s) { if (s.offsetTop <= mid) id = s.dataset.scene; });
    var all = scenes();
    if (all.length && window.scrollY >= root.scrollHeight - window.innerHeight - 2) id = all[all.length - 1].dataset.scene;  // 맨 아래면 마지막 장면
    if (!id || id === current) return;
    current = id;
    var url = location.pathname + location.search + (id === 'top' ? '' : '#' + id);
    history.replaceState(null, '', url);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(syncHash); } }, { passive: true });

  // 창 크기가 바뀌면 가장 가까운 지점에 다시 맞춤
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (deckOn() && !anim) { var l = stops(); scrollToY(l[nearest(l)].y, true); } }, 150);
  });

  // 첫 화면 안의 장면 링크(#compose 등)는 부드럽게 이동
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-goto')) return;
    var id = a.getAttribute('href').slice(1);
    if (!window.Deck.has(id)) return;
    e.preventDefault();
    var sw = !onLanding();
    if (sw && typeof showView === 'function') showView('landing');
    window.Deck.go(id, sw || mqReduce.matches);
  });

  window.Deck = {
    scrollTo: function (y) { scrollToY(y, mqReduce.matches); },
    has: function (id) { return scenes().some(function (s) { return s.dataset.scene === id; }); },
    go: function (id, instant) {
      var s = document.querySelector('#view-landing .scene[data-scene="' + id + '"]');
      if (!s) return;
      current = null;
      var go = function () { scrollToY(s.offsetTop, instant || mqReduce.matches); syncHash(); };
      // 첫 화면이 막 열린 직후면 배치가 끝난 뒤에 이동
      setTimeout(go, 0);
    }
  };
})();
