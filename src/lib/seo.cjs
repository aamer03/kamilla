const config = require('../content/site.json');
const { escapeHtml } = require('./html.cjs');
const origin = config.url;

function pageUrl(page, language) {
  const directory = language === 'en' ? '' : `${language}/`;
  return `${origin}/${directory}${page.file === 'index.html' ? '' : page.file}`;
}

function sitemap() {
  const languages = Object.keys(config.languages);
  const entries = config.pages
    .filter((page) => page.indexable !== false)
    .flatMap((page) =>
      languages.map((language) => {
        const alternates = languages
          .map(
            (code) =>
              `    <xhtml:link rel="alternate" hreflang="${code}" href="${pageUrl(page, code)}"/>`,
          )
          .join('\n');
        return `  <url>\n    <loc>${pageUrl(page, language)}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(page, 'en')}"/>\n  </url>`;
      }),
    );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}

function renderMetadata(page, language, dictionary) {
  if (page.indexable === false)
    return '<meta name="robots" content="noindex, follow">';
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

  return alternates + metadata;
}

module.exports = { origin, pageUrl, sitemap, renderMetadata };
