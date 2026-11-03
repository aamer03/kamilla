# Kamilla Akhmedova website

A responsive six-page website built with HTML, CSS, and vanilla JavaScript. No npm dependencies are required. Fonts load from Google Fonts.

## Build and check

Requires Node.js 18 or newer.

```sh
npm run build
npm run check
```

The complete deployable website is in `dist/`. Any static web host can serve that directory.

## Editing

- `build.cjs`: page content, navigation, shared header and footer.
- `base.css`: base blue-and-green design.
- `accessibility.css`: responsive layouts, readable typography, focus indicators, and accessibility overrides.
- `navigation.js`: progressively enhanced mobile menu.
- `check.cjs`: verifies local page links and referenced assets.
- `translations.cjs`: Russian and Uzbek translations keyed to English source text.
- `localize.cjs`: generates language pages and language-switching links. English is in `dist/`, Russian in `dist/ru/`, and Uzbek in `dist/uz/`. Official external resource pages retain their own language.

Run the build after editing source files. The build regenerates HTML, JavaScript, and the combined stylesheet in `dist/`. Commit both source and generated output.

## Hosting

The existing hosted site is managed through Sites; `.openai/hosting.json` identifies that project. Pushing this GitHub repository does not automatically redeploy the Sites version. Publishing to another host requires configuring that host separately.

## Contact and privacy

Contact and appointment buttons use phone/email links. There is no form backend, booking service, analytics, or application database.
