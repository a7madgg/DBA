/* ==========================================================================
   UI — toast, placeholder links, navigation, mobile menu, scroll-spy,
   scroll reveals, number counters.
   ========================================================================== */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.DBA = { $: $, $$: $$, clamp: clamp, reduce: reduce };

  /* ---------- Toast ---------- */
  var toast = $('#toast'), toastTimer;
  function showToast(html) {
    if (!toast) return;
    toast.innerHTML = html;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 5600);
  }
  window.DBA.toast = showToast;

  /* ---------- Official links (placeholders until configured) ---------- */
  var cfg = window.DBA_CONFIG || {};
  var LINKS = {
    apply: { url: cfg.applyUrl, name: 'link.apply', go: '#intake' },
    booklet: { url: cfg.bookletUrl, name: 'link.booklet', go: '#booklet' },
    curriculum: { url: cfg.curriculumPdfUrl, name: 'link.curriculum', go: null },
    privacy: { url: cfg.privacyUrl, name: 'link.privacy', go: null }
  };
  $$('[data-link]').forEach(function (a) {
    var L = LINKS[a.getAttribute('data-link')];
    if (!L) return;
    if (L.url) { a.href = L.url; a.target = '_blank'; a.rel = 'noopener'; return; }
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var target = L.go && $(L.go);
      if (target && !target.contains(a)) {
        target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      }
      showToast(window.DBA.t('toast.placeholder', { name: window.DBA.t(L.name) }));
    });
  });

  /* ---------- Navigation: solid-on-scroll, tone-aware, scroll-spy ---------- */
  var nav = $('#nav'), menu = $('#menu'), menuBtn = $('#menuBtn');
  var menuOpen = false;
  var spyLinks = $$('.nav__links [data-spy]');
  var SPY = [
    ['overview', 'overview'], ['audience', 'overview'], ['journey', 'overview'], ['architecture', 'overview'],
    ['curriculum', 'curriculum'],
    ['research', 'research'], ['supervision', 'research'], ['capabilities', 'research'], ['focus', 'research'],
    ['admissions', 'admissions'], ['documents', 'admissions'], ['process', 'admissions'], ['intake', 'admissions'], ['faculty', 'admissions'],
    ['faq', 'faq']
  ].map(function (p) { return [doc.getElementById(p[0]), p[1]]; }).filter(function (p) { return p[0]; });

  var navTicking = false;
  function navUpdate() {
    navTicking = false;
    var y = window.scrollY || root.scrollTop;
    nav.classList.toggle('is-scrolled', y > 24 || menuOpen);

    var tone = 'dark';
    if (!menuOpen) {
      var els = doc.elementsFromPoint(Math.round(window.innerWidth / 2), Math.round(nav.offsetHeight / 2));
      for (var i = 0; i < els.length; i++) {
        if (nav.contains(els[i]) || (menu && menu.contains(els[i]))) continue;
        var s = els[i].closest('[data-nav-tone]');
        if (s) { tone = s.getAttribute('data-nav-tone'); break; }
      }
    }
    nav.setAttribute('data-nav', tone);

    var mid = window.innerHeight * 0.4, active = null;
    for (var j = 0; j < SPY.length; j++) {
      var r = SPY[j][0].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { active = SPY[j][1]; break; }
    }
    spyLinks.forEach(function (a) {
      if (a.getAttribute('data-spy') === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  function queueNav() { if (!navTicking) { navTicking = true; requestAnimationFrame(navUpdate); } }
  window.addEventListener('scroll', queueNav, { passive: true });
  window.addEventListener('resize', queueNav);
  navUpdate();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    menuOpen = open;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      root.style.overflow = 'hidden';
      var first = $('a', menu); if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      root.style.overflow = '';
      setTimeout(function () { if (!menuOpen) menu.hidden = true; }, 420);
    }
    navUpdate();
  }
  menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); }
    if (e.key === 'Tab' && menuOpen) {
      var f = $$('a, button', menu).concat([menuBtn]).filter(function (n) { return n.offsetParent !== null || n === menuBtn; });
      var i = f.indexOf(doc.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.matchMedia('(min-width: 1061px)').addEventListener('change', function (e) { if (e.matches && menuOpen) setMenu(false); });

  /* ---------- Scroll reveals ---------- */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  $$('[data-reveal], [data-io]').forEach(function (el) {
    if (io) io.observe(el); else el.classList.add('in');
  });

  /* ---------- Number counters ---------- */
  $$('[data-count]').forEach(function (el) {
    var target = +el.getAttribute('data-count'), pad = +el.getAttribute('data-pad') || 0;
    var fmt = function (v) { var s = String(v); while (s.length < pad) s = '0' + s; return s; };
    if (reduce.matches || !('IntersectionObserver' in window)) return;
    if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = fmt(0);
    var cio = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) return;
      cio.disconnect();
      var t0 = performance.now(), dur = 1500;
      (function step(t) {
        var p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(target * e));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 });
    cio.observe(el);
  });
})();
