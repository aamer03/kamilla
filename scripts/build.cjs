const fs = require('node:fs');
const path = require('node:path');
const { renderPage } = require('../src/lib/render.cjs');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const config = require('../src/content/site.json');
fs.mkdirSync(output, { recursive: true });
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });

for (const language of Object.keys(config.languages)) {
  const directory = path.join(output, language === 'en' ? '' : language);
  fs.mkdirSync(directory, { recursive: true });
  for (const page of config.pages) {
    fs.writeFileSync(path.join(directory, page.file), renderPage(page, language));
  }
}
fs.copyFileSync(path.join(root, 'src/styles/site.css'), path.join(output, 'style.css'));
fs.copyFileSync(path.join(root, 'src/scripts/navigation.js'), path.join(output, 'main.js'));
console.log(`Built ${config.pages.length * Object.keys(config.languages).length} pages.`);
