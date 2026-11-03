# Kamilla Akhmedova website

Static website in English, Russian and Uzbek, using HTML templates, CSS and vanilla JavaScript. No npm dependencies. Fonts load from Google Fonts.

## Build and verify

Requires Node.js 18 or newer. Run from this folder:

```sh
npm run build
npm run check
```

The build writes all 18 pages and supporting files into `dist/`. Commit source and generated output. Edit source files; rebuilding replaces generated files in `dist/`.

## Where to edit

- `src/content/site.json`: page IDs, filenames and supported languages.
- `src/content/en.json`, `ru.json`, `uz.json`: text, email links and metadata by stable key.
- `src/templates/layout.html`: shared document structure.
- `src/templates/partials/`: header, footer, closing section and language bands.
- `src/templates/pages/`: individual page structures.
- `src/lib/render.cjs`: template renderer and localized URL handling.
- `src/styles/site.css`: consolidated styles, responsive layouts and accessibility rules.
- `src/scripts/navigation.js`: mobile menu behavior.
- `scripts/build.cjs`: static build.
- `scripts/check.cjs`: translation, output, link, anchor and image-description checks.
- `assets/`: original web assets; see PHOTO-CREDITS.md.
- `dist/`: deployable website.

## Content and translations

Templates reference stable keys such as `{{t:home.a_clearer_path_to}}`. Update that key in each language file. English wording can change without breaking Russian or Uzbek. New keys must exist in all languages; missing keys fail the build. Values are escaped, so HTML markup belongs in templates.

Shared partials are reused across pages. Language links preserve the current page. English pages live at the root, Russian under `ru/`, and Uzbek under `uz/`. External official resources retain their own language.

## Hosting

Any static host can serve `dist/`. The existing Sites project is identified in `.openai/hosting.json`. Pushing to GitHub does not automatically deploy the Sites version.

## Contact and privacy

Contact links open visitors' phone/email apps. There is no inquiry backend, booking service, analytics or application database. The homepage welcome is draft copy for Kamilla to review.
