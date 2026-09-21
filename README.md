# Al Yamamah University — Doctor of Business Administration website

Bilingual (English / العربية, right-to-left) static website for the DBA program, College of Business.
Plain HTML, CSS and JavaScript — no framework, no build step required to run or deploy.

## Run locally

    npm start            # or: python3 -m http.server 8080

Open http://localhost:8080 (Arabic: http://localhost:8080/?lang=ar).
On macOS you can also double-click `start.command`.

Serve it over http (as above) rather than opening `index.html` from disk, so the language memory works.

## Before going live

1. **Set the official links** in `js/config.js` (application portal, booklet PDF, curriculum PDF). While empty, those buttons show a clearly marked "temporary link" notice.
2. **Have the Arabic reviewed.** `js/ar.js` holds every Arabic string; it is a professional draft.
3. Confirm the intake dates in `js/config.js` (`intake.opens`, `intake.deadline`) — they drive the live status line in *Intake & Fees*.

## Deploy with GitHub Pages

`.github/workflows/pages.yml` publishes the site on every push to `main`.
In the repository go to **Settings → Pages → Source → GitHub Actions** once, then push.

## Project layout

    index.html            Page markup (English source text, `data-i18n` hooks for Arabic)
    css/
      tokens.css          Design tokens (palette, type scale, spacing)
      base.css chrome.css story.css learning.css research.css admissions.css   English / LTR styles
      *.rtl.css           Arabic / RTL mirror of each sheet — GENERATED, do not edit
      ar.css              Arabic typography + hand-written RTL fixes (edit this one)
      print.css           Print styles (curriculum plan)
    js/
      config.js           Editable links and intake dates
      i18n.js             Language engine (switch, persistence, dynamic strings)
      ar.js               Arabic strings (edit here to change Arabic copy)
      ui.js interactive.js hero.js research.js   Navigation, components, canvas visuals
    assets/               University logos (unmodified)
    fonts/                Self-hosted web fonts (Newsreader, Hanken Grotesk, IBM Plex, Amiri)
    tools/build-rtl.js    Regenerates css/*.rtl.css from the LTR sheets

### Editing notes

- **English copy:** edit `index.html` directly. Elements with `data-i18n="key"` are swapped for `js/ar.js[key]` in Arabic — if you change English text, update the matching Arabic key.
- **Styles:** edit the LTR sheet, then run `npm install && npm run rtl` to refresh the `.rtl.css` mirror. Put Arabic-only or direction-specific overrides in `css/ar.css`.
- Arabic uses Western digits (0–9); email, URLs, phone numbers and course codes stay left-to-right inside Arabic text.

## Content & brand

All program facts (fees, dates, credit hours, requirements) come from the approved DBA page structure and must be confirmed with Graduate Admissions before publication.
University logos and brand assets remain the property of Al Yamamah University and are not covered by any open-source license — consider keeping this repository **private**.
