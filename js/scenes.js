/* 첫 화면 장면들을 data.js 로 채우고, '프로젝트 넘겨보기' 장면을 스크롤에 맞춰 바꾼다. */
(function () {
  var P = window.PORTFOLIO;
  var byId = {}; P.projects.forEach(function (p) { byId[p.id] = p; });
  var ARROW = '<svg class="ar" viewBox="0 0 16 10" fill="none" stroke="currentColor"><path d="M0 5h14M10 1l4 4-4 4"/></svg>';
  function thumb(n) { return 'assets/thumb/' + n + '.webp'; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function $(id) { return document.getElementById(id); }

  // 1. 첫 화면 · 4. 생각 배경
  $('heroImg').src = thumb(P.hero + '-full');
  $('aboutImg').src = thumb(P.about + '-full');

  // 2. 프로젝트 넘겨보기
  $('composeList').innerHTML = P.projects.map(function (p, i) {
    return '<li><button type="button" data-step="' + i + '"><i></i>' + esc(p.kr) + '</button></li>';
  }).join('');
  $('composeStage').innerHTML = P.projects.map(function (p, i) {
    return '<img src="' + thumb(p.cover) + '" alt="' + esc(p.kr) + ' 화면" data-i="' + i + '"' + (i > 1 ? ' loading="lazy"' : '') + '>';
  }).join('');

  // 3. 대표작
  $('worksGrid').innerHTML = P.projects.map(function (p) {
    return '<a class="sc" data-goto="' + p.id + '" href="#' + p.id + '">' +
      '<span class="sc-img"><img src="' + thumb(p.cover) + '" alt="" loading="lazy"></span>' +
      '<span class="sc-top"><b>' + p.num + '</b><span>' + esc(p.meta[2]) + '</span></span>' +
      '<span class="sc-name">' + esc(p.kr) + '</span>' +
      '<span class="sc-sub">' + esc(p.client) + '</span></a>';
  }).join('');

  // 5. 플랫폼별 — 묶음 소개 칸 + 그 묶음의 프로젝트 칸
  var cells = [];
  P.groups.forEach(function (g) {
    var list = P.projects.filter(function (p) { return p.group === g.id; });
    cells.push('<div class="sc sc-x"><span class="sc-big"><b>' + g.mark + '</b>' + esc(g.name) + '</span>' +
      '<span class="sc-sub">' + esc(g.desc) + '</span><span class="sc-count">' + list.length + '개 프로젝트</span></div>');
    list.forEach(function (p) {
      cells.push('<a class="sc sc-sm" data-goto="' + p.id + '" href="#' + p.id + '">' +
        '<span class="sc-top"><b>' + p.num + '</b><span>' + esc(p.meta[1]) + '</span></span>' +
        '<span class="sc-img"><img src="' + thumb(p.cover) + '" alt="" loading="lazy"></span>' +
        '<span class="sc-name">' + esc(p.kr) + '</span></a>');
    });
  });
  while (cells.length % 4) cells.push('<div class="sc sc-empty" aria-hidden="true"></div>');
  $('platformGrid').innerHTML = cells.join('');

  // 6. 화면 갤러리
  $('galleryTiles').insertAdjacentHTML('beforeend', P.gallery.map(function (t) {
    var p = byId[t[0]];
    return '<a class="tile" data-goto="' + p.id + '" href="#' + p.id + '"><img src="' + thumb(t[1]) + '" alt="' + esc(p.kr) + ' 화면" loading="lazy">' +
      '<span class="tile-label">' + esc(p.kr) + ARROW + '</span></a>';
  }).join(''));

  // 넘겨보기: 스크롤 위치 → 현재 프로젝트
  var scene = $('compose'), n = P.projects.length, cur = -1;
  var imgs = $('composeStage').children, btns = $('composeList').querySelectorAll('button');
  function setStep(i) {
    if (i === cur) return;
    cur = i; var p = P.projects[i];
    Array.prototype.forEach.call(imgs, function (im, k) { im.classList.toggle('on', k === i); });
    Array.prototype.forEach.call(btns, function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    $('capNum').textContent = p.num;
    $('capName').textContent = p.kr;
    $('capClient').textContent = p.client;
    $('capDomain').textContent = p.meta[0];
    $('capPlatform').textContent = p.meta[1];
    $('capPeriod').textContent = p.meta[2];
    $('composeOpen').setAttribute('data-goto-current', p.id);
    $('composeOpen').href = '#' + p.id;
  }
  function stepY(i) { return scene.offsetTop + (scene.offsetHeight - window.innerHeight) * i / (n - 1); }
  function onScroll() {
    if (document.body.dataset.view !== 'landing') return;
    var range = scene.offsetHeight - window.innerHeight;
    var t = range > 0 ? (window.scrollY - scene.offsetTop) / range : 0;
    setStep(Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  setStep(0);

  // 목록 클릭 → 그 프로젝트 칸으로
  Array.prototype.forEach.call(btns, function (b) {
    b.addEventListener('click', function () {
      var y = stepY(+b.dataset.step);
      if (window.Deck) Deck.scrollTo(y); else window.scrollTo(0, y);
    });
  });
  // 자세히 보기 → 현재 프로젝트 상세
  $('composeOpen').addEventListener('click', function (e) {
    e.preventDefault();
    if (typeof showView === 'function') showView(this.getAttribute('data-goto-current'));
  });

  window.ComposeScene = { steps: function () { var a = []; for (var i = 0; i < n; i++) a.push(stepY(i)); return a; } };
})();
