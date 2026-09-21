/* ==========================================================================
   HERO VISUAL — "Experience becomes knowledge becomes impact"
   One canvas, one set of points, three formations driven by scroll:
     s = 0  EXECUTIVE EXPERIENCE  a skyline of towers, drawn as architecture
     s = 1  APPLIED RESEARCH      the same points dissolve into a network
     s = 2  MEASURABLE IMPACT     they re-assemble as six ascending columns
   ========================================================================== */
(function () {
  'use strict';
  var canvas = document.getElementById('heroCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var hero = document.getElementById('top');
  var stage = hero.querySelector('.hero__stage');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var W = 0, H = 0, dpr = 1, mobile = false;
  var pts = [], links = [], towers = [], barTowers = [], trend = null, gy = 0, R = 120;
  var s = 0, sTarget = 0, mx = 0, my = 0, mxT = 0, myT = 0, visible = true, raf = 0, lastPhase = -1;

  var phaseEl = document.getElementById('phases');
  var elIdx = document.getElementById('phaseIdx');
  var elName = document.getElementById('phaseName');
  var elCap = document.getElementById('phaseCap');
  var elItems = phaseEl ? Array.prototype.slice.call(phaseEl.querySelectorAll('.phases__list li')) : [];
  var PHASES = [
    { n: '01', name: 'Executive experience', cap: 'Substantial professional and leadership experience.' },
    { n: '02', name: 'Applied research', cap: 'Rigorous, supervised investigation of a real-world challenge.' },
    { n: '03', name: 'Measurable impact', cap: 'Research-driven recommendations with organizational and societal value.' }
  ];

  /* ---------------- scene construction (deterministic) ---------------- */
  function build() {
    var r = rng(11);
    mobile = W < 860;
    gy = H * (mobile ? 0.9 : 0.88);
    R = mobile ? 92 : 128;
    var left = mobile ? W * 0.03 : W * 0.30, right = W * 1.0;
    var n = mobile ? 11 : 16, slot = (right - left) / n;
    pts = []; links = []; towers = [];

    function add(x, y, depth) { pts.push({ ax: x, ay: y, bx: 0, by: 0, cx: x, cy: y, x: x, y: y, d: depth, hub: false, trail: false, o: r() }); return pts.length - 1; }
    function link(a, b, a0, orange) { links.push({ a: a, b: b, alpha: a0, orange: !!orange }); }

    for (var i = 0; i < n; i++) {
      var depth = [0.45, 0.7, 1][Math.floor(r() * 3)];
      var w = slot * (0.55 + 0.35 * r()) * (0.75 + 0.35 * depth);
      var x = left + i * slot + slot * 0.1 + r() * slot * 0.25;
      var grow = 0.35 + 0.65 * Math.pow(i / (n - 1), 0.8);
      var h = (mobile ? H * 0.46 : H * 0.66) * (0.4 + 0.6 * r()) * grow * (0.7 + 0.3 * depth);
      var floors = Math.max(3, Math.min(8, Math.round(h / (mobile ? 34 : 40))));
      var t = { x: x, w: w, h: h, depth: depth, floors: floors, i: i, L: [], Rr: [] };
      t.BL = add(x, gy, depth); t.TL = add(x, gy - h, depth); t.TR = add(x + w, gy - h, depth); t.BR = add(x + w, gy, depth);
      for (var k = 1; k < floors; k++) {
        var yy = gy - h * k / floors;
        t.L.push(add(x, yy, depth)); t.Rr.push(add(x + w, yy, depth));
      }
      var lc = [t.BL].concat(t.L, [t.TL]), rc = [t.BR].concat(t.Rr, [t.TR]);
      for (var q = 0; q < lc.length - 1; q++) { link(lc[q], lc[q + 1], .5); link(rc[q], rc[q + 1], .5); }
      link(t.TL, t.TR, .6); link(t.BL, t.BR, .4);
      for (var f = 0; f < t.L.length; f++) link(t.L[f], t.Rr[f], .26, r() < 0.1);
      towers.push(t);
    }

    /* Network (B): points scatter across an ellipse; some become hubs */
    var cx = mobile ? W * 0.5 : W * 0.64, cy = mobile ? H * 0.62 : H * 0.46;
    var rx = mobile ? W * 0.46 : W * 0.36, ry = mobile ? H * 0.26 : H * 0.34;
    pts.forEach(function (p, idx) {
      var a = r() * Math.PI * 2, rad = Math.sqrt(r());
      p.bx = cx + Math.cos(a) * rad * rx; p.by = cy + Math.sin(a) * rad * ry;
      p.hub = idx % 9 === 0;
    });

    /* Impact (C): six ascending columns built from six of the towers */
    var barLeft = mobile ? W * 0.14 : W * 0.5, barW = mobile ? W * 0.09 : W * 0.052, gap = mobile ? W * 0.035 : W * 0.02;
    barTowers = [];
    var chosen = [];
    for (var j = 0; j < 6; j++) chosen.push(Math.round(1 + (n - 3) * j / 5));
    var isBar = {};
    chosen.forEach(function (ti, j) {
      var t = towers[ti]; isBar[ti] = true; barTowers.push(t);
      var bh = H * (mobile ? 0.1 : 0.13) + j * H * (mobile ? 0.072 : 0.085);
      var bx = barLeft + j * (barW + gap);
      t.c = { x: bx, w: barW, h: bh };
      pts[t.BL].cx = bx; pts[t.BL].cy = gy; pts[t.BR].cx = bx + barW; pts[t.BR].cy = gy;
      pts[t.TL].cx = bx; pts[t.TL].cy = gy - bh; pts[t.TR].cx = bx + barW; pts[t.TR].cy = gy - bh;
      t.L.forEach(function (li, k) { var yy = gy - bh * (k + 1) / t.floors; pts[li].cx = bx; pts[li].cy = yy; pts[t.Rr[k]].cx = bx + barW; pts[t.Rr[k]].cy = yy; });
    });
    var x0 = barLeft - W * 0.02, y0 = gy - H * 0.08;
    var x1 = barLeft + 6 * (barW + gap), y1 = gy - H * (mobile ? 0.52 : 0.68);
    trend = { x0: x0, y0: y0, x1: x1, y1: y1 };
    towers.forEach(function (t) {
      if (isBar[t.i]) return;
      var idxs = [t.BL, t.TL, t.TR, t.BR].concat(t.L, t.Rr);
      idxs.forEach(function (pi) {
        var u = r(), p = pts[pi];
        var off = (r() - .5) * H * 0.07;
        p.cx = lerp(x0, x1, u) + off * .5; p.cy = lerp(y0, y1, u) - Math.abs(off) * 0.9 - (r() * H * 0.02);
        p.trail = true;
      });
    });
  }

  /* ---------------- rendering ---------------- */
  function rgba(c, a) { return 'rgba(' + c + ',' + a + ')'; }
  var WHITE = '255,255,255', ORANGE = '242,140,40';

  function render() {
    ctx.clearRect(0, 0, W, H);
    var wA = clamp(1 - s, 0, 1), wB = clamp(1 - Math.abs(s - 1), 0, 1), wC = clamp(s - 1, 0, 1);
    var t1 = ease(clamp(s, 0, 1)), t2 = ease(clamp(s - 1, 0, 1));
    var i, p, l;

    /* horizon glow — the "sunrise" of impact */
    var glow = clamp((s - 0.4) / 1.6, 0, 1);
    var gx = mobile ? W * 0.55 : W * 0.72;
    var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.7);
    g.addColorStop(0, rgba(ORANGE, 0.05 + 0.32 * glow));
    g.addColorStop(0.45, rgba(ORANGE, 0.02 + 0.08 * glow));
    g.addColorStop(1, rgba(ORANGE, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* ground line */
    ctx.strokeStyle = rgba(WHITE, 0.16 + 0.1 * wC);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, gy + .5); ctx.lineTo(W, gy + .5); ctx.stroke();

    /* positions */
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      var x, y;
      if (s <= 1) { x = lerp(p.ax, p.bx, t1); y = lerp(p.ay, p.by, t1); }
      else { x = lerp(p.bx, p.cx, t2); y = lerp(p.by, p.cy, t2); }
      var drift = wB * 7;
      x += Math.sin(s * 4 + p.o * 20) * drift; y += Math.cos(s * 3.4 + p.o * 17) * drift;
      var par = (1 - wC) * p.d;
      p.x = x + mx * 16 * par; p.y = y + my * 8 * par;
    }

    /* A — tower architecture */
    if (wA > 0.01) {
      ctx.lineWidth = 1;
      for (i = 0; i < links.length; i++) {
        l = links[i];
        var a = pts[l.a], b = pts[l.b];
        var al = l.alpha * wA * (0.4 + 0.6 * a.d);
        ctx.strokeStyle = l.orange ? rgba(ORANGE, 0.75 * wA) : rgba(WHITE, al * 0.62);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    /* B — research network (proximity graph) */
    if (wB > 0.02) {
      ctx.lineWidth = 1;
      for (i = 0; i < pts.length; i++) {
        var pi = pts[i];
        for (var j = i + 1; j < pts.length; j++) {
          var pj = pts[j], dx = pi.x - pj.x, dy = pi.y - pj.y, d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            var d = Math.sqrt(d2), al2 = (1 - d / R) * 0.5 * wB;
            ctx.strokeStyle = (pi.hub || pj.hub) ? rgba(ORANGE, al2 * 1.3) : rgba(WHITE, al2);
            ctx.beginPath(); ctx.moveTo(pi.x, pi.y); ctx.lineTo(pj.x, pj.y); ctx.stroke();
          }
        }
      }
    }

    /* C — six ascending columns */
    if (wC > 0.01) {
      for (var b2 = 0; b2 < barTowers.length; b2++) {
        var t = barTowers[b2];
        var tl = pts[t.TL], tr = pts[t.TR], br = pts[t.BR], bl = pts[t.BL];
        var fg = ctx.createLinearGradient(0, tl.y, 0, bl.y);
        var lead = b2 === barTowers.length - 1;
        fg.addColorStop(0, rgba(ORANGE, (lead ? 0.85 : 0.5) * wC));
        fg.addColorStop(1, rgba(ORANGE, 0.05 * wC));
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y); ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(lead ? ORANGE : WHITE, (lead ? 0.95 : 0.5) * wC);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y); ctx.moveTo(tl.x, tl.y); ctx.lineTo(bl.x, bl.y); ctx.moveTo(tr.x, tr.y); ctx.lineTo(br.x, br.y); ctx.stroke();
        ctx.strokeStyle = rgba(WHITE, 0.16 * wC);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var f = 0; f < t.L.length; f++) { var lp = pts[t.L[f]], rp = pts[t.Rr[f]]; ctx.moveTo(lp.x, lp.y); ctx.lineTo(rp.x, rp.y); }
        ctx.stroke();
      }
      /* dotted trend line + arrowhead */
      var ex = lerp(trend.x0, trend.x1, 1), ey = lerp(trend.y0, trend.y1, 1);
      var prog = clamp((wC - 0.15) / 0.85, 0, 1);
      var ax = lerp(trend.x0, ex, prog), ay = lerp(trend.y0, ey, prog);
      ctx.setLineDash([2, 7]); ctx.strokeStyle = rgba(ORANGE, 0.75 * wC); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(trend.x0, trend.y0); ctx.lineTo(ax, ay); ctx.stroke(); ctx.setLineDash([]);
      if (prog > 0.9) {
        var ang = Math.atan2(trend.y1 - trend.y0, trend.x1 - trend.x0);
        ctx.fillStyle = rgba(ORANGE, 0.9 * wC);
        ctx.beginPath(); ctx.moveTo(ax + Math.cos(ang) * 10, ay + Math.sin(ang) * 10);
        ctx.lineTo(ax + Math.cos(ang + 2.5) * 9, ay + Math.sin(ang + 2.5) * 9);
        ctx.lineTo(ax + Math.cos(ang - 2.5) * 9, ay + Math.sin(ang - 2.5) * 9); ctx.closePath(); ctx.fill();
      }
    }

    /* points */
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      var base = 0.34 * wA + 0.8 * wB + 0.5 * wC;
      var rad = 1.15 + (p.hub ? 1.4 * wB : 0) + p.d * 0.35;
      var orange = (p.hub ? wB : 0) + (p.trail ? wC : 0) * 0.95;
      if (orange > 0.02) { ctx.fillStyle = rgba(ORANGE, clamp(0.35 + orange * 0.65, 0, 1)); rad += orange * 0.9; }
      else ctx.fillStyle = rgba(WHITE, clamp(base * (0.6 + 0.4 * p.d), 0, 1));
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 6.2832); ctx.fill();
    }

    /* phase UI */
    var ph = s < 0.67 ? 0 : s < 1.33 ? 1 : 2;
    if (phaseEl) {
      phaseEl.style.setProperty('--pp', String(clamp(s / 2, 0, 1)));
      if (ph !== lastPhase) {
        lastPhase = ph;
        elIdx.textContent = PHASES[ph].n; elName.textContent = window.DBA.t('phase.' + ph + '.name'); elCap.textContent = window.DBA.t('phase.' + ph + '.cap');
        elItems.forEach(function (li, k) { li.classList.toggle('is-on', k === ph); });
      }
    }
  }

  function frame() {
    raf = 0;
    var k = reduce ? 1 : 0.12;
    s += (sTarget - s) * k; if (Math.abs(sTarget - s) < 0.0008) s = sTarget;
    mx += (mxT - mx) * 0.08; my += (myT - my) * 0.08;
    if (visible) render();
    if (Math.abs(sTarget - s) > 0.0008 || Math.abs(mxT - mx) > 0.002 || Math.abs(myT - my) > 0.002) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  document.addEventListener('dba:lang', function () { lastPhase = -1; schedule(); });

  /* ---------------- scroll + pointer ---------------- */
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var travel = Math.max(1, hero.offsetHeight - stage.offsetHeight);
    var top = hero.getBoundingClientRect().top;
    var p = clamp(-top / travel, 0, 1);
    sTarget = p * 2;
    var vh = window.innerHeight;
    hero.style.setProperty('--phase-vis', String(clamp((y / vh - 0.06) * 3.5, 0, 1)));
    hero.style.setProperty('--hero-shade', String(1 - clamp(y / (vh * 0.95), 0, 1) * 0.86));
    schedule();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (finePointer && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var rct = stage.getBoundingClientRect();
      mxT = ((e.clientX - rct.left) / (rct.width || 1) - .5) * 2;
      myT = ((e.clientY - rct.top) / (rct.height || 1) - .5) * 2;
      schedule();
    });
  }

  function resize() {
    var rct = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(rct.width)); H = Math.max(1, Math.round(rct.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    lastPhase = -1;
    onScroll();
    s = sTarget;
    render();
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) schedule(); }, { threshold: 0 }).observe(stage);
  }
  resize();
})();
