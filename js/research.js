/* ==========================================================================
   APPLIED RESEARCH — scroll-driven visual.
   110 points move between six formations as the reader moves through the
   stages:  Challenge (tangle) → Evidence (scatter) → Method (lattice) →
   Analysis (signal) → Solution (framework) → Impact (ascending columns).
   ========================================================================== */
(function () {
  'use strict';
  var canvas = document.getElementById('researchCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var frameEl = canvas.parentElement;
  var steps = Array.prototype.slice.call(document.querySelectorAll('.rstep'));
  var ticks = Array.prototype.slice.call(document.querySelectorAll('.research__ticks button'));
  var elIdx = document.getElementById('rsIdx'), elName = document.getElementById('rsName');
  var NAMES = ['Challenge', 'Evidence', 'Method', 'Analysis', 'Solution', 'Impact'];
  function rsName(i) { return (window.DBA && window.DBA.t) ? window.DBA.t('rs.' + i) : NAMES[i]; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = 110;

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { return t * t * (3 - 2 * t); };
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }

  /* ---------- formations in unit space ---------- */
  var F = [], LK = [];
  (function buildForms() {
    var r = rng(5), i;

    // 0 — Challenge: a tangle
    var f0 = [], l0 = [];
    for (i = 0; i < N; i++) {
      var t = i / N * Math.PI * 2;
      f0.push([.5 + .3 * Math.sin(3 * t + .7) + .07 * (r() - .5), .5 + .3 * Math.sin(2 * t) + .07 * (r() - .5)]);
      l0.push([i, (i + 1) % N]);
      if (i % 6 === 0) l0.push([i, (i + 37) % N]);
    }
    F.push(f0); LK.push(l0);

    // 1 — Evidence: scattered points in loose clusters
    var f1 = [], centers = [[.24, .3], [.72, .24], [.5, .55], [.25, .78], [.77, .74]];
    for (i = 0; i < N; i++) {
      var c = centers[i % 5];
      f1.push([clamp(c[0] + gauss(r) * .14, .05, .95), clamp(c[1] + gauss(r) * .13, .07, .93)]);
    }
    F.push(f1); LK.push([]);

    // 2 — Method: a lattice
    var f2 = [], l2 = [], cols = 11, rows = 10;
    for (i = 0; i < N; i++) {
      var cc = i % cols, rr = Math.floor(i / cols);
      f2.push([.07 + .86 * cc / (cols - 1), .08 + .84 * rr / (rows - 1)]);
      if (cc < cols - 1) l2.push([i, i + 1]);
      if (rr < rows - 1) l2.push([i, i + cols]);
    }
    F.push(f2); LK.push(l2);

    // 3 — Analysis: signal around a trend
    var f3 = [];
    for (i = 0; i < N; i++) {
      var u = i / (N - 1);
      f3.push([.09 + .82 * u, clamp(.84 - .66 * u + gauss(r) * .075, .06, .92)]);
    }
    F.push(f3); LK.push([]);

    // 4 — Solution: a framework (tree with satellites)
    var f4 = [], l4 = [];
    f4.push([.5, .13]);
    for (i = 0; i < 3; i++) { f4.push([.2 + i * .3, .33]); l4.push([1 + i, 0]); }
    for (i = 0; i < 9; i++) { f4.push([.06 + .88 * (i + .5) / 9, .54]); l4.push([4 + i, 1 + Math.floor(i / 3)]); }
    for (i = 0; i < 27; i++) { f4.push([.04 + .92 * (i + .5) / 27, .75]); l4.push([13 + i, 4 + Math.floor(i / 3)]); }
    for (i = 40; i < N; i++) {
      var par = 13 + Math.floor(r() * 27), a = r() * Math.PI * 2, d = .035 + .035 * r();
      f4.push([clamp(f4[par][0] + Math.cos(a) * d, .03, .97), clamp(f4[par][1] + Math.sin(a) * d * 1.3, .05, .95)]);
      l4.push([i, par]);
    }
    F.push(f4); LK.push(l4);

    // 5 — Impact: six ascending columns
    var f5 = [], l5 = [], counts = [8, 11, 15, 19, 24, 33], idx = 0;
    for (var j = 0; j < 6; j++) {
      var h = .16 + .14 * j, x = .15 + j * .135;
      for (var k = 0; k < counts[j]; k++) {
        f5.push([x + (r() - .5) * .012, .93 - h * (k / (counts[j] - 1))]);
        if (k > 0) l5.push([idx - 1, idx]);
        idx++;
      }
    }
    F.push(f5); LK.push(l5);
  })();

  /* ---------- state ---------- */
  var W = 0, H = 0, dpr = 1, pad = 34;
  var pts = [];
  for (var q = 0; q < N; q++) pts.push({ x: 0, y: 0 });
  var s = 0, sTarget = 0, active = 0, visible = true, raf = 0;

  function X(u) { return pad + u * (W - pad * 2); }
  function Y(v) { return pad + 20 + v * (H - pad * 2 - 20); }

  function render() {
    ctx.clearRect(0, 0, W, H);
    var i, k, l;
    var w = [];
    for (k = 0; k < 6; k++) w.push(clamp(1 - Math.abs(s - k), 0, 1));
    var lo = Math.min(5, Math.floor(s)), hi = Math.min(5, lo + 1), t = smooth(clamp(s - lo, 0, 1));
    for (i = 0; i < N; i++) {
      pts[i].x = X(lerp(F[lo][i][0], F[hi][i][0], t));
      pts[i].y = Y(lerp(F[lo][i][1], F[hi][i][1], t));
    }

    /* structure drawn behind the points */
    if (w[3] > 0.01) { // axes + trend
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 * w[3]) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(.04), Y(.06)); ctx.lineTo(X(.04), Y(.95)); ctx.lineTo(X(.96), Y(.95)); ctx.stroke();
      ctx.strokeStyle = 'rgba(242,140,40,' + (0.95 * w[3]) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(.09), Y(.84)); ctx.lineTo(X(.91), Y(.18)); ctx.stroke();
    }
    if (w[5] > 0.01) { // ripples + baseline
      var cx = X(.15 + 5 * .135), cy = Y(.93 - .86);
      for (k = 1; k <= 3; k++) {
        ctx.strokeStyle = 'rgba(242,140,40,' + (0.32 * w[5] / k) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, k * Math.min(W, H) * 0.075, 0, 6.2832); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 * w[5]) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(.05), Y(.93) + 8); ctx.lineTo(X(.95), Y(.93) + 8); ctx.stroke();
    }

    /* links, cross-faded by stage weight */
    for (k = 0; k < 6; k++) {
      if (w[k] < 0.02 || !LK[k].length) continue;
      var col = k === 5 ? '242,140,40' : (k === 4 ? '255,255,255' : '255,255,255');
      var a = (k === 2 ? 0.22 : k === 5 ? 0.9 : k === 4 ? 0.34 : 0.4) * w[k];
      ctx.strokeStyle = 'rgba(' + col + ',' + a + ')';
      ctx.lineWidth = k === 5 ? 1.6 : 1;
      ctx.beginPath();
      for (i = 0; i < LK[k].length; i++) {
        l = LK[k][i];
        ctx.moveTo(pts[l[0]].x, pts[l[0]].y); ctx.lineTo(pts[l[1]].x, pts[l[1]].y);
      }
      ctx.stroke();
    }

    /* points */
    for (i = 0; i < N; i++) {
      var om = w[5] * 1 + w[4] * (i < 13 ? 1 : 0.15) + w[3] * 0.18 + w[1] * (i % 9 === 0 ? 1 : 0) + w[0] * (i === 0 ? 1 : 0) + w[2] * (i % 11 === 0 ? 0.8 : 0);
      om = clamp(om, 0, 1);
      var rad = 2 + (i < 13 ? 1.2 * w[4] : 0) + (i % 9 === 0 ? 0.8 * w[1] : 0) + w[5] * 0.6;
      ctx.fillStyle = om > 0.05 ? 'rgba(242,140,40,' + (0.5 + om * 0.5) + ')' : 'rgba(255,255,255,0.8)';
      if (om > 0.05 && om < 0.95) ctx.fillStyle = 'rgba(' + Math.round(lerp(255, 242, om)) + ',' + Math.round(lerp(255, 140, om)) + ',' + Math.round(lerp(255, 40, om)) + ',0.9)';
      ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, rad, 0, 6.2832); ctx.fill();
    }
  }

  function setActive(i) {
    if (i === active && elName.textContent === rsName(i)) return;
    active = i;
    elIdx.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
    elName.textContent = rsName(i);
    steps.forEach(function (el, k) { el.classList.toggle('is-on', k === i); });
    ticks.forEach(function (b, k) {
      b.classList.toggle('is-on', k === i); b.classList.toggle('is-past', k < i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }

  document.addEventListener('dba:lang', function () { setActive(active); });

  function target() {
    var mobile = window.innerWidth <= 900;
    var mid = window.innerHeight * (mobile ? 0.68 : 0.5);
    var cs = steps.map(function (el) { var r = el.getBoundingClientRect(); return r.top + r.height / 2; });
    var v;
    if (mid <= cs[0]) v = 0;
    else if (mid >= cs[cs.length - 1]) v = cs.length - 1;
    else {
      v = 0;
      for (var i = 0; i < cs.length - 1; i++) {
        if (mid >= cs[i] && mid < cs[i + 1]) { v = i + (mid - cs[i]) / (cs[i + 1] - cs[i]); break; }
      }
    }
    var base = Math.floor(v), f = v - base;
    return base + smooth(clamp((f - 0.22) / 0.56, 0, 1));
  }

  function frame() {
    raf = 0;
    s += (sTarget - s) * (reduce ? 1 : 0.13);
    if (Math.abs(sTarget - s) < 0.001) s = sTarget;
    if (visible) render();
    if (s !== sTarget) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

  function onScroll() {
    sTarget = target();
    setActive(clamp(Math.round(sTarget), 0, 5));
    schedule();
  }

  function resize() {
    var r = frameEl.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    pad = W < 480 ? 22 : 34;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sTarget = target(); s = sTarget;
    setActive(clamp(Math.round(sTarget), 0, 5));
    render();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(resize, 60); }).observe(frameEl);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) { onScroll(); } }, { threshold: 0 }).observe(frameEl);
  }
  ticks.forEach(function (b) {
    b.addEventListener('click', function () {
      var el = steps[+b.getAttribute('data-go')];
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  });
  resize();
})();
