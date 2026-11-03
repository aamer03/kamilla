const fs = require('node:fs');
const path = require('node:path');
const config = require('../content/site.json');
const templates = path.join(__dirname, '../templates');

function readTemplate(name) {
  return fs.readFileSync(path.join(templates, name + '.html'), 'utf8');
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function languageLinks(page, language, dictionary) {
  const links = Object.entries(config.languages).map(([code, label]) => {
    const href = language === 'en'
      ? (code === 'en' ? page.file : code + '/' + page.file)
      : (code === 'en' ? '../' + page.file : code === language ? page.file : '../' + code + '/' + page.file);
    return `<a href="${href}" lang="${code}" hreflang="${code}"${code === language ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  return `<nav class="language-switch" aria-label="${escapeHtml(dictionary['shared.language_label'])}">${links}</nav>`;
}

function renderPage(page, language) {
  const dictionary = require('../content/' + language + '.json');
  const header = readTemplate('partials/header').replace(
    /<nav id="navigation"[\s\S]*?<\/nav>/,
    nav => nav.replace(`href="${page.file}"`, `href="${page.file}" aria-current="page"`)
  );
  const bandPath = path.join(templates, 'partials/language-band.' + language + '.html');
  const parts = {
    lang: language,
    header,
    footer: readTemplate('partials/footer'),
    closing: readTemplate('partials/closing'),
    body: readTemplate('pages/' + page.id),
    language_switch: languageLinks(page, language, dictionary),
    language_band: fs.existsSync(bandPath) ? fs.readFileSync(bandPath, 'utf8') : '',
  };
  let html = readTemplate('layout');
  // Expand structural partials before rendering escaped content values.
  for (let depth = 0; depth < 4; depth++) {
    html = html.replace(/\{\{([a-z_]+)\}\}/g, (match, key) => parts[key] ?? match);
  }
  html = html.replace(/\{\{t:([\w.]+)\}\}/g, (_, key) => {
    const resolved = key.replace(/^page\./, page.id + '.');
    if (!Object.hasOwn(dictionary, resolved)) throw new Error(`Missing ${language} translation: ${resolved}`);
    // Existing text includes a few HTML entities; decode those before escaping once.
    return escapeHtml(dictionary[resolved].replace(/&amp;/g, '&').replace(/\{\{year\}\}/g, String(new Date().getFullYear())));
  });
  if (/\{\{/.test(html)) throw new Error('Unresolved template token in ' + page.id);
  if (language !== 'en') {
    html = html.replace(/(href|src)="(style\.css|main\.js|assets\/[^"#]+)"/g, '$1="../$2"');
  }
  const alternates = Object.keys(config.languages).map(code =>
    `<link rel="alternate" hreflang="${code}" href="/${code === 'en' ? '' : code + '/'}${page.file}">`
  ).join('');
  return html.replace('</head>', alternates + '</head>');
}

module.exports = { renderPage };
