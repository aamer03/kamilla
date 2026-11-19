const config = require('../content/site.json');
const origin = config.url;

function pageUrl(page, language) {
  const directory = language === 'en' ? '' : `${language}/`;
  return `${origin}/${directory}${page.file === 'index.html' ? '' : page.file}`;
}

function sitemap() {
  const languages = Object.keys(config.languages);
  const entries = config.pages.flatMap((page) =>
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

module.exports = { origin, pageUrl, sitemap };
