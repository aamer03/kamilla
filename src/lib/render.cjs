const fs = require('node:fs');
const path = require('node:path');
const config = require('../content/site.json');
const { origin, pageUrl } = require('./seo.cjs');
const templates = path.join(__dirname, '../templates');

function readTemplate(name) {
  return fs.readFileSync(path.join(templates, name + '.html'), 'utf8');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function languageLinks(page, language, dictionary) {
  const links = Object.entries(config.languages)
    .map(([code, label]) => {
      const href =
        language === 'en'
          ? code === 'en'
            ? page.file
            : code + '/' + page.file
          : code === 'en'
            ? '../' + page.file
            : code === language
              ? page.file
              : '../' + code + '/' + page.file;
      return `<a href="${href}" lang="${code}" hreflang="${code}"${code === language ? ' aria-current="page"' : ''}>${label}</a>`;
    })
    .join('');
  return `<nav class="language-switch" aria-label="${escapeHtml(dictionary['shared.language_label'])}">${links}</nav>`;
}

function renderPage(page, language) {
  const dictionary = require('../content/' + language + '.json');
  const header = readTemplate('partials/header').replace(
    /<nav id="navigation"[\s\S]*?<\/nav>/,
    (nav) =>
      nav.replace(
        `href="${page.file}"`,
        `href="${page.file}" aria-current="page"`,
      ),
  );
  const bandPath = path.join(
    templates,
    'partials/language-band.' + language + '.html',
  );
  const parts = {
    lang: language,
    header,
    footer: readTemplate('partials/footer'),
    copy_email: readTemplate('partials/copy-email'),
    captcha: readTemplate('partials/captcha'),
    inquiry_success: readTemplate('partials/inquiry-success'),
    recaptcha_site_key: escapeHtml(process.env.SITE_RECAPTCHA_KEY || ''),
    closing: readTemplate('partials/closing'),
    body: readTemplate('pages/' + page.id),
    language_switch: languageLinks(page, language, dictionary),
    language_band: fs.existsSync(bandPath)
      ? fs.readFileSync(bandPath, 'utf8')
      : '',
  };
  let html = readTemplate('layout');
  // Expand structural partials before rendering escaped content values.
  for (let depth = 0; depth < 4; depth++) {
    html = html.replace(
      /\{\{([a-z_]+)\}\}/g,
      (match, key) => parts[key] ?? match,
    );
  }
  html = html.replace(/\{\{t:([\w.]+)\}\}/g, (_, key) => {
    const resolved = key.replace(/^page\./, page.id + '.');
    if (!Object.hasOwn(dictionary, resolved))
      throw new Error(`Missing ${language} translation: ${resolved}`);
    // Existing text includes a few HTML entities; decode those before escaping once.
    return escapeHtml(
      dictionary[resolved]
        .replace(/&amp;/g, '&')
        .replace(/\{\{year\}\}/g, String(new Date().getFullYear())),
    );
  });
  if (/\{\{/.test(html))
    throw new Error('Unresolved template token in ' + page.id);
  if (language !== 'en') {
    html = html.replace(
      /(href|src)="(style\.css|main\.js|forms\.js|assets\/[^"#]+)"/g,
      '$1="../$2"',
    );
  }
  const alternates = Object.keys(config.languages)
    .map(
      (code) =>
        `<link rel="alternate" hreflang="${code}" href="${pageUrl(page, code)}">`,
    )
    .join('');
  const title = escapeHtml(dictionary[`${page.id}.meta_title`]);
  const description = escapeHtml(dictionary[`${page.id}.meta_description`]);
  const url = pageUrl(page, language);
  const image = `${origin}/assets/social-preview.png`;
  const locales = { en: 'en_US', ru: 'ru_RU', uz: 'uz_UZ', es: 'es_ES' };
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: `${origin}/`,
        name: 'Kamilla Akhmedova',
        inLanguage: Object.keys(config.languages),
      },
      {
        '@type': 'Person',
        '@id': `${origin}/#person`,
        name: 'Kamilla Akhmedova',
        url: `${origin}/about.html`,
        image: `${origin}/assets/kamilla-akhmedova.jpg`,
        sameAs: [
          'https://www.linkedin.com/in/kamilla-bonu-akhmedova-300671125/',
        ],
      },
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: dictionary[`${page.id}.meta_title`],
        description: dictionary[`${page.id}.meta_description`],
        inLanguage: language,
        isPartOf: { '@id': `${origin}/#website` },
        about: { '@id': `${origin}/#person` },
      },
    ],
  };
  const metadata = `
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="x-default" href="${pageUrl(page, 'en')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kamilla Akhmedova">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${locales[language]}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(dictionary['shared.social_image_alt'])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${escapeHtml(dictionary['shared.social_image_alt'])}">
<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>
`;
  return html.replace('</head>', alternates + metadata + '</head>');
}

module.exports = { renderPage };
