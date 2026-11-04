const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { renderPage } = require('../src/lib/render.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const config = require('../src/content/site.json');
const languages = Object.keys(config.languages);
const referenceKeys = Object.keys(require('../src/content/en.json')).sort();
let count = 0;
for (const language of languages) {
  const dictionary = require('../src/content/' + language + '.json');
  assert.deepEqual(
    Object.keys(dictionary).sort(),
    referenceKeys,
    language + ': translation keys differ',
  );
  assert(
    Object.values(dictionary).every(
      (value) => typeof value === 'string' && value.length > 0,
    ),
    language + ': empty translation',
  );
  for (const page of config.pages) {
    const file = path.join(
      output,
      language === 'en' ? '' : language,
      page.file,
    );
    const html = fs.readFileSync(file, 'utf8');
    assert.equal(html, renderPage(page, language), 'Stale output: ' + file);
    assert(html.includes('lang="' + language + '"'), 'Missing page language');
    assert.equal(
      (html.match(/<h1[ >]/g) || []).length,
      1,
      'Expected one main heading',
    );
    assert.equal(
      (html.match(/<main[ >]/g) || []).length,
      1,
      'Expected one main landmark',
    );
    assert(!html.includes('{{'), 'Unresolved template token');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = match[1];
      if (/^(https?:|mailto:|tel:|#)/.test(url)) continue;
      const [pathname, fragment] = url.split('#');
      const target = url.startsWith('/')
        ? path.join(output, pathname.slice(1))
        : path.resolve(path.dirname(file), pathname);
      assert(fs.existsSync(target), file + ': missing ' + url);
      if (fragment && target.endsWith('.html'))
        assert(
          fs.readFileSync(target, 'utf8').includes('id="' + fragment + '"'),
          'Missing anchor: ' + url,
        );
    }
    for (const image of html.matchAll(/<img\b[^>]*>/g))
      assert(/\balt="[^"]*"/.test(image[0]), 'Image needs alt text');
    count++;
  }
}
console.log(
  `${count} pages checked: translations, output, links, anchors, and image descriptions.`,
);
