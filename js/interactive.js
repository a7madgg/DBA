/* ==========================================================================
   INTERACTIVE COMPONENTS — audience pillars, curriculum explorer, governance
   gates, capability orbit, document checklist, intake status, FAQ accordion.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.DBA, $ = D.$, $$ = D.$$, reduce = D.reduce;
  var isDesk = function () { return window.innerWidth > 900; };

  /* ---------- Audience pillars ---------- */
  (function () {
    var pillars = $$('#pillars .pillar');
    if (!pillars.length) return;
    function open(i, allowClose) {
      pillars.forEach(function (p, j) {
        var on = j === i && !(allowClose && p.classList.contains('is-open'));
        p.classList.toggle('is-open', on);
        p.querySelector('.pillar__btn').setAttribute('aria-expanded', String(on));
      });
    }
    pillars.forEach(function (p, i) {
      var b = $('.pillar__btn', p);
      b.addEventListener('click', function () { open(i, !isDesk()); });
      b.addEventListener('focus', function () { if (isDesk()) open(i); });
      p.addEventListener('mouseenter', function () { if (isDesk() && window.matchMedia('(hover: hover)').matches) open(i); });
    });
    $('#pillars').addEventListener('keydown', function (e) {
      var cur = pillars.findIndex(function (p) { return p.contains(document.activeElement); });
      if (cur < 0) return;
      var nxt = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? cur + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? cur - 1 : null;
      if (nxt === null || nxt < 0 || nxt >= pillars.length) return;
      e.preventDefault(); $('.pillar__btn', pillars[nxt]).focus();
    });
  })();

  /* ---------- Curriculum explorer ---------- */
  (function () {
    var plan = $('#plan'); if (!plan) return;
    var terms = $$('.term', plan), state = { y: 'all', s: 'all' };
    var status = $('#planStatus'), expandBtn = $('#expandAll');

    function apply() {
      var courses = 0, credits = 0;
      terms.forEach(function (t) {
        var ok = (state.y === 'all' || t.getAttribute('data-y') === state.y) && (state.s === 'all' || t.getAttribute('data-s') === state.s);
        t.hidden = !ok;
        if (ok) $$('.course', t).forEach(function (c) { courses++; credits += parseInt($('.course__cr', c).textContent, 10); });
      });
      var all = state.y === 'all' && state.s === 'all';
      status.textContent = D.t('plan.status', courses, credits, all);
    }
    $$('.chip[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var kind = chip.getAttribute('data-filter');
        state[kind] = chip.getAttribute('data-v');
        $$('.chip[data-filter="' + kind + '"]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        apply();
      });
    });
    function renderExpand() {
      expandBtn.textContent = D.t(expandBtn.getAttribute('aria-pressed') === 'true' ? 'expand.collapse' : 'expand.all');
    }
    function setCourse(li, open) {
      li.classList.toggle('is-open', open);
      $('.course__btn', li).setAttribute('aria-expanded', String(open));
    }
    $$('.course', plan).forEach(function (li) {
      $('.course__btn', li).addEventListener('click', function () { setCourse(li, !li.classList.contains('is-open')); });
    });
    expandBtn.addEventListener('click', function () {
      var expand = expandBtn.getAttribute('aria-pressed') !== 'true';
      $$('.term:not([hidden]) .course', plan).forEach(function (li) { setCourse(li, expand); });
      expandBtn.setAttribute('aria-pressed', String(expand));
      renderExpand();
    });
    var pr = $('#printPlan');
    if (pr) pr.addEventListener('click', function () {
      $$('.course', plan).forEach(function (li) { setCourse(li, true); });
      try { window.print(); } catch (err) { D.toast(D.t('print.unavailable')); }
    });
    apply(); renderExpand();
    document.addEventListener('dba:lang', function () { apply(); renderExpand(); });
  })();

  /* ---------- Governance gates ---------- */
  (function () {
    var gates = $$('#gov .gate'), details = $$('#gov .gdetail');
    if (!gates.length) return;
    function set(i) {
      gates.forEach(function (g, j) {
        g.classList.toggle('is-on', j === i); g.classList.toggle('is-done', j < i);
        g.setAttribute('aria-pressed', String(j === i));
      });
      details.forEach(function (d, j) { d.classList.toggle('is-on', j === i); });
    }
    gates.forEach(function (g, i) {
      g.addEventListener('click', function () { set(i); });
      g.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : null;
        if (n === null || n < 0 || n >= gates.length) return;
        e.preventDefault(); gates[n].focus(); set(n);
      });
    });
    set(0);
  })();

  /* ---------- Capability orbit ---------- */
  (function () {
    var nodes = $$('#orbit .node'); if (!nodes.length) return;
    var T = $('#capT'), Dd = $('#capD'), C = $('#capCount'), Rd = $('#capReadout');
    var cur = 0;
    function set(i) {
      cur = i;
      nodes.forEach(function (n, j) {
        var on = j === i;
        n.classList.toggle('is-on', on); n.setAttribute('aria-pressed', String(on));
        n.closest('li').classList.toggle('is-on', on);
      });
      var li = nodes[i].closest('li');
      T.textContent = $('.node__label', nodes[i]).textContent;
      Dd.textContent = $('.node__desc', li).textContent;
      C.textContent = D.t('cap.count', i + 1, nodes.length);
      Rd.classList.remove('is-swap'); void Rd.offsetWidth; Rd.classList.add('is-swap');
    }
    nodes.forEach(function (n, i) {
      n.addEventListener('click', function () { set(i); });
      n.addEventListener('focus', function () { if (i !== cur) set(i); });
      n.addEventListener('mouseenter', function () { if (window.innerWidth > 1040 && i !== cur) set(i); });
    });
    $('#orbit').addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? cur + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? cur - 1 : null;
      if (n === null) return;
      n = (n + nodes.length) % nodes.length;
      e.preventDefault(); nodes[n].focus();
    });
    set(0);
    document.addEventListener('dba:lang', function () { set(cur); });
  })();

  /* ---------- Documents checklist ---------- */
  (function () {
    var boxes = $$('.checklist input[type="checkbox"]'); if (!boxes.length) return;
    var count = $('#docCount'), ring = $('#meterFg');
    function update() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      count.textContent = n;
      ring.style.strokeDashoffset = String(100 - (n / boxes.length) * 100);
    }
    boxes.forEach(function (b) { b.addEventListener('change', update); });
    update();
  })();

  /* ---------- Intake status (driven by config dates) ---------- */
  (function () {
    var cfg = (window.DBA_CONFIG || {}).intake; if (!cfg) return;
    var status = $('#winStatus'), fill = $('#winFill'); if (!status) return;
    function parse(s) { var a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); }
    var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var o = parse(cfg.opens), c = parse(cfg.deadline), day = 864e5;
    function render() {
      var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), msg, frac;
      if (today < o) { msg = D.t('intake.before', Math.round((o - today) / day)); frac = 0; }
      else if (today <= c) {
        var left = Math.round((c - today) / day);
        msg = left === 0 ? D.t('intake.today') : D.t('intake.open', left);
        frac = (today - o) / (c - o);
      } else { msg = D.t('intake.closed'); frac = 1; }
      status.textContent = msg;
      fill.style.setProperty('--w', String(Math.max(0, Math.min(1, frac))));
    }
    render();
    document.addEventListener('dba:lang', render);
  })();

  /* ---------- FAQ accordion ---------- */
  $$('.qa').forEach(function (qa) {
    var b = $('.qa__btn', qa);
    b.addEventListener('click', function () {
      var open = !qa.classList.contains('is-open');
      qa.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', String(open));
    });
  });
})();
