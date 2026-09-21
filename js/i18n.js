/* ==========================================================================
   I18N — English / Arabic switching.
   - Every translatable element carries data-i18n="key" (element content) or
     data-i18n-attr="attr:key,…" (attributes). English lives in the HTML;
     Arabic lives in js/ar.js. Icons (<svg>) inside a unit are preserved.
   - Strings produced by scripts go through DBA.t(key, …).
   - Sets <html lang> and <html dir>; persists the choice; announces changes.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.DBA, doc = document, root = doc.documentElement;
  var $ = D.$, $$ = D.$$;
  var STORE = 'dba-lang';
  var AR = (window.DBA_I18N && window.DBA_I18N.ar) || { units: {}, js: {} };

  /* ---------- script-generated strings (English defaults) ---------- */
  var plural = function (n, s, p) { return n + ' ' + (n === 1 ? s : p); };
  var EN_JS = {
    'toast.placeholder': '<strong>Placeholder link.</strong> The {name} URL is connected in js/config.js before publication.',
    'link.apply': 'official Graduate Admissions application portal',
    'link.booklet': 'program booklet PDF',
    'link.curriculum': 'curriculum PDF',
    'print.unavailable': 'Printing is not available in this preview. Use your browser’s print command.',
    'plan.status': function (courses, credits, all) { return (all ? 'Showing all ' : 'Showing ') + plural(courses, 'course', 'courses') + ' · ' + credits + ' credits'; },
    'expand.all': 'Expand all',
    'expand.collapse': 'Collapse all',
    'cap.count': function (i, n) { return i + ' of ' + n; },
    'intake.before': function (n) { return 'Applications open in ' + plural(n, 'day', 'days') + ', on 1 October 2026.'; },
    'intake.open': function (n) { return 'Applications are open. ' + plural(n, 'day', 'days') + ' remaining until the 15 December 2026 deadline.'; },
    'intake.today': 'Applications close today, 15 December 2026.',
    'intake.closed': 'The Spring 2027 application window has closed. Contact Graduate Admissions about the next intake.',
    'phase.0.name': 'Executive experience', 'phase.0.cap': 'Substantial professional and leadership experience.',
    'phase.1.name': 'Applied research', 'phase.1.cap': 'Rigorous, supervised investigation of a real-world challenge.',
    'phase.2.name': 'Measurable impact', 'phase.2.cap': 'Research-driven recommendations with organizational and societal value.',
    'rs.0': 'Challenge', 'rs.1': 'Evidence', 'rs.2': 'Method', 'rs.3': 'Analysis', 'rs.4': 'Solution', 'rs.5': 'Impact',
    'lang.announce.en': 'Switched to English.',
    'lang.announce.ar': 'تم التبديل إلى العربية.',
    'lang.btn.en': 'Switch to English',
    'lang.btn.ar': 'التبديل إلى اللغة العربية'
  };

  var lang = root.getAttribute('lang') === 'ar' ? 'ar' : 'en';

  function t(key) {
    var args = Array.prototype.slice.call(arguments, 1);
    var v = (lang === 'ar' && AR.js && AR.js[key] != null) ? AR.js[key] : EN_JS[key];
    if (typeof v === 'function') return v.apply(null, args);
    if (typeof v === 'string' && args[0] && typeof args[0] === 'object') {
      Object.keys(args[0]).forEach(function (k) { v = v.split('{' + k + '}').join(args[0][k]); });
    }
    return v;
  }

  /* ---------- units ---------- */
  var units = $$('[data-i18n]').map(function (el) {
    var clone = el.cloneNode(true), orig = $$('svg', el), copies = $$('svg', clone), i;
    for (i = 0; i < copies.length; i++) copies[i].replaceWith(doc.createElement('i-svg'));
    return { el: el, key: el.getAttribute('data-i18n'), en: clone.innerHTML, svgs: orig };
  });
  var attrUnits = [];
  $$('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
      var p = pair.split(':'), a = p[0].trim(), k = p[1].trim();
      attrUnits.push({ el: el, attr: a, key: k, en: el.getAttribute(a) });
    });
  });

  function setHTML(u, html) {
    var tpl = doc.createElement('template');
    tpl.innerHTML = html;
    $$('i-svg', tpl.content).forEach(function (tk, i) { if (u.svgs[i]) tk.replaceWith(u.svgs[i]); });
    u.el.replaceChildren(tpl.content);
  }

  function applyDOM() {
    var ar = lang === 'ar';
    units.forEach(function (u) {
      var v = ar ? AR.units[u.key] : null;
      setHTML(u, v != null ? v : u.en);
    });
    attrUnits.forEach(function (u) {
      var v = ar ? AR.units[u.key] : null;
      u.el.setAttribute(u.attr, v != null ? v : u.en);
    });
    var titleEl = doc.querySelector('title');
    if (titleEl) doc.title = titleEl.textContent;
  }

  /* ---------- toggle buttons ---------- */
  function renderToggles() {
    $$('[data-lang-toggle]').forEach(function (b) {
      var toAr = lang === 'en';
      b.setAttribute('lang', toAr ? 'ar' : 'en');
      b.setAttribute('aria-label', toAr ? EN_JS['lang.btn.ar'] : EN_JS['lang.btn.en']);
      var full = $('[data-lang-full]', b), short = $('[data-lang-short]', b);
      if (full) full.textContent = toAr ? 'العربية' : 'English';
      if (short) short.textContent = toAr ? 'ع' : 'EN';
    });
  }

  function syncSheets() {
    var want = lang === 'ar' ? 'rtl' : 'ltr';
    $$('link[data-dir]').forEach(function (l) { l.media = l.getAttribute('data-dir') === want ? 'all' : 'not all'; });
  }

  var live = $('#langLive');
  function setLang(next, announce) {
    if (next !== 'ar' && next !== 'en') return;
    lang = next;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    syncSheets();
    applyDOM();
    renderToggles();
    try { localStorage.setItem(STORE, lang); } catch (e) { /* storage unavailable */ }
    if (announce && live) { live.textContent = ''; setTimeout(function () { live.textContent = EN_JS['lang.announce.' + lang]; }, 30); }
    doc.dispatchEvent(new CustomEvent('dba:lang', { detail: { lang: lang } }));
  }

  D.t = t;
  D.lang = function () { return lang; };
  D.setLang = setLang;

  $$('[data-lang-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(lang === 'en' ? 'ar' : 'en', true); });
  });

  if (lang === 'ar') { syncSheets(); applyDOM(); }
  renderToggles();
})();
