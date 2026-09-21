#!/usr/bin/env node
/* Regenerates the Arabic/RTL stylesheets (css/*.rtl.css) from the English/LTR ones.
   Run after editing any LTR sheet:   npm install && npm run rtl
   Direction-specific exceptions are marked in the LTR sources with rtl:ignore comment blocks,
   and hand-written RTL/Arabic overrides live in css/ar.css (never generated). */
const rtlcss = require('rtlcss');
const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const sheets = ['tokens', 'base', 'chrome', 'story', 'learning', 'research', 'admissions'];

for (const name of sheets) {
  const src = fs.readFileSync(path.join(cssDir, name + '.css'), 'utf8');
  const out = rtlcss.process(src, { autoRename: false, clean: false, greedy: false });
  fs.writeFileSync(path.join(cssDir, name + '.rtl.css'), out);
  console.log('css/' + name + '.rtl.css');
}
