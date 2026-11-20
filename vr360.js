/* 프로젝트 상세의 360 공간 배경 + 카드 슬라이드(실제 UI). .vrc-box 마다 엔진 하나: 정비 VR(#vrcBox), MCU(#mcuBox), 삼성 XR(#sxBox) */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  function $(id) { return document.getElementById(id); }
  function scaleOf(el) { var c = el.closest('.vrc-card'); return c ? +c.dataset.s : 1; }
  function loadCss(href) {
    if (!href || document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
  // three.js 는 한 번만 불러오고, 기다리는 섹션들에 차례로 알린다
  var threeWait = null;
  function loadThree(cb, fail) {
    if (window.THREE) { cb(); return; }
    if (threeWait) { threeWait.push([cb, fail]); return; }
    threeWait = [[cb, fail]];
    var s = document.createElement('script'); s.src = THREE_SRC; s.async = true;
    s.onload = function () { threeWait.forEach(function (w) { w[0](); }); };
    s.onerror = function () { threeWait.forEach(function (w) { if (w[1]) w[1](); }); threeWait = null; };
    document.head.appendChild(s);
  }

  // 스크롤: 휠은 패널 안에서만 쓰고 페이지·카드로 새지 않음. 막대는 피그마 디자인 그대로, 내용이 넘칠 때 실제 위치·길이를 따른다
  function bindScroll(sc, th, axis, t0, tLen) {
    var X = axis === 'x', drag = null;
    function over() { return X ? sc.scrollWidth - sc.clientWidth : sc.scrollHeight - sc.clientHeight; }
    function sync() {
      var m = over(); th.classList.toggle('is-live', m > 1);
      if (m <= 1) return; // 넘치지 않으면 피그마 위치·길이 그대로 둔다
      var cl = X ? sc.clientWidth : sc.clientHeight, all = cl + m, len = Math.max(40, tLen * cl / all);
      var p = t0 + (tLen - len) * ((X ? sc.scrollLeft : sc.scrollTop) / m);
      if (X) { th.style.width = len + 'px'; th.style.left = p + 'px'; } else { th.style.height = len + 'px'; th.style.top = p + 'px'; }
    }
    sc.addEventListener('scroll', sync); window.addEventListener('resize', sync); sync();
    var host = sc.closest('.vrc-box'); if (host) (host.__syncs = host.__syncs || []).push(sync); // 뷰가 보일 때 다시 잰다
    sc.addEventListener('wheel', function (e) {
      // 이 스크롤 대상의 축 방향 휠만 가로챈다. 넘치는 내용이 없거나 다른 축이면 그대로 흘려 보낸다
      // 가로 목록(X)은 세로 휠도 가로로 바꿔 쓴다. 세로 휠은 목록 끝에 닿으면 페이지로 넘겨 준다
      var horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY), m = over();
      if (m <= 1 || (!X && horiz)) return;
      var raw = X ? (horiz ? e.deltaX : e.deltaY) : e.deltaY;
      var d = raw * (e.deltaMode === 1 ? 16 : 1) / scaleOf(sc), cur = X ? sc.scrollLeft : sc.scrollTop;
      if (X && !horiz && ((d > 0 && cur >= m - 1) || (d < 0 && cur <= 0))) return;
      e.preventDefault(); e.stopPropagation();
      if (X) sc.scrollLeft += d; else sc.scrollTop += d;
    }, { passive: false });
    th.addEventListener('pointerdown', function (e) {
      if (over() <= 1) return;
      e.preventDefault(); e.stopPropagation(); th.setPointerCapture(e.pointerId);
      drag = { p: X ? e.clientX : e.clientY, s: X ? sc.scrollLeft : sc.scrollTop };
    });
    th.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var s = scaleOf(sc), m = over(), len = parseFloat(X ? th.style.width : th.style.height);
      var dd = ((X ? e.clientX : e.clientY) - drag.p) / s * (m / Math.max(1, tLen - len));
      if (X) sc.scrollLeft = drag.s + dd; else sc.scrollTop = drag.s + dd;
    });
    th.addEventListener('pointerup', function () { drag = null; });
    th.addEventListener('pointercancel', function () { drag = null; });
    return sync;
  }

  // 닫기: 패널이 닫혔다가 잠시 뒤 다시 열린다(시연용)
  function replay(pn, cls) { pn.classList.remove(cls); void pn.offsetWidth; pn.classList.add(cls); }
  [].forEach.call(document.querySelectorAll('[data-close]'), function (b) {
    b.addEventListener('click', function () {
      var pn = $(b.dataset.close); if (pn.dataset.busy) return; pn.dataset.busy = 1;
      pn.classList.remove('is-opening'); pn.classList.add('is-closing');
      setTimeout(function () { pn.style.visibility = 'hidden'; pn.classList.remove('is-closing'); }, reduce ? 0 : 260);
      setTimeout(function () { pn.style.visibility = ''; replay(pn, 'is-opening'); delete pn.dataset.busy; }, reduce ? 300 : 1000);
    });
  });

  // ── 360 배경 + 카드 슬라이드 엔진: .vrc-box(data-pano·data-fonts·data-base·data-step) 하나를 맡는다 ──
  function engine(box, opts) {
    var SRC = opts.pano || box.dataset.pano; // 스크립트 쪽 주소(캐시 버전 포함)를 우선
    var stage = box.querySelector('.vrc-stage'), msg = box.querySelector('.msg'), centerK = -1;

    var FONTS = box.dataset.fonts || opts.fonts;

    // 360 배경: 섹션이 화면에 가까워질 때 처음 불러온다
    var renderer = null, scene, camera, mat, HFOV = 80;
    function initThree() {
      if (renderer || !window.THREE) return;
      try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (err) { msg.textContent = '이 브라우저에서는 360 배경을 표시할 수 없습니다'; return; }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
      box.insertBefore(renderer.domElement, box.firstChild);
      scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1100);
      var geo = new THREE.SphereGeometry(500, 64, 40); geo.scale(-1, 1, 1);
      mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      scene.add(new THREE.Mesh(geo, mat));
      new THREE.TextureLoader().load(SRC, function (tex) {
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; if (msg.parentNode) msg.remove();
      }, undefined, function () { msg.textContent = '360 이미지를 찾을 수 없습니다'; });
      size();
    }
    // 숨겨진 뷰에서는 크기가 0 이므로, 보일 때마다 다시 잰다
    function size() {
      if (!renderer) return;
      var w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h;
      var v = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(HFOV) / 2) / camera.aspect);
      camera.fov = Math.min(70, THREE.MathUtils.radToDeg(v)); camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', size);
    if (window.ResizeObserver) new ResizeObserver(function () { size(); }).observe(box);

    // 카드
    var cards = [].slice.call(stage.querySelectorAll('.vrc-card')), n = cards.length;
    var dotsBox = box.querySelector('.vrc-dots'), prev = box.querySelector('.vrc-prev'), next = box.querySelector('.vrc-next');
    cards.forEach(function (c, i) {
      c.style.width = c.dataset.w + 'px'; c.style.marginLeft = (-c.dataset.w / 2) + 'px';
      var vp = c.querySelector('.vp');
      if (vp) { var s = c.dataset.w / c.dataset.fw; c.dataset.s = s; vp.style.height = (c.dataset.fh * s) + 'px'; vp.firstElementChild.style.transform = 'scale(' + s + ')'; }
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', (i + 1) + '번째 패널');
      b.addEventListener('click', function () { go(i); }); dotsBox.appendChild(b);
    });
    var dots = [].slice.call(dotsBox.children);
    var mid = Math.floor(n / 2), pos = mid, target = mid, GAP = 300, STEP = +(box.dataset.step || opts.step || 14); // 카드 한 장마다 배경이 도는 각도
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function place() {
      var scale = Math.min(1, box.clientWidth / 1100);
      cards.forEach(function (c, i) {
        var d = i - pos, ad = Math.abs(d), sd = clamp(d, -1, 1);
        c.style.transform = 'translateY(-50%) translateX(' + (d * GAP * scale) + 'px) translateZ(' + (-ad * 140) + 'px) rotateY(' + (sd * 32) + 'deg) scale(' + (Math.max(0.55, 1 - ad * 0.2) * scale) + ')';
        c.style.filter = 'brightness(' + (1 - Math.min(ad, 3) * 0.18) + ')';
        c.style.opacity = String(ad > 2.4 ? Math.max(0, 3.2 - ad) : 1);
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.classList.toggle('is-center', ad < 0.5);
      });
      var ck = Math.round(clamp(pos, 0, n - 1));
      if (ck !== centerK && Math.abs(pos - ck) < 0.5) { centerK = ck; onCenter(ck); }
      var k = Math.round(clamp(pos, 0, n - 1));
      dots.forEach(function (b, i) { b.classList.toggle('is-on', i === k); });
      prev.disabled = target <= 0; next.disabled = target >= n - 1;
    }
    function go(k) { target = clamp(Math.round(k), 0, n - 1); }
    prev.addEventListener('click', function () { go(target - 1); });
    next.addEventListener('click', function () { go(target + 1); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(target - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(target + 1); e.preventDefault(); }
    });

    var down = false, sx = 0, sp = 0, moved = 0, lastX = 0, lastT = 0, vel = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      // 가운데 카드 안(버튼·스크롤·표)에서 누르면 넘김을 시작하지 않는다
      if (e.target.closest && e.target.closest('.vrc-card.is-center .vp-in')) return;
      down = true; moved = 0; sx = lastX = e.clientX; lastT = performance.now(); sp = pos; vel = 0;
      stage.setPointerCapture(e.pointerId); stage.classList.add('is-drag');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      var now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
      pos = clamp(sp - dx / GAP, -0.4, n - 0.6); target = pos;
    });
    function up(e) {
      if (!down) return;
      down = false; stage.classList.remove('is-drag');
      if (moved < 6) {
        stage.releasePointerCapture && stage.releasePointerCapture(e.pointerId);
        var el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest('.vrc-card');
        go(c ? cards.indexOf(c) : target); return;
      }
      go(pos - vel * 0.35);
    }
    // 트랙패드 좌우 스크롤(가로 휠)로 카드 한 장씩 넘기기. 세로 휠은 건드리지 않아 페이지 스크롤이 그대로 된다
    var wheelAcc = 0, wheelAt = 0;
    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) { wheelAcc = 0; return; }
      e.preventDefault();
      var now = performance.now();
      wheelAcc += e.deltaX;
      if (now - wheelAt < 350 || Math.abs(wheelAcc) < 20) return;
      go(target + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0; wheelAt = now;
    }, { passive: false });
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);

    // 가운데 카드가 바뀔 때: 옆 카드는 inert, 가운데 카드만 동작
    function onCenter(k) {
      cards.forEach(function (c, i) { var v = c.querySelector('.vp-in'); if (v) v.inert = i !== k; });
      if (opts.onCenter) opts.onCenter(k);
    }

    // 배경은 카드 위치를 따라 돈다(가운데 카드 = 굴삭기 정면). 화면에 보일 때만 돌고, 다른 뷰로 가면 멈춘다
    var BASE = +(box.dataset.base || opts.base || 180), lon = BASE, idle = 0, running = false, rafId = 0, inView = false;
    function frame() {
      if (!running) return;
      if (!down) pos += (target - pos) * (reduce ? 1 : 0.12);
      var goalLon = BASE + (pos - mid) * STEP;
      lon += (goalLon - lon) * (reduce ? 1 : 0.08);
      idle += reduce ? 0 : 0.004;
      if (renderer) {
        var lat = Math.sin(idle) * 1.2, phi = THREE.MathUtils.degToRad(90 - lat), th = THREE.MathUtils.degToRad(lon + Math.sin(idle * 0.7) * 1.5);
        camera.lookAt(500 * Math.sin(phi) * Math.cos(th), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(th));
        renderer.render(scene, camera);
      }
      place();
      rafId = requestAnimationFrame(frame);
    }
    function setRun(on) {
      on = on && !document.hidden;
      if (on === running) return;
      running = on;
      if (on) { size(); (box.__syncs || []).forEach(function (f) { f(); }); rafId = requestAnimationFrame(frame); }
      else { cancelAnimationFrame(rafId); down = false; stage.classList.remove('is-drag'); }
      if (opts.onRun) opts.onRun(on, centerK);
    }
    document.addEventListener('visibilitychange', function () { setRun(inView); });
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (es) {
        if (!es.some(function (e) { return e.isIntersecting; })) return;
        near.disconnect(); loadCss(FONTS); loadThree(initThree, function () { msg.textContent = '360 배경을 불러오지 못했습니다'; });
      }, { rootMargin: '400px 0px' });
      near.observe(box);
      new IntersectionObserver(function (es) { inView = es[es.length - 1].isIntersecting; setRun(inView); }, { threshold: 0 }).observe(box);
    } else { loadCss(FONTS); loadThree(initThree, function () { msg.textContent = '360 배경을 불러오지 못했습니다'; }); inView = true; setRun(true); }
    return { go: go };
  }

  // ── 정비 VR 패널 ──
  (function () {
    var box = $('vrcBox'); if (!box) return;
    // 팝업 공통 바탕(ui_popup_type02): 반투명 검정 + 모서리 컷 테두리 + 그리드
    var POP2 = {
      477: { bk: 'M33.0867 475.593C30.6057 475.593 27.1646 474.165 25.4125 472.399L3.18182 450.083C1.42972 448.324 0 444.869 0 442.379V4.92478C0 2.20912 2.20064 0 4.90589 0H701.185C703.666 0 707.107 1.42819 708.859 3.19408L729.905 24.3214C731.657 26.0802 733.087 29.5346 733.087 32.0251V443.589C733.087 446.079 731.664 449.534 729.905 451.293L708.873 472.406C707.121 474.165 703.68 475.6 701.199 475.6H33.0867V475.593Z',
             bd: 'M701.616 1.41411C703.929 1.41411 707.16 2.75788 708.793 4.39712L729.839 25.5244C731.472 27.1637 732.811 30.407 732.811 32.7287V444.292C732.811 446.614 731.472 449.857 729.839 451.497L708.807 472.61C707.174 474.249 703.943 475.593 701.63 475.593H33.511C31.1982 475.593 27.9674 474.249 26.3344 472.61L4.10372 450.294C2.47076 448.654 1.13215 445.411 1.13215 443.089V5.63535C1.13215 3.31367 3.02442 1.41411 5.3372 1.41411H701.616ZM701.616 0.00703153H5.3372C2.24649 0.00703153 -0.269531 2.53274 -0.269531 5.63535V443.096C-0.269531 445.791 1.21625 449.393 3.11553 451.3L25.3462 473.616C27.2455 475.523 30.8338 477.014 33.518 477.014H701.637C704.321 477.014 707.91 475.523 709.809 473.616L730.841 452.503C732.741 450.596 734.226 446.994 734.226 444.299V32.7287C734.226 30.0341 732.741 26.432 730.841 24.5254L709.795 3.3981C707.896 1.49151 704.307 0 701.623 0L701.616 0.00703153Z' },
      366: { bk: 'M33.0867 364.237C30.6057 364.237 27.1646 362.809 25.4125 361.043L3.18182 338.727C1.42972 336.968 0 333.514 0 331.023V4.92478C0 2.20912 2.20064 0 4.90589 0H701.185C703.666 0 707.107 1.42819 708.859 3.19408L729.905 24.3214C731.657 26.0802 733.087 29.5346 733.087 32.0251V332.233C733.087 334.724 731.664 338.178 729.905 339.937L708.873 361.05C707.121 362.809 703.68 364.244 701.199 364.244H33.0867V364.237Z',
             bd: 'M701.616 1.41411C703.929 1.41411 707.16 2.75788 708.793 4.39712L729.839 25.5244C731.472 27.1637 732.811 30.407 732.811 32.7287V332.722C732.811 335.044 731.472 338.287 729.839 339.926L708.807 361.039C707.174 362.679 703.943 364.022 701.63 364.022H33.511C31.1982 364.022 27.9674 362.679 26.3344 361.039L4.10372 338.723C2.47076 337.084 1.13215 333.841 1.13215 331.519V5.63535C1.13215 3.31367 3.02442 1.41411 5.3372 1.41411H701.616ZM701.616 0.00703153H5.3372C2.24649 0.00703153 -0.269531 2.53274 -0.269531 5.63535L-0.269531 331.526C-0.269531 334.221 1.21625 337.823 3.11553 339.729L25.3462 362.046C27.2455 363.952 30.8338 365.444 33.518 365.444H701.637C704.321 365.444 707.91 363.952 709.809 362.046L730.841 340.932C732.741 339.026 734.226 335.424 734.226 332.729V32.7287C734.226 30.0341 732.741 26.432 730.841 24.5254L709.795 3.3981C707.896 1.49151 704.307 0 701.623 0L701.616 0.00703153Z' }
    };
    [].forEach.call(document.querySelectorAll('svg.pop2'), function (sv) {
      var h = +sv.dataset.h, P = POP2[h], id = 'gP' + h;
      sv.setAttribute('width', 734); sv.setAttribute('height', h); sv.setAttribute('viewBox', '0 0 734 ' + h);
      sv.innerHTML = '<defs><pattern id="' + id + '" patternUnits="userSpaceOnUse" width="55.25" height="55.25" x="2.9" y="-15.9">' +
        '<path d="M27.625 0V55.25M0 27.625H55.25" stroke="#fff" stroke-width=".53"/><circle cx="27.625" cy="27.625" r="2.05" fill="#fff"/></pattern></defs>' +
        '<g transform="translate(0 1)"><path d="' + P.bk + '" fill="#000" opacity=".8"/><path d="' + P.bk + '" fill="url(#' + id + ')" opacity=".2"/></g>' +
        '<path d="' + P.bd + '" fill="' + sv.dataset.c + '"/>';
    });

    // 1. 제스처 진행: 다섯 칸이 차례로 차고, 손이 벌어지며, 다 차면 청록으로 완료
    var BOX = 'M27.9511 35.0761H7.55434C3.39001 35.0761 0 31.7267 0 27.6124V7.46365C0 3.34931 3.39001 0 7.55434 0H27.9511C32.1154 0 35.5054 3.34931 35.5054 7.46365V27.6124C35.5054 31.7267 32.1154 35.0761 27.9511 35.0761ZM7.55434 3.72872C5.4706 3.72872 3.77717 5.40182 3.77717 7.46054V27.6093C3.77717 29.668 5.4706 31.3411 7.55434 31.3411H27.9511C30.0348 31.3411 31.7282 29.668 31.7282 27.6093V7.46054C31.7282 5.40182 30.0348 3.72872 27.9511 3.72872H7.55434Z';
    var gsBoxes = $('gsBoxes'), gsEls = [];
    [70, 109, 148, 187, 226].forEach(function (x) {
      var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'gs-box'); g.setAttribute('transform', 'translate(' + x + ' 29)');
      g.innerHTML = '<path d="' + BOX + '" fill="#fff"/><rect x="6.5" y="6.5" width="22.5" height="22.1" rx="2.5" fill="#fff"/>';
      gsBoxes.appendChild(g); gsEls.push(g);
    });
    var gsSvg = gsBoxes.ownerSVGElement, gsL = $('gsL'), gsR = $('gsR'), gsT = 0, gsTimer = null;
    function gsShow(k) {
      gsEls.forEach(function (g, i) { g.classList.toggle('on', i < k); });
      var d = Math.min(k, 5) * 3;
      gsL.style.transform = 'translateX(' + (-d) + 'px)'; gsR.style.transform = 'translateX(' + d + 'px)';
      gsSvg.classList.toggle('gs-done', k >= 5);
    }
    function gsRun(on) {
      clearInterval(gsTimer); gsT = 0; gsShow(0);
      if (on && !reduce) gsTimer = setInterval(function () { gsT = (gsT + 1) % 9; gsShow(gsT <= 5 ? gsT : 5); }, 420);
      else if (on) gsShow(5);
    }

    // 2. 튜토리얼: 뒤로 = 이전 안내, Skip = 다음 안내 (피그마 Dialog - Tutorial Step 1~3 문구)
    var TUT = [
      '핸드 그립을 통해 Object를 잡거나, 놓을 수 있습니다.\nCube를 자유롭게 조작해보세요.\n\n핸드 트래킹에 적응 되셨다면 NEXT버튼을 선택하세요.\n\n핸드 트래킹 가이드를 넘어가고 싶으시다면 \nSKIP 버튼을 누르세요.',
      'Maintenance에 필요한 Menu를 활성화 시켜보겠습니다.\n\n양 손바닥을 맞댄 후 서로 반대 방향으로 \n움직여 Menu를 활성화 시키세요.',
      '활성화된 Menu를 닫아보겠습니다.\n활성화된 Menu의 양 끝에 손바닥을 갖다 댄 후\n손바닥을 박수를 치듯 모아 닫아주세요.'
    ];
    var tutStep = 0, tutBody = $('tutBody'), tutBusy = null;
    tutBody.textContent = TUT[0];
    // 2·3단계에는 피그마처럼 제스처 손 아이콘(ui_ic_gesture_hand, 203,321)이 함께 나온다
    var tutGs = gsSvg.cloneNode(true); tutGs.removeAttribute('role'); tutGs.removeAttribute('aria-label'); tutGs.setAttribute('aria-hidden', 'true');
    [].forEach.call(tutGs.querySelectorAll('[id]'), function (e) { e.removeAttribute('id'); });
    tutGs.setAttribute('class', 'abs tut-body is-out'); tutGs.style.left = '203px'; tutGs.style.top = '321px';
    $('pnTut').appendChild(tutGs);
    function tutGo(k) {
      k = (k + TUT.length) % TUT.length; if (k === tutStep) return; tutStep = k;
      clearTimeout(tutBusy); tutBody.classList.add('is-out');
      tutGs.classList.add('is-out');
      tutBusy = setTimeout(function () { tutBody.textContent = TUT[k]; tutBody.classList.remove('is-out'); tutGs.classList.toggle('is-out', k === 0); }, reduce ? 0 : 200);
    }
    $('tutBack').addEventListener('click', function () { if (tutStep > 0) tutGo(tutStep - 1); });
    $('tutSkip').addEventListener('click', function () { tutGo(tutStep + 1); });

    // 3. Type list
    var SH_DEF = '<svg class="sh-def" width="256" height="276" viewBox="0 0 256 276"><path d="M238.641 0.5L255.499 17.5195L255.313 256.333L238.437 275.5H17.3779L0.5 256.333L0.685547 17.5186L17.5459 0.5H238.641Z" fill="black" fill-opacity="0.6" stroke="#9F9F9F"/></svg>';
    function shSel(i) { var f = 'fTlSel' + i; return '<svg class="sh-sel" width="256" height="276" viewBox="0 0 256 276"><defs><filter id="' + f + '" x="0" y="0" width="256" height="276" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="10"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.372549 0 0 0 0 0 0 0 0 1 0"/><feBlend mode="normal" in2="shape" result="is"/></filter></defs><g filter="url(#' + f + ')"><path d="M17.338 0H238.848L256 17.314L255.814 256.522L238.662 276H17.1518L0 256.522L0.186162 17.314L17.338 0Z" fill="#FF5F00" fill-opacity="0.6"/></g><path d="M238.431 1L254.999 17.7236L254.813 256.145L238.21 275H17.6035L1 256.144L1.18555 17.7246L17.7559 1H238.431Z" stroke="#FF5F00" stroke-width="2" fill="none"/></svg>'; }
    var LOCK = '<svg class="lock" width="60" height="60" viewBox="0 0 60 60"><path d="M45 20H42.5V15C42.5 8.1 36.9 2.5 30 2.5C23.1 2.5 17.5 8.1 17.5 15V20H15C12.25 20 10 22.25 10 25V50C10 52.75 12.25 55 15 55H45C47.75 55 50 52.75 50 50V25C50 22.25 47.75 20 45 20ZM30 42.5C27.25 42.5 25 40.25 25 37.5C25 34.75 27.25 32.5 30 32.5C32.75 32.5 35 34.75 35 37.5C35 40.25 32.75 42.5 30 42.5ZM37.75 20H22.25V15C22.25 10.725 25.725 7.25 30 7.25C34.275 7.25 37.75 10.725 37.75 15V20Z" fill="white"/></svg>';
    var TYPES = [
      { n: 'Wheel Excavator', v: '0 0 120 120', d: '<path d="M112.853 75.8595H101.107C101.107 84.224 91.3175 88.9247 87.0117 92.2472V97.1582H108.155C114.977 97.1582 120.002 91.8104 120.002 85.387C120.002 80.6783 115.203 75.8611 112.854 75.8611L112.853 75.8595Z"/><path d="M101.095 71.1507H112.764L93.9782 21.5962L82.2229 21.703L84.0191 26.4085L65.7793 54.6498V73.4817L88.5476 38.2734L101.095 71.1507Z"/><path d="M31.3646 73.5222L61.1581 73.4688V42.8949L49.4124 38.1862H30.619V57.0229L2.40234 57.0342L2.42978 73.4753L31.3662 73.5238L31.3646 73.5222ZM42.2856 42.8836L54.0313 47.5811V66.4178L42.2856 68.6872V42.8836Z"/><path d="M25.9887 87.7552V87.7682H37.9296V87.7552C37.9296 84.1755 39.1545 80.874 41.2074 78.2584H22.7109C24.7638 80.874 25.9887 84.1755 25.9887 87.7552Z"/><path d="M53.2962 77.1097C47.4395 77.1097 42.6738 81.8865 42.6738 87.7566C42.6738 93.6268 47.4395 98.4036 53.2962 98.4036C59.1529 98.4036 63.9186 93.6268 63.9186 87.7566C63.9186 81.8865 59.1529 77.1097 53.2962 77.1097ZM53.2962 93.6479C50.0556 93.6479 47.4186 91.0047 47.4186 87.7566C47.4186 84.5085 50.0556 81.8654 53.2962 81.8654C56.5369 81.8654 59.1739 84.5085 59.1739 87.7566C59.1739 91.0047 56.5369 93.6479 53.2962 93.6479Z"/><path d="M10.6224 77.1097C4.76572 77.1097 0 81.8865 0 87.7566C0 93.6268 4.76572 98.4036 10.6224 98.4036C16.4791 98.4036 21.2448 93.6268 21.2448 87.7566C21.2448 81.8865 16.4791 77.1097 10.6224 77.1097ZM10.6224 93.6479C7.38178 93.6479 4.74474 91.0047 4.74474 87.7566C4.74474 84.5085 7.38178 81.8654 10.6224 81.8654C13.863 81.8654 16.5017 84.5085 16.5017 87.7566C16.5017 91.0047 13.8647 93.6479 10.6224 93.6479Z"/>' },
      { n: 'Crawler Dozer', v: '0 0 120 120', d: '<path d="M16.8652 67.0145H21.0211V67.0087L53.0309 66.9493V66.9666H75.3367L75.3137 47.455L52.9811 41.8723V30.7031L39.0215 25.1204H16.6888V41.8703L5.52148 41.8243L5.54258 67.0145H16.8633H16.8652ZM30.6695 30.6704L44.6272 36.2531V58.5858L30.6695 61.382V30.6704Z"/><path d="M103.25 83.7146L103.215 60.6416L114.417 41.8396H106.042L94.875 58.5896L94.8405 72.5147H80.8828L86.5019 83.7146H94.8462L94.875 94.8799H114.417L120 89.2973L103.25 83.7146Z"/><path d="M75.3673 72.5991L5.54433 72.5492L0 83.7855L5.54433 94.8819H75.3347L80.9193 83.7759L75.3711 72.5991H75.3653H75.3673ZM70.9506 87.8148H9.90731L7.92815 83.8009L9.96868 79.7045H70.9659L72.9815 83.7606L70.9506 87.8167V87.8148Z"/>' },
      { n: 'Crawler Excavator', v: '0 0 181 180', d: '<path d="M149.24 107.677H166.912L131.571 28.125H113.899L117.004 35.1144L87.3926 81.0583V112.098L125.195 53.5533L149.24 107.677Z"/><path d="M30.5577 112.183L78.5573 112.095V63.5728L60.8882 54.6433H34.3846V85.5641L7.875 85.5823L7.92052 112.107L30.5577 112.183ZM47.6349 63.4817L69.7227 72.3202V99.051L47.6349 103.256V63.4817Z"/><path d="M166.912 116.518H149.24C149.24 130.306 134.26 137.559 127.152 143.037V151.875H160.603C171.865 151.875 180.166 144.785 180.166 134.195C180.166 126.435 170.791 116.515 166.912 116.515V116.518Z"/><path d="M8.06367 120.827L0 136.153L7.93924 151.423H81.969L90.0478 136.144L82.0145 120.83H8.06367V120.827ZM75.9963 141.497H13.9604L11.1957 136.178L14.0545 130.746H76.0206L78.84 136.12L75.9963 141.497Z"/>', sel: true },
      { n: 'Wheel Loader', v: '0 0 120 120', lock: true, d: '<path d="M98.0835 55.644H72.2441V62.9647H79.5994V87.4156H115.109L120 82.5284L98.0835 55.644Z"/><path d="M16.0902 63.062H19.7309V63.057L47.7728 63.005V63.0201H67.3135L67.2934 45.9453L47.7291 41.0598V31.2855L35.5016 26.4H15.9373V41.0581L6.1543 41.0178L6.17278 63.062H16.0902ZM28.1832 31.257L40.4107 36.1424V55.686L28.1832 58.1329V31.257Z"/><path d="M59.9983 66.6906C52.5725 66.6906 46.5293 72.7256 46.5293 80.1453C46.5293 87.565 52.5708 93.6001 59.9983 93.6001C67.4259 93.6001 73.4674 87.565 73.4674 80.1453C73.4674 72.7256 67.4259 66.6906 59.9983 66.6906ZM59.9983 87.5918C55.8889 87.5918 52.5439 84.2521 52.5439 80.1453C52.5439 76.0386 55.8872 72.6988 59.9983 72.6988C64.1094 72.6988 67.4528 76.0386 67.4528 80.1453C67.4528 84.2521 64.1094 87.5918 59.9983 87.5918Z"/><path d="M13.469 66.6167C6.0415 66.6167 0 72.6518 0 80.0715C0 87.4911 6.0415 93.5262 13.469 93.5262C20.8966 93.5262 26.9381 87.4911 26.9381 80.0715C26.9381 72.6518 20.8966 66.6167 13.469 66.6167ZM13.469 87.518C9.35962 87.518 6.01462 84.1782 6.01462 80.0715C6.01462 75.9647 9.35794 72.6249 13.469 72.6249C17.5802 72.6249 20.9235 75.9647 20.9235 80.0715C20.9235 84.1782 17.5802 87.518 13.469 87.518Z"/><path d="M28.6465 67.8082C30.891 70.5757 32.3947 73.9658 32.8517 77.6748H40.6253C41.0974 73.9608 42.6195 70.5707 44.8809 67.8082H28.6465Z"/>' },
      { n: 'Compact \nTrack Loader', v: '0 0 120 120', lock: true, d: '<path d="M23.5574 69.546C16.9149 69.546 11.5098 74.9511 11.5098 81.5936C11.5098 88.2361 16.9149 93.6412 23.5574 93.6412C30.1998 93.6412 35.6049 88.2361 35.6049 81.5936C35.6049 74.9511 30.1998 69.546 23.5574 69.546ZM23.5574 88.2599C19.8819 88.2599 16.8911 85.269 16.8911 81.5936C16.8911 77.9182 19.8819 74.9274 23.5574 74.9274C27.2328 74.9274 30.2254 77.9182 30.2254 81.5936C30.2254 85.269 27.2346 88.2599 23.5574 88.2599Z"/><path d="M64.0273 65.4863L98.7113 65.4241V65.4406H120.001L119.979 46.8182L98.6637 41.49V30.8298L85.3422 25.5016H64.0273V65.4863ZM77.369 30.7987L90.6906 36.127V57.4418L77.369 60.1105V30.7987Z"/><path d="M0 41.4882V59.7591L18.6589 65.4644H58.6968V41.4882H0Z"/><path d="M67.9343 81.5919V81.6065H81.4773V81.5919C81.4773 77.5413 82.8666 73.8054 85.1948 70.8457H64.2168C66.545 73.8054 67.9343 77.5413 67.9343 81.5919Z"/><path d="M98.905 69.546C92.2625 69.546 86.8574 74.9511 86.8574 81.5936C86.8574 88.2361 92.2625 93.6412 98.905 93.6412C105.547 93.6412 110.953 88.2361 110.953 81.5936C110.953 74.9511 105.547 69.546 98.905 69.546ZM98.905 88.2599C95.2296 88.2599 92.2388 85.269 92.2388 81.5936C92.2388 77.9182 95.2296 74.9274 98.905 74.9274C102.58 74.9274 105.571 77.9182 105.571 81.5936C105.571 85.269 102.58 88.2599 98.905 88.2599Z"/><path d="M50.5066 69.546C43.8641 69.546 38.459 74.9511 38.459 81.5936C38.459 88.2361 43.8641 93.6412 50.5066 93.6412C57.149 93.6412 62.5542 88.2361 62.5542 81.5936C62.5542 74.9511 57.149 69.546 50.5066 69.546ZM50.5066 88.2599C46.8312 88.2599 43.8403 85.269 43.8403 81.5936C43.8403 77.9182 46.8312 74.9274 50.5066 74.9274C54.182 74.9274 57.1747 77.9182 57.1747 81.5936C57.1747 85.269 54.1838 88.2599 50.5066 88.2599Z"/>' },
      { n: 'Articulated\nDump Truck', v: '-5 -24 141 120', line: 1, lock: true, d: 'M41.2953 25.5738C41.2953 25.5738 38.7199 39.73 38.5568 39.5497C38.3937 39.3695 15.0004 39.5497 15.0004 39.5497L17.1208 26.9731L18.3913 25.4279L37.0717 18.1223H57.0225L62.1734 6.22388C62.1734 6.22388 58.1042 4.0262 57.7952 4.1378C57.4861 4.2494 40.4025 6.3269 40.4025 6.3269L40.0506 5.19372L57.4003 2.00879L75.3509 7.23688|M14.2878 41.5672H10.2874L10.8539 47.01L20.795 53.6631H56.207L61.5038 49.8V41.0693L14.2878 41.5672Z|M15.7902 39.5498V41.5586|M37.8959 39.5498V41.3183|M14.554 41.5585C14.4721 42.1595 14.4721 42.7689 14.554 43.3699C14.7171 43.533 38.9604 43.3699 38.9604 43.3699V41.3096|M19.8851 41.5586V43.6361|M21.4819 41.4985V43.6361|M28.5128 41.5586V43.4472|M30.058 41.5586V43.4215|M38.9603 43.3701L41.3469 53.6632|M42.978 43.6445V47.8081H47.2017L47.8971 47.1128H49.1762L50.0347 43.6445H42.978Z|M10.4248 42.9062L12.777 43.6445V46.7093L10.7167 45.722|M16.6057 50.856V53.3627H20.3486|M18.151 27.8662C18.005 28.1152 16.8633 37.4296 16.8633 37.4296H35.4921L37.6211 27.8662H18.151Z|M23.1559 30.6475C23.1559 30.7934 22.8555 32.9224 22.8555 32.9224H29.1051L29.5945 30.6475H23.1559Z|M18.3914 25.4282C18.9408 25.2135 41.3555 25.4282 41.3555 25.4282L57.0226 18.1226|M59.9414 18.7578L61.1261 24.5353L68.4746 23.6682V7.03106L64.208 6.38721L59.9414 18.7578Z|M41.965 6.12939L37.0631 18.1222|M69.6163 7.23682L72.5266 8.23264L72.7841 22.7837L69.9168 23.3933L69.6163 7.23682Z|M44.9096 37.4296L45.7681 29.7033L57.7352 24.0374L57.8811 20.2344C57.8811 20.2344 42.7119 27.1021 42.5746 27.0077C42.4372 26.9133 40.7117 37.4296 40.7117 37.4296H44.9096Z|M57.3145 52.8559L60.7655 53.6628H65.633V50.8556L72.7841 49.1215L76.527 34.9653H85.7384L87.9447 48.5206H86.4252|M48.6869 41.0693V36.9143L56.705 34.6308L64.9721 33.7723C64.9721 33.2486 67.3071 26.75 67.3071 26.75H84.7084L88.7861 33.3602L89.3183 36.9143|M38.7629 38.8545H48.6869|M36.4106 53.6631V55.5861H55.3571V53.6631|M36.4193 54.9421C35.4279 55.5915 34.3891 56.1654 33.3116 56.6591V59.0886H59.9243V56.2556L55.34 54.6245|M59.9414 59.0886C60.4124 58.4436 60.9349 57.8378 61.5038 57.2773V53.6631|M75.351 26.415V5.30518H79.4716V26.767|M79.4717 9.49463H94.7696L102.659 16.4311L120.764 20.4916V26.7413H118.781L113.527 34.9655H106.986L102.719 38.5367H101.045V27.8745H98.3752L89.3183 36.94V47.3618L88.0392 48.6152|M107.003 17.4097V21.247L113.441 26.4236L118.781 26.7413|M101.045 28.4754C101.045 28.2608 107.003 25.0415 107.003 25.0415V21.2471|M22.1172 23.9686C22.2288 23.9257 22.1172 18.998 22.1172 18.998H23.4392V23.4449|M22.1171 18.9981H20.4001V8.08693L21.2586 7.45166H24.5551V18.9981H23.4391|M20.4001 8.78223H23.2245V18.998|M20.4001 11.6323H21.25|M20.4001 13.4009H21.25|M20.4001 15.1777H21.25|M79.4716 12.1304H77.7031|M77.7031 16.019H79.4716H100.118V24.5351H79.4716|M79.4716 20.0024H77.7031|M47.3992 3.84584V2.64398H45.1757C45.1757 2.64398 44.4804 1.2876 45.1757 1.2876H50.0089V3.3651|M61.8901 3.31366V1.78558H64.1136C64.1136 1.78558 64.8089 0.429199 64.1136 0.429199H59.2804V2.5067|M80.8881 63.4152C82.8083 63.4152 84.3649 60.2712 84.3649 56.3929C84.3649 52.5146 82.8083 49.3706 80.8881 49.3706C78.9679 49.3706 77.4113 52.5146 77.4113 56.3929C77.4113 60.2712 78.9679 63.4152 80.8881 63.4152Z|M107.87 58.2558C108.88 58.2558 109.698 55.6422 109.698 52.4182C109.698 49.1942 108.88 46.5806 107.87 46.5806C106.86 46.5806 106.041 49.1942 106.041 52.4182C106.041 55.6422 106.86 58.2558 107.87 58.2558Z|M117.021 56.6934C117.87 56.6934 118.558 54.4295 118.558 51.637C118.558 48.8444 117.87 46.5806 117.021 46.5806C116.172 46.5806 115.484 48.8444 115.484 51.637C115.484 54.4295 116.172 56.6934 117.021 56.6934Z|M107.089 64.9091C109.744 64.9091 111.896 59.2322 111.896 52.2294C111.896 45.2267 109.744 39.5498 107.089 39.5498C104.434 39.5498 102.281 45.2267 102.281 52.2294C102.281 59.2322 104.434 64.9091 107.089 64.9091Z|M111.381 46.3573C112.239 42.4684 113.871 39.584 115.673 39.584C118.326 39.584 120.481 45.2671 120.481 52.2636C120.481 59.2602 118.326 64.9432 115.673 64.9432C113.802 64.9432 112.171 62.1103 111.381 57.9724|M115.673 39.5498H98.5039C95.8512 39.5498 92.8466 45.2329 92.8466 52.2294C92.8466 59.226 95.8512 64.9091 98.5039 64.9091H115.673|M80.2014 71.5706C84.2978 71.5706 87.6186 64.7407 87.6186 56.3156C87.6186 47.8905 84.2978 41.0605 80.2014 41.0605C76.105 41.0605 72.7842 47.8905 72.7842 56.3156C72.7842 64.7407 76.105 71.5706 80.2014 71.5706Z|M63.4525 53.6631C63.3839 54.5216 63.3409 55.38 63.3409 56.3158C63.3409 64.746 66.6632 71.5708 70.7581 71.5708H80.2013|M43.7077 59.0886C43.0724 66.1882 40.0506 71.5708 36.4193 71.5708C32.3244 71.5708 29.0021 64.703 29.0021 56.3158V53.6631|M19.6706 53.6631C19.6019 54.5216 19.559 55.38 19.559 56.3158C19.559 64.746 22.8812 71.5708 26.9762 71.5708H36.4193|M80.2013 41.0605H74.9131|M88.6229 48.0488L89.9106 52.9507H92.838|M111.896 34.9653L109.561 37.3004H104.024' },
      { n: 'Special\nEquipment', v: '-5 -12 140 120', line: 1, lock: true, d: 'M9.1901 47.5956H5.19245L2.42554 42.6187L5.19245 12.6768|M24.3812 17.3124L23.7613 9.32609L19.027 0.576172|M59.7941 21.0495L19.027 0.576172|M79.7015 43.6967L59.7941 21.0493|M79.7823 18.7769V44.4697H91.362L92.2064 42.116H94.7488V39.5737L102.097 33.2673V21.5618L97.2192 19.9987H91.5507V18.3008H79.7823V18.7769Z|M80.9412 40.8489H88.694L91.389 38.9714V22.1094H80.9412V40.8489Z|M92.9341 21.5527H97.8391L100.462 22.6667V32.5934L94.102 38.0015H92.9341V21.5527Z|M91.5507 18.7051H96.8779L102.816 20.367V33.6356L95.5124 40.0409V41.9274|M102.816 57.9805H110.452L115.411 60.5857V71.4198H91.362|M102.816 55.7437H107.847L108.745 57.9805|M102.816 53.3721H106.391L107.182 54.522V55.7437|M99.4651 19.4238V14.9141H100.462V19.7112|M94.3895 74.1152H117.199C117.199 74.1152 129.551 78.059 129.551 83.2514V89.6567C129.412 90.7489 128.865 91.7482 128.021 92.4546C127.176 93.1609 126.096 93.522 124.996 93.4657H116.219L83.8788 87.5725|M48.1964 22.7117L49.0498 20.2323L38.8266 14.6895L37.9373 17.2677L48.1964 22.7117Z|M24.3812 17.3125L54.1345 32.6293L68.4901 43.149|M70.9426 44.3706L79.7823 54.0458|M64.0972 30.9941L79.6655 61.4122|M77.3119 59.6606L62.6778 32.0903|M83.4656 19.2979H81.3455V20.7622H83.4656V19.2979Z|M89.754 19.2979H87.6339V20.7622H89.754V19.2979Z|M78.1653 74.1152L78.9199 75.9658H93.2486L93.8684 74.1152|M93.2486 75.9658H104.343L107.694 79.137V81.0595H83.8788|M93.6438 74.7979L109.545 75.0404C109.545 75.0404 118.896 80.2688 118.896 82.5776C118.896 82.5776 119.355 88.2371 118.896 88.9648C118.896 88.9648 117.747 91.9563 113.506 91.4982L83.8788 86.3506|M76.3596 75.2827C76.3596 75.2827 83.9237 79.5858 83.9237 82.3617V93.088C83.9237 93.088 83.4207 95.4417 81.6599 95.4417H70.9696L52.8589 88.6052C52.8589 88.6052 52.1581 88.0482 52.1581 86.2426V78.5168C52.1581 78.5168 53.1373 75.6241 55.0508 75.6241L76.3596 75.2827Z|M61.9232 65.6885V72.2374L62.6239 72.7675H69.4334L70.6641 71.4199V67.4133L69.5142 65.6885H61.9232Z|M61.9232 70.4048H70.6641|M65.4806 75.4536L72.0655 81.0593C72.693 81.8178 73.0389 82.7699 73.0447 83.7544V92.657C73.0447 92.657 73.1166 95.2891 71.248 95.4059|M63.3336 32.3778C63.8297 32.3778 64.2319 31.9755 64.2319 31.4794C64.2319 30.9833 63.8297 30.5811 63.3336 30.5811C62.8374 30.5811 62.4352 30.9833 62.4352 31.4794C62.4352 31.9755 62.8374 32.3778 63.3336 32.3778Z|M58.3477 38.5762L61.9231 46.6523H62.6778L63.3336 45.6552L60.2343 40.0944|M73.9341 65.6886L62.6778 46.6616|M61.9231 46.6616C61.9231 46.6616 61.3572 48.3326 61.3572 48.5122C61.3572 48.6919 72.4248 68.4556 72.4248 68.4556H73.6645L73.9341 65.6886L74.9851 64.952L75.7128 59.2295H71.7421|M63.3336 45.6553L65.0314 46.2482L74.8594 64.7003|M68.0229 60.5859C67.516 61.3341 66.9352 62.0293 66.2891 62.6611V65.6886|M66.2891 62.6611H69.1818|M69.7119 72.4619H76.7639|M75.7128 59.2295H76.7639|M73.6735 68.4556V72.4622|M90.9398 75.9658V81.0595|M102.816 61.7446H115.411|M9.19009 52.9499C9.19009 52.9499 11.0946 10.6107 11.0946 10.3592L19.027 0.576172L11.939 0.701941L5.19244 10.7275V12.6859C5.19244 12.6859 7.46527 12.3625 8.22886 13.2339L9.42366 16.0457L7.46527 42.556C7.46527 42.556 9.26196 47.5149 9.19009 47.9461|M9.19013 52.9499V67.9433H4.92297L5.19248 47.5957|M79.7823 61.5112L76.5663 59.1037C66.2622 42.5112 53.9997 35.5669 53.9997 35.5669L24.3542 17.3125L18.4521 30.7877C18.4521 30.7877 11.5438 67.2158 11.8852 67.9434H9.19012|M6.39626 68.0244L4.92297 76.5587L9.19013 76.7294H13.628|M9.3608 77.1426C9.42368 78.517 9.3608 77.6636 9.3608 92.3157L8.79484 94.1124L8.08514 92.4324V76.9629|M5.03972 76.729C4.97683 76.8727 0.547974 85.6227 0.547974 85.6227L6.42317 94.8128|M5.88418 76.729L2.42554 85.7664L6.0908 94.3636|M12.523 76.729L14.8946 85.8472L11.1485 94.8128|M12.8105 76.855L16.7901 85.7756L11.2383 94.6153|M11.409 68.0244L13.4482 76.7294|M79.7823 44.4697V71.4202H76.3596L77.258 74.1152H94.4344C94.4344 74.1152 95.3327 71.4202 95.5573 71.4202|M91.362 44.4697V70.962|M79.7823 64.233H91.362L102.816 61.7446V33.6353' }
    ];
    var tlRow = $('tlRow'), tlItems = TYPES.map(function (t, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tl-it'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', t.n.replace(/\s+/g, ' ') + (t.lock ? ' (잠김)' : ''));
      if (t.lock) b.setAttribute('aria-disabled', 'true');
      b.innerHTML = SH_DEF + shSel(i) + '<div class="gl gl1"></div><div class="gl gl2"></div>' +
        '<div class="ico">' + (t.line
          ? '<svg viewBox="' + t.v + '" fill="none" stroke="' + (t.lock ? '#4F4F4F' : '#fff') + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">' + t.d.split('|').map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</svg>'
          : '<svg viewBox="' + t.v + '" fill="' + (t.lock ? '#4F4F4F' : '#fff') + '">' + t.d + '</svg>') + '</div>' +
        '<div class="lb">' + t.n + '</div>' + (t.lock ? LOCK : '');
      b.addEventListener('click', function () { if (!t.lock) tlSelect(i); });
      tlRow.appendChild(b); return b;
    });
    function tlSelect(k) { tlItems.forEach(function (b, i) { var on = i === k; b.classList.toggle('is-sel', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }); }
    tlSelect(2);
    tlRow.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); e.stopPropagation();
      var cur = tlItems.indexOf(document.activeElement), d = e.key === 'ArrowRight' ? 1 : -1;
      for (var k = cur + d; k >= 0 && k < tlItems.length; k += d) if (!TYPES[k].lock) { tlSelect(k); tlItems[k].focus(); break; }
    });

    // 사양 표: 피그마 막대(길이 167 / 트랙 452)가 보여 주는 만큼 행이 이어지도록, 피그마 6행을 차례로 이어 16행으로 채운다
    [].forEach.call(document.querySelectorAll('#dmScroll tbody'), function (tb) {
      var src = [].slice.call(tb.rows);
      for (var k = src.length; k < 16; k++) { var r = src[k % src.length].cloneNode(true); r.classList.remove('h68'); tb.appendChild(r); }
    });
    bindScroll(tlRow, $('tlThumb'), 'x', 76, 1312);
    (function () {
      var dr = null, dragged = false;
      tlRow.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch' || e.button !== 0) return;
        dr = { x: e.clientX, l: tlRow.scrollLeft, id: e.pointerId }; dragged = false;
      });
      tlRow.addEventListener('pointermove', function (e) {
        if (!dr || e.pointerId !== dr.id) return;
        var dx = e.clientX - dr.x;
        if (!dragged && Math.abs(dx) > 5) { dragged = true; tlRow.setPointerCapture(e.pointerId); tlRow.classList.add('is-drag'); }
        if (dragged) tlRow.scrollLeft = dr.l - dx / scaleOf(tlRow);
      });
      function end() { dr = null; tlRow.classList.remove('is-drag'); }
      tlRow.addEventListener('pointerup', end); tlRow.addEventListener('pointercancel', end);
      tlRow.addEventListener('click', function (e) { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    })();
    bindScroll($('dmScroll'), $('dmThumb'), 'y', 198, 452);
    engine(box, {
      pano: 'assets/pano/vr-maint-360.webp?v=7', base: 180, step: 14,
      fonts: 'https://fonts.googleapis.com/css2?family=Exo:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap',
      onCenter: function (k) { gsRun(k === 0); var pw = $('pnWarn'); pw.classList.remove('play'); if (k === 3) replay(pw, 'play'); },
      onRun: function (on, k) { gsRun(on && k === 0); }
    });
  })();

  // ── 마약 예방 VR(MCU) 패널 ──
  (function () {
    var box = $('mcuBox'); if (!box) return;
    // 1. 콘텐츠 안내: 동의 체크해야 '체험 시작'이 켜진다. 누르면 팝업이 닫혔다가 다시 열린다(시연용)
    var agree = $('mcuAgree'), start = $('mcuStart'), alertPn = $('mcuAlert'), scroller = $('mcuAlertScroll');
    function setAgree(on) { agree.classList.toggle('is-on', on); agree.setAttribute('aria-checked', on ? 'true' : 'false'); start.disabled = !on; }
    agree.addEventListener('click', function () { setAgree(!agree.classList.contains('is-on')); });
    start.addEventListener('click', function () {
      if (alertPn.dataset.busy) return; alertPn.dataset.busy = 1;
      alertPn.classList.add('is-closing');
      setTimeout(function () { alertPn.style.visibility = 'hidden'; alertPn.classList.remove('is-closing'); setAgree(false); scroller.scrollTop = 0; }, reduce ? 0 : 260);
      setTimeout(function () { alertPn.style.visibility = ''; replay(alertPn, 'is-opening'); delete alertPn.dataset.busy; }, reduce ? 300 : 1000);
    });
    bindScroll(scroller, $('mcuAlertThumb'), 'y', 155, 500);

    // 2. 가이드 스크립트: 글자가 한 자씩 쳐지고, 다 쳐지면 잠시 뒤 다시. 누르면 바로 끝까지 보인다
    var LINE = '조작법은 플레이 중 [메뉴 > 조작법]에서도 확인할 수 있습니다.\n확인 후 닫기 버튼을 눌러주세요.';
    var typed = $('mcuTyped'), typedP = typed.parentNode, tyN = 0, tyTimer = null;
    function tyStop() { clearTimeout(tyTimer); tyTimer = null; }
    function tyFull() { tyStop(); typed.textContent = LINE; typedP.classList.add('done'); }
    function tyStep() {
      tyN++; typed.textContent = LINE.slice(0, tyN);
      if (tyN >= LINE.length) { typedP.classList.add('done'); tyTimer = setTimeout(tyStart, 2600); return; }
      tyTimer = setTimeout(tyStep, LINE.charAt(tyN - 1) === '\n' ? 260 : 55);
    }
    function tyStart() { tyStop(); tyN = 0; typed.textContent = ''; typedP.classList.remove('done'); tyTimer = setTimeout(tyStep, 300); }
    function tyRun(on) { if (on && !reduce) tyStart(); else tyFull(); }
    $('mcuScript').addEventListener('click', function () { if (!typedP.classList.contains('done')) tyFull(); });
    tyFull();

    // 3·4. OX 퀴즈 → 퀴즈 해설: 고르면 표시가 잠깐 남고 해설 카드로 넘어가 정답·오답을 보여 준다(이 문항의 답은 O)
    var api = null, res = $('mcuResult'), resT = res.querySelector('.mc-res-t'), oxBtns = [].slice.call(document.querySelectorAll('#mcuOx .mc-ox'));
    function showResult(ok) {
      res.classList.toggle('is-ng', !ok); resT.textContent = ok ? '정답입니다!' : '오답입니다!';
      res.classList.remove('pop'); void res.offsetWidth; res.classList.add('pop');
    }
    oxBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        if ($('mcuOx').dataset.busy) return; $('mcuOx').dataset.busy = 1;
        oxBtns.forEach(function (o) { o.classList.toggle('is-picked', o === b); });
        setTimeout(function () { showResult(b.dataset.ans === 'o'); if (api) api.go(3); }, reduce ? 0 : 450);
        setTimeout(function () { oxBtns.forEach(function (o) { o.classList.remove('is-picked'); }); delete $('mcuOx').dataset.busy; }, reduce ? 0 : 1400);
      });
    });
    $('mcuNext').addEventListener('click', function () { if (api) api.go(2); });

    // 5. 메뉴: 이어하기 = 닫혔다 다시 열림, 조작법 = 가이드 카드로, 메인 화면으로 이동 = 첫 카드로
    var menu = $('mcuMenu');
    [].forEach.call(menu.querySelectorAll('[data-menu]'), function (b) {
      b.addEventListener('click', function () {
        var m = b.dataset.menu;
        if (m === 'guide') { if (api) api.go(1); return; }
        if (m === 'main') { if (api) api.go(0); return; }
        if (menu.dataset.busy) return; menu.dataset.busy = 1;
        menu.classList.add('is-closing');
        setTimeout(function () { menu.style.visibility = 'hidden'; menu.classList.remove('is-closing'); }, reduce ? 0 : 260);
        setTimeout(function () { menu.style.visibility = ''; replay(menu, 'is-opening'); delete menu.dataset.busy; }, reduce ? 300 : 1000);
      });
    });

    api = engine(box, {
      pano: 'assets/pano/mcu-360.webp?v=2', base: 180, step: 14, fonts: '',
      onCenter: function (k) { tyRun(k === 1); },
      onRun: function (on, k) { if (on && k === 1) tyRun(true); else if (!on) tyFull(); }
    });
  })();

  // ── 삼성전자서비스 XR 패널: 패널 동작은 ds-real/samsung-xr.js 가 맡고, 여기서는 360 배경과 카드 슬라이드만 ──
  (function () {
    var box = $('sxBox'); if (!box) return;
    engine(box, { pano: 'assets/pano/samsung-xr-360.webp?v=1', base: 180, step: 14, fonts: '' });
  })();

})();
