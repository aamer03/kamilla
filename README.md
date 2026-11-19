# Kamilla Akhmedova website

Static website in English, Russian, Uzbek and Spanish, using HTML templates, CSS and vanilla JavaScript. Prettier and ESLint are development tools; the private upload functions use @netlify/blobs at runtime. Fonts load from Google Fonts.

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

Contact links open visitors' phone/email apps. The Contact page also has separate Netlify Forms named `client-inquiry` and `aide-inquiry`, shared across all four website languages. Each submission includes the website language. The forms collect initial contact details, program or aide role, preferred language and borough. The aide form also accepts optional comments and a résumé (PDF, DOC or DOCX, up to 4 MB). Medical records and identity documents should not be submitted. File type and size checks in the browser are usability checks, not server-side security enforcement. Résumés go through `/api/resume-upload` to the private `private-resumes` Netlify Blobs store; only an opaque `resume-reference` is submitted to Netlify Forms. There is no public download endpoint. The handler checks request origin, upload header, bounded body size, extension, MIME type and file signatures, and configures a ten-per-minute IP/domain rate limit. These checks are not antivirus scanning; treat downloaded documents as untrusted. The homepage welcome is draft copy for Kamilla to review.

In Netlify, enable Forms > Enable form detection before deploying these forms. After deployment, verify both form names appear in Forms. Configure email notifications for each form under its notification settings if Kamilla should receive submissions at `kamillaturob@gmail.com`. Submissions can also be reviewed in the Netlify dashboard. See https://docs.netlify.com/manage/forms/setup/ and https://docs.netlify.com/manage/forms/notifications/.

The local `npm run dev` server previews the forms but does not process submissions. On Netlify, JavaScript displays translated pending, success and error messages. If JavaScript is unavailable, the HTML forms use Netlify's standard submission flow. Verify reception in Netlify after deployment before treating submission handling as operational.

## Private résumé storage

`netlify.toml` configures the function directory and static build. Netlify supplies Blobs credentials to Functions; no storage token belongs in browser code or the repository. Deploy the complete project through Netlify Git integration (uploading only `dist/` will not deploy the function).

Match the inquiry’s `resume-reference` to its key in Netlify **Data & Storage > Blobs > private-resumes**. Only authorized Netlify project members should retrieve/delete résumés. If the dashboard does not offer downloads, use authenticated Netlify CLI: `netlify blobs:get private-resumes REFERENCE --output resume.pdf` (use the original file extension). Do not add a public file-serving route or put résumés in `dist/`. Limit project membership and enable account MFA.

Agree a retention period with Kamilla and delete both submissions and matching blobs when no longer needed. Failed/abandoned inquiries and removed previously uploaded files can leave unlinked blobs; include those in cleanup. No automatic retention policy or malware scanner is configured. The default local preview does not execute Functions; use Netlify Dev or a deploy preview to verify actual uploads and rate-limit enforcement with a disposable test document. If upload fails, the visitor can remove the résumé and submit the text inquiry. With JavaScript disabled, attachments stay disabled. The CAPTCHA requires JavaScript; visitors can use the phone/email contact options instead.

## CAPTCHA setup

Both inquiry forms use custom reCAPTCHA v2 checkbox widgets because Netlify permits only one of its automatically supplied challenges per page. Register `kamillaadvocacy.com` and `kamilla-a.netlify.app` with Google reCAPTCHA v2 (checkbox). Add `localhost` only if testing via Netlify Dev. In Netlify project environment variables, set `SITE_RECAPTCHA_KEY` to the public site key (Builds and Runtime scopes), and `SITE_RECAPTCHA_SECRET` to the private secret (Runtime scope). Never commit the secret. Rebuild/redeploy after setting keys: only the public key is embedded into the HTML. No keys means a visible verification-unavailable notice and no JavaScript form submission. Netlify validates `g-recaptcha-response` server-side on both forms. Test both form types on the deployed site; résumé uploads additionally require a short-lived permit from the signed, verified form event.

## Verified upload flow and thank-you state

The browser generates a random upload token and reference, submits the inquiry through Netlify Forms with CAPTCHA, and displays the thank-you panel. The event-only `verified-inquiry.mjs` handler subscribes to `formSubmitted`; Netlify verifies event signatures before invocation. Only verified inquiries can create a 15-minute permit in `resume-upload-permits`. The permit stores a SHA-256 hash of the token, not its plaintext value. No new secret or second CAPTCHA is required.

The upload endpoint checks the permit before reading the file, applies the existing content/size checks, and atomically writes only if the reference is new. Retries cannot overwrite a file. The browser waits briefly for the verification event, then offers an attachment-only retry if needed; it never resubmits the inquiry. A spam-classified inquiry cannot authorize upload until it is verified. Permit metadata and résumés remain private. Include expired permits in the eventual retention/cleanup policy.

Deploy preview checks: confirm `verified-inquiry` is registered as an event function, a real CAPTCHA-verified aide inquiry creates its permit, the file uploads under the matching reference, and direct upload requests without permits fail. Test this on Netlify before releasing; the basic static preview does not emulate platform events.

## Search and sharing metadata

The canonical production URL lives in `src/content/site.json`. The build generates canonical and absolute hreflang URLs, Open Graph and social card tags, Person/WebSite/WebPage structured data, `dist/sitemap.xml`, and `dist/robots.txt`. `assets/social-preview.png` is the shared 1200×630 image. The index.html URLs canonicalize to each language directory. Submit `https://kamillaadvocacy.com/sitemap.xml` in Google Search Console after deployment; metadata does not guarantee a search ranking.
