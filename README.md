# Kamilla Akhmedova website

Static website in English, Russian, Uzbek and Spanish, using HTML templates, CSS and vanilla JavaScript. Prettier and ESLint are development tools; the website has no runtime npm dependencies. Fonts load from Google Fonts.

## Build and verify

Requires Node.js 20.19+, 22.13+, or 24+ (Node.js 24 recommended). Run from this folder:

```sh
npm ci
npm run verify
```

The build writes all 24 pages and supporting files into `dist/`. Commit source and generated output. Edit source files; rebuilding replaces generated files in `dist/`.

## Local live preview

In WebStorm's terminal, run:

```sh
npm run dev
```

Open http://127.0.0.1:3000 in your browser (use the address printed in the terminal if port 3000 is busy). Keep the command running while you edit. Saving files under `src/` or `assets/` rebuilds the site and refreshes connected browsers automatically. Build-script changes also trigger a rebuild. Build errors appear in the terminal; fix the error and save to retry. Press Ctrl+C to stop.

The preview uses Browsersync, serves only `dist/`, and listens on your computer only. Live-reload code is added to preview responses and is never written into published files. Restart the command after changing `scripts/dev.cjs` or installing dependencies.

## Formatting and linting

- `npm run format`: format source files and project documentation with Prettier.
- `npm run format:check`: check formatting without changing files.
- `npm run lint`: check browser and Node.js code with ESLint's recommended rules.
- `npm run verify`: check formatting, lint JavaScript, build the site, then run the existing site checks.
- `npm run build`: generate the website without running the other checks.

Run `npm run format` after editing, then `npm run verify` before deploying. Generated `dist/`, images, hosting settings and editor settings are excluded from formatting and linting. Commit `package-lock.json` to keep tool versions reproducible; `node_modules/` stays local. Tool settings live in `.prettierrc.json`, `.prettierignore` and `eslint.config.cjs`.

## Where to edit

- `src/content/site.json`: page IDs, filenames and supported languages.
- `src/content/en.json`, `ru.json`, `uz.json`, `es.json`: text, email links and metadata by stable key.
- `src/templates/layout.html`: shared document structure.
- `src/templates/partials/`: header, footer, closing section and language bands.
- `src/templates/pages/`: individual page structures.
- `src/lib/render.cjs`: template renderer and localized URL handling.
- `src/styles/site.css`: consolidated styles, responsive layouts and accessibility rules.
- `src/scripts/navigation.js`: mobile menu behavior.
- `scripts/build.cjs`: static build.
- `scripts/dev.cjs`: local preview, automatic rebuilds and browser refresh.
- `scripts/check.cjs`: translation, output, link, anchor and image-description checks.
- `assets/`: original web assets; see PHOTO-CREDITS.md.
- `dist/`: deployable website.

## Content and translations

Templates reference stable keys such as `{{t:home.a_clearer_path_to}}`. Update that key in each language file. English wording can change without breaking Russian or Uzbek. New keys must exist in all languages; missing keys fail the build. Values are escaped, so HTML markup belongs in templates.

Shared partials are reused across pages. Language links preserve the current page. English pages live at the root, Russian under `ru/`, Uzbek under `uz/`, and Spanish under `es/`. External official resources retain their own language. Website translations are separate from Kamilla's confirmed spoken languages (English, Russian and Uzbek).

## Hosting

Any static host can serve `dist/`. The existing Sites project is identified in `.openai/hosting.json`. Pushing to GitHub does not automatically deploy the Sites version.

## Contact and privacy

Contact links open visitors' phone/email apps. The Contact page also has separate Netlify Forms named `client-inquiry` and `aide-inquiry`, shared across all four website languages. Each submission includes the website language. The forms collect initial contact details, program or aide role, preferred language and borough. They do not request documents or medical records. The homepage welcome is draft copy for Kamilla to review.

In Netlify, enable Forms > Enable form detection before deploying these forms. After deployment, verify both form names appear in Forms. Configure email notifications for each form under its notification settings if Kamilla should receive submissions at `kamillaturob@gmail.com`. Submissions can also be reviewed in the Netlify dashboard. See https://docs.netlify.com/manage/forms/setup/ and https://docs.netlify.com/manage/forms/notifications/.

The local `npm run dev` server previews the forms but does not process submissions. On Netlify, JavaScript displays translated pending, success and error messages. If JavaScript is unavailable, the HTML forms use Netlify's standard submission flow. Verify reception in Netlify after deployment before treating submission handling as operational.
