/* 코레일(korail) 실제 UI: 판의 부품과 카드 슬라이드 패널을 실제로 동작시키기 (view-korail 안에서만) */
(function () {
  var root = document.getElementById('view-korail'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function q(el, s) { return el.querySelector(s); }
  function each(s, fn) { qa(root, s).forEach(fn); }
  function onView(el, fn) { if (!('IntersectionObserver' in window)) { fn(); return; } var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: .4 }); io.observe(el); }

  // 비밀번호 보기/숨기기
  each('.ko-eye[aria-pressed]', function (b) {
    var inp = b.parentNode.querySelector('input');
    b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? '비밀번호 숨기기' : '비밀번호 보기'); inp.type = on ? 'text' : 'password'; });
  });
  // 눌림 상태가 남는 버튼(적용·상세보기·아이콘·3D 회전)
  each('.ko-gb[aria-pressed], .ko-ib[aria-pressed], .ko-rot', function (b) {
    b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); });
  });
  // 토글 · 라디오 · 태그
  each('.ko-tg', function (t) { t.addEventListener('click', function () { t.setAttribute('aria-checked', t.getAttribute('aria-checked') !== 'true'); }); });
  each('[data-ko="radio"]', function (g) {
    var rs = qa(g, '[role=radio]');
    rs.forEach(function (r) { (r.closest('label') || r).addEventListener('click', function (e) { e.preventDefault(); rs.forEach(function (x) { x.setAttribute('aria-checked', x === r ? 'true' : 'false'); }); }); });
  });
  each('.ko-tag', function (t) { t.addEventListener('click', function () { t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') !== 'true'); }); });

  // 원형 진행률: 화면에 보이면 0 → 값까지 차오름, 누르면 다시
  each('[data-ko="ring"]', function (w) {
    var ring = q(w, '.ko-ring'), fg = q(w, '.ko-ring-fg'), v = q(w, '.ko-ring-v'), cur = 0, raf = 0;
    function to(t) {
      cancelAnimationFrame(raf); var from = cur, st = performance.now(), dur = reduce ? 0 : 900;
      (function step(now) { var k = dur ? Math.min(1, (now - st) / dur) : 1, e = 1 - Math.pow(1 - k, 3); cur = from + (t - from) * e; fg.setAttribute('stroke-dasharray', cur.toFixed(2) + ' 100'); v.textContent = Math.round(cur) + '%'; ring.setAttribute('aria-valuenow', Math.round(cur)); if (k < 1) raf = requestAnimationFrame(step); })(st);
    }
    var T = +(ring.getAttribute('aria-valuenow') || 75);
    function replay() { cur = 0; to(T); }
    ring.addEventListener('click', replay); ring.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); } });
    onView(w, function () { to(T); });
  });
  // 진행 바: 보이면 차오름, 누르면 다시
  each('[data-ko="bar"] .ko-bar', function (b) {
    var s = q(b, 'span'), t = +(b.dataset.to || 30);
    function run() { s.style.transition = 'none'; s.style.width = '0%'; b.setAttribute('aria-valuenow', 0); void s.offsetWidth; s.style.transition = ''; s.style.width = t + '%'; b.setAttribute('aria-valuenow', t); }
    b.addEventListener('click', run); b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } });
    onView(b, function () { setTimeout(run, 150); });
  });

  // 드롭다운: 버튼으로 메뉴 열기, 고르면 버튼 글자가 바뀜(위·아래 키, Esc)
  var openOne = null;
  function closeOpen() { if (openOne) { openOne(); openOne = null; } }
  document.addEventListener('pointerdown', function (e) { if (openOne && !(e.target.closest && e.target.closest('.is-open'))) closeOpen(); });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOpen(); });
  each('[data-ko="dd"]', function (dd) {
    var btn = q(dd, 'button'), list = q(dd, '[role=listbox]'), v = q(dd, '.ko-dd-v'), opts = qa(list, '[role=option]');
    function shut() { list.hidden = true; dd.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    function pick(o) { opts.forEach(function (x) { x.setAttribute('aria-selected', x === o ? 'true' : 'false'); x.classList.remove('is-act'); }); v.textContent = o.textContent.trim(); shut(); openOne = null; btn.focus({ preventScroll: true }); }
    btn.addEventListener('click', function () { if (list.hidden) { closeOpen(); list.hidden = false; dd.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); openOne = shut; list.focus({ preventScroll: true }); } else { shut(); openOne = null; } });
    opts.forEach(function (o) { o.addEventListener('click', function () { pick(o); }); });
    list.addEventListener('keydown', function (e) {
      var i = opts.indexOf(q(list, '.is-act'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = Math.max(0, Math.min(opts.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))); opts.forEach(function (o, k) { o.classList.toggle('is-act', k === i); }); }
      else if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { e.preventDefault(); pick(opts[i]); }
    });
  });

  // 제품 일괄 등록: × 로 파일 지우기, '파일 선택'으로 다시 올리기 → 두 파일이 다 있으면 매핑 진행 막대 후 결과 표시·저장 활성
  each('[data-ko="bulk"]', function (p) {
    var files = qa(p, '.ko-file'), save = q(p, '.ko-save'), bar = q(p, '.ko-map-bar span'), t = 0;
    q(p, '[data-ko="nolink"]').addEventListener('click', function (e) { e.preventDefault(); });
    function ok() { return files.every(function (f) { return !f.classList.contains('is-empty') && !f.classList.contains('is-load'); }); }
    function upd(mapping) {
      var good = ok(); save.disabled = !good; p.classList.toggle('is-off', !good);
      if (good && mapping) { p.classList.add('is-map'); bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth; bar.style.transition = ''; bar.style.width = '100%'; clearTimeout(t); t = setTimeout(function () { p.classList.remove('is-map'); }, reduce ? 0 : 1200); }
    }
    files.forEach(function (f) {
      var fn = q(f, '.ko-fn'), name = fn.dataset.name;
      q(f, '.ko-fx').addEventListener('click', function () { fn.textContent = ''; f.classList.add('is-empty'); upd(); });
      q(f, '.ko-pick').addEventListener('click', function () {
        f.classList.remove('is-empty'); f.classList.add('is-load'); fn.textContent = '업로드 중…'; upd();
        setTimeout(function () { f.classList.remove('is-load'); fn.textContent = name; upd(true); }, reduce ? 0 : 700);
      });
    });
    save.addEventListener('click', function () { save.classList.remove('is-done'); void save.offsetWidth; save.classList.add('is-done'); });
    upd();
  });

  // 비밀번호 변경: 입력하는 대로 규칙·일치 여부를 확인하고, 모두 맞으면 버튼 활성
  each('[data-ko="pw"]', function (f) {
    var cur = q(f, '#ko-pw1'), nw = q(f, '#ko-pw2'), cf = q(f, '#ko-pw3'), go = q(f, '.ko-pw-go');
    var mCur = q(f, '[data-m="cur"]'), mNew = q(f, '[data-m="new"]'), mCf = q(f, '[data-m="cf"]'), touched = false;
    var RULE = '※ 영문 대소문자/숫자/특수문자 중 2가지 이상 조합하여 6~8자리로 입력하세요.';
    function kinds(s) { return [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z\d]/].filter(function (r) { return r.test(s); }).length; }
    function set(m, inp, text, cls) { m.textContent = text; m.className = 'ko-msg' + (cls ? ' ' + cls : ''); inp.parentNode.classList.toggle('is-err', cls === 'is-err'); }
    function check() {
      var a = cur.value.length > 0, nv = nw.value, b = nv.length >= 6 && nv.length <= 8 && kinds(nv) >= 2, c = cf.value.length > 0 && cf.value === nv;
      if (touched) set(mCur, cur, a ? '' : '※ 현재 비밀번호를 입력하세요.', a ? '' : 'is-err');
      set(mNew, nw, nv && !b ? RULE : (b ? '※ 사용할 수 있는 비밀번호입니다.' : RULE), nv && !b ? 'is-err' : (b ? 'is-ok' : ''));
      set(mCf, cf, cf.value ? (c ? '※ 새 비밀번호가 일치합니다.' : '※ 새 비밀번호가 일치하지 않습니다.') : '', cf.value ? (c ? 'is-ok' : 'is-err') : '');
      go.disabled = !(a && b && c);
    }
    cur.addEventListener('input', function () { touched = true; check(); });
    [nw, cf].forEach(function (i) { i.addEventListener('input', check); });
    go.addEventListener('click', function () { if (!go.disabled) { go.textContent = '변경 완료'; setTimeout(function () { go.textContent = '비밀번호 변경'; }, 1400); } });
  });

  // 열차별 입출고: 정비 소요 시간이 실제로 흐름(보일 때만), 닫으면 사라졌다가 다시 나타남
  each('[data-ko="io"]', function (p) {
    var tm = q(p, '.ko-io-tm'), s = 5 * 3600, vis = false;
    function pad(n, k) { n = String(n); while (n.length < k) n = '0' + n; return n; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(p); else vis = true;
    setInterval(function () { if (!vis) return; s++; tm.textContent = pad(Math.floor(s / 3600), 3) + 'h ' + pad(Math.floor(s / 60) % 60, 2) + 'm ' + pad(s % 60, 2) + 's'; }, 1000);
    q(p, '.ko-x').addEventListener('click', function () { p.classList.add('is-closed'); setTimeout(function () { p.classList.remove('is-closed'); }, 1100); });
  });

  // 경고표지: 그림을 누르면 선택 테두리, 확인은 눌림
  each('.ko-wl-i button', function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); });

  // 카드 슬라이드: 가운데가 아닌 카드 안 부품은 포커스·클릭 안 되게
  each('.ko-cf .cf-card', function (c) {
    var p = q(c, '.ko-p'); if (!p) return;
    function upd() { p.inert = !c.classList.contains('is-center'); }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  });
})();

/* 코레일 카드 슬라이드(2026-11-20 교체): MSDS 제품 목록 · 관리자 계정 추가 · 차륜 월별 예상 직경 · 정비 공정별 상세보기 */
(function () {
  var root = document.getElementById('view-korail'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qa(el, s) { return [].slice.call(el.querySelectorAll(s)); }
  function q(el, s) { return el.querySelector(s); }
  function onCenter(el, fn) {
    var c = el.closest('.cf-card'); if (!c) { fn(true); return; }
    var was = null;
    function upd() { var on = c.classList.contains('is-center'); if (on !== was) { was = on; fn(on); } }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  }
  // 닫기: 사라졌다가 1.2초 뒤 다시 나타남(기존 방식)
  function closer(p, reset) {
    q(p, '.ko-x').addEventListener('click', function () {
      p.classList.add('is-closed');
      setTimeout(function () { if (reset) reset(); p.classList.remove('is-closed'); }, 1200);
    });
  }
  // 페이지 넘김: 번호·처음·이전·다음·마지막, 1쪽에서는 처음·이전 비활성, 끝쪽에서는 다음·마지막 비활성
  function pager(nav, onGo) {
    var n = +nav.getAttribute('data-n'), cur = 1;
    var nums = qa(nav, '.ko-pg-n'), a = {}; qa(nav, '.ko-pg-a').forEach(function (b) { a[b.getAttribute('data-go')] = b; });
    function set(k, silent) {
      cur = Math.max(1, Math.min(n, k));
      nums.forEach(function (b) { if (+b.getAttribute('data-p') === cur) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      a.prev.disabled = a.first.disabled = cur === 1; a.next.disabled = a.last.disabled = cur === n;
      if (!silent && onGo) onGo(cur);
    }
    nums.forEach(function (b) { b.addEventListener('click', function () { set(+b.getAttribute('data-p')); }); });
    a.prev.addEventListener('click', function () { set(cur - 1); }); a.next.addEventListener('click', function () { set(cur + 1); });
    a.first.addEventListener('click', function () { set(1); }); a.last.addEventListener('click', function () { set(n); });
    set(1, true);
    return set;
  }
  function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  // 1. MSDS 제품 목록: 행 Hover(글자 #00B2E3)·누르면 선택(Active #013D4A), 페이지 넘김(번호 열이 쪽에 맞게 바뀜)
  qa(root, '[data-ko="msds"]').forEach(function (p) {
    var tb = q(p, 'tbody'), rows = qa(tb, 'tr');
    function pick(r) { rows.forEach(function (x) { x.setAttribute('aria-selected', x === r ? 'true' : 'false'); }); }
    rows.forEach(function (r) {
      r.addEventListener('click', function () { pick(r); });
      r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(r); } });
    });
    var go = pager(q(p, '.ko-pg'), function (k) {
      rows.forEach(function (r, i) { r.firstChild.textContent = (k - 1) * 10 + i + 1; r.setAttribute('aria-selected', 'false'); });
      replay(tb, 'is-load');
    });
    closer(p, function () { go(1); });
  });

  // 2. 관리자 계정 추가: 이름 입력(포커스 테두리 #00B2E3), 검색 버튼, 메뉴 권한 체크(All = 전체 선택·일부면 중간 상태), 저장은 이름+권한 하나 이상일 때 활성
  qa(root, '[data-ko="admin"]').forEach(function (f) {
    var name = q(f, '.ko-ad-in input'), all = q(f, 'input[data-all]'), boxes = qa(f, '.ko-cb input').filter(function (x) { return x !== all; }), sv = q(f, '.ko-ad-sv');
    function sync() {
      var on = boxes.filter(function (b) { return b.checked; }).length;
      all.checked = on === boxes.length; all.indeterminate = on > 0 && on < boxes.length;
      sv.disabled = !(name.value.trim() && on > 0);
    }
    all.addEventListener('change', function () { boxes.forEach(function (b) { b.checked = all.checked; }); sync(); });
    boxes.forEach(function (b) { b.addEventListener('change', sync); });
    name.addEventListener('input', sync);
    q(f, '.ko-ad-s').addEventListener('click', function () { if (!name.value.trim()) name.focus(); });
    name.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
    function reset() { name.value = ''; all.checked = false; boxes.forEach(function (b) { b.checked = false; }); sync(); }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (sv.disabled) return;
      f.classList.add('is-closed'); setTimeout(function () { reset(); f.classList.remove('is-closed'); }, 1200);
    });
    closer(f, reset);
    sync();
  });

  // 3. 차륜 월별 예상 직경: 가운데로 올 때 값이 차례로 들어옴, 칸 Hover #F2F2F7
  qa(root, '[data-ko="wheel"]').forEach(function (p) {
    qa(p, '.ko-wh-tb td').forEach(function (td, i) { td.style.setProperty('--i', i % 18); });
    onCenter(p, function (on) { p.classList.remove('is-play'); if (on && !reduce) { void p.offsetWidth; p.classList.add('is-play'); } });
    closer(p);
  });

  // 4. 정비 공정별 상세보기: 본문 세로 스크롤, 행 Hover #F2F2F7, 페이지 넘김
  qa(root, '[data-ko="maint"]').forEach(function (p) {
    var sc = q(p, '.ko-mt-sc'), tb = q(p, '.ko-mt-tb');
    sc.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });
    var go = pager(q(p, '.ko-pg'), function () { sc.scrollTop = 0; replay(tb, 'is-load'); });
    closer(p, function () { go(1); });
  });

  // 가운데가 아닌 카드 안 부품은 포커스·클릭 안 되게
  qa(root, '.ko-cf .cf-card').forEach(function (c) {
    var p = q(c, '.ko-p'); if (!p) return;
    function upd() { p.inert = !c.classList.contains('is-center'); }
    new MutationObserver(upd).observe(c, { attributes: true, attributeFilter: ['class'] }); upd();
  });
})();
