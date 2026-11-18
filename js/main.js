/* 상단 탭(숨김, 현재 화면 표시용)을 data.js 에서 생성 */
(function () {
  var P = window.PORTFOLIO;
  document.querySelector('.topbar-tabs').innerHTML = '<button class="topbar-tab" data-view="landing">Index</button>' +
    P.projects.map(function (p) { return '<button class="topbar-tab" data-view="' + p.id + '">' + p.tab + '</button>'; }).join('');
})();

/* 상단 시계 — "11월 18일 수요일 09:48" */
(function () {
  var el = document.getElementById('clock');
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var d = new Date();
    el.innerHTML = (d.getMonth() + 1) + '월 ' + d.getDate() + '일<span class="wd"> ' + WD[d.getDay()] + '요일</span><span class="tm"> ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '</span>';
  }
  tick(); setInterval(tick, 15000);
})();

/* 로딩 화면 — 이미지 로드 진행률, 최소 0.9초, 같은 탭에선 한 번만 */
(function () {
  var loader = document.getElementById('loader');
  var fill = document.getElementById('loader-fill');
  var count = document.getElementById('loader-count');
  var seen = false;
  try { seen = sessionStorage.getItem('pf-intro') === '1'; sessionStorage.setItem('pf-intro', '1'); } catch (e) {}
  if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { loader.remove(); return; }
  document.documentElement.style.overflow = 'hidden';
  var t0 = Date.now(), MIN = 900, shown = 0, real = 0;
  var imgs = Array.prototype.slice.call(document.querySelectorAll('.view-landing img:not([loading=lazy])'));
  var total = imgs.length, loaded = 0;
  function bump() { loaded++; real = total ? loaded / total : 1; }
  imgs.forEach(function (im) { if (im.complete) bump(); else { im.addEventListener('load', bump); im.addEventListener('error', bump); } });
  if (!total) real = 1;
  function frame() {
    var timeP = Math.min((Date.now() - t0) / MIN, 1);
    shown = Math.min(real, 1 - Math.pow(1 - timeP, 2));
    fill.style.width = (shown * 100).toFixed(1) + '%';
    count.textContent = Math.round(shown * 100);
    if (shown < 1) requestAnimationFrame(frame);
    else setTimeout(function () { loader.classList.add('done'); document.documentElement.style.overflow = ''; setTimeout(function () { loader.remove(); }, 700); }, 200);
  }
  window.addEventListener('load', function () { real = 1; });
  setTimeout(function () { real = 1; }, 4000);
  requestAnimationFrame(frame);
  setTimeout(function () { if (document.body.contains(loader)) { shown = 1; real = 1; frame(); } }, 5000);
})();

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + name);
  if (!target) return;
  target.classList.add('active');
  document.querySelectorAll('.topbar-tab').forEach(t => t.classList.toggle('active', t.dataset.view === name));
  document.body.dataset.view = name;
  history.replaceState(null, '', '#' + (name === 'landing' ? '' : name));
  window.scrollTo({ top: 0, behavior: 'instant' });
  setTimeout(() => target.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 60)), 50);
}
document.querySelectorAll('.topbar-tab').forEach(t => t.addEventListener('click', () => showView(t.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showView(el.dataset.goto); }));
function initFromHash() {
  const hash = (window.location.hash || '').slice(1) || 'landing';
  // 첫 화면 안의 장면(#work 등)이면 첫 화면을 열고 그 장면으로 이동
  const first = !document.body.dataset.view;  // 처음 열 때는 즉시, 이후 링크 이동은 부드럽게
  if (window.Deck && Deck.has(hash)) { const sw = document.body.dataset.view !== 'landing'; if (sw) showView('landing'); Deck.go(hash, first || sw); return; }
  showView(hash);
}
window.addEventListener('hashchange', initFromHash);

const orbs = [document.getElementById('orb1'), document.getElementById('orb2')];
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5);
  const y = (e.clientY / window.innerHeight - 0.5);
  orbs.forEach((orb, i) => { if (!orb) return; const s = [40, 30][i]; const sign = i % 2 === 0 ? 1 : -1; orb.style.transform = `translate(${x * s * sign}px, ${y * s * sign}px)`; });
});

const io = new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
function observeReveals() { document.querySelectorAll('.reveal').forEach(el => io.observe(el)); }
setTimeout(() => document.querySelectorAll('#view-landing .reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 120)), 100);

function setupLightbox() {
  const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-caption');
  const lbCounter = document.getElementById('lb-counter');
  let cur = 0;
  function open(i) { cur = i; const t = triggers[i]; const img = t.tagName === 'IMG' ? t : t.querySelector('img'); if (img) { lbImg.src = img.src; lbImg.alt = img.alt; } lbCap.textContent = t.dataset.caption || (img ? img.alt : ''); lbCounter.textContent = (i + 1) + ' / ' + triggers.length; lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  function nav(d) { cur = (cur + d + triggers.length) % triggers.length; open(cur); }
  triggers.forEach((t, i) => t.addEventListener('click', (e) => { if (e.target.classList.contains('pin')) return; open(i); }));
  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-prev').addEventListener('click', e => { e.stopPropagation(); nav(-1); });
  document.getElementById('lb-next').addEventListener('click', e => { e.stopPropagation(); nav(1); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox-inner')) close(); });
  document.addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') nav(-1); else if (e.key === 'ArrowRight') nav(1); });
}
function setupPinAnno() {
  document.querySelectorAll('.pin').forEach(pin => {
    const target = document.getElementById(pin.dataset.target);
    if (!target) return;
    const on = () => { pin.classList.add('active'); target.classList.add('active'); };
    const off = () => { pin.classList.remove('active'); target.classList.remove('active'); };
    pin.addEventListener('mouseenter', on); pin.addEventListener('mouseleave', off);
    target.addEventListener('mouseenter', on); target.addEventListener('mouseleave', off);
    pin.addEventListener('click', e => e.stopPropagation());
  });
}
function setupSwatchCopy() {
  document.querySelectorAll('.swatch.copyable').forEach(sw => {
    sw.addEventListener('click', () => {
      const hex = sw.dataset.hex;
      if (navigator.clipboard) navigator.clipboard.writeText(hex).catch(() => {});
      sw.classList.add('copied'); setTimeout(() => sw.classList.remove('copied'), 1200);
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initFromHash(); setupLightbox(); setupPinAnno(); setupSwatchCopy(); observeReveals();
  if (typeof initHDComponents === 'function') initHDComponents();
  if (typeof initARComponents === 'function') initARComponents();
  if (typeof initVRComponents === 'function') initVRComponents();
});

/* ================= Scroll Interactions ================= */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 등장 애니메이션 대상 태깅 (상세 뷰 한정, 기존 reveal·section-tag 제외)
  var SEL = ['.annotated-screen','.screen-critique','.metrics','.ds-grid',
    '.components-section','.critique-grid','.reflection-grid','.baseline-screens',
    '.baseline-metrics','.overview-body','.section-sub','.project-nav-cards'].join(',');
  document.querySelectorAll('section.view:not(.view-landing)').forEach(function (view) {
    view.querySelectorAll(SEL).forEach(function (el) {
      if (!el.classList.contains('reveal')) el.classList.add('sr');
    });
  });
  // 그리드 자식 순차 지연(stagger)
  document.querySelectorAll('.metrics.sr, .ds-grid.sr, .reflection-grid.sr, .baseline-screens.sr, .baseline-metrics.sr, .critique-grid.sr').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.transitionDelay = (i * 80) + 'ms'; });
  });

  // 등장 옵저버
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.sr').forEach(function (el) { io.observe(el); });

  // 숫자 카운트업 (순수 숫자만)
  function countUp(el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    var raw = node.textContent.trim();
    if (!/^\d+(\.\d+)?$/.test(raw)) return;
    var target = parseFloat(raw), dec = (raw.split('.')[1] || '').length, t0 = null, dur = 1100;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
      node.textContent = (target * ease).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else node.textContent = raw;
    }
    node.textContent = (0).toFixed(dec);
    requestAnimationFrame(step);
  }
  if (!reduce) {
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); nio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    document.querySelectorAll('.metric .num, .baseline-metric .num').forEach(function (n) { nio.observe(n); });
  }

  // 상단 진행 바 + hero 패럴랙스
  var bar = document.createElement('div'); bar.id = 'scroll-progress'; document.body.appendChild(bar);
  function onScroll() {
    var d = document.documentElement, max = d.scrollHeight - d.clientHeight, y = d.scrollTop;
    bar.style.width = (max > 0 ? (y / max * 100) : 0) + '%';
    if (!reduce) {
      var hero = document.querySelector('.view.active .project-hero .container');
      if (hero) { hero.style.transform = 'translateY(' + (y * 0.18) + 'px)'; hero.style.opacity = Math.max(0, 1 - y / 520); }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // 뷰 전환 시 hero 변형 초기화
  function resetHeroes() {
    document.querySelectorAll('.project-hero .container').forEach(function (h) { h.style.transform = ''; h.style.opacity = ''; });
    onScroll();
  }
  document.querySelectorAll('[data-goto], .topbar-tab').forEach(function (b) {
    b.addEventListener('click', function () { setTimeout(resetHeroes, 60); });
  });
  window.addEventListener('hashchange', resetHeroes);
  onScroll();
})();
