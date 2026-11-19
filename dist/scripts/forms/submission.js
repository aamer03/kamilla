import { createResumeUpload } from './resume.js';
import { createFormValidation } from './validation.js';
export function initializeInquiryForm(
  form,
  captcha,
  { browser = window, Data = FormData, send = fetch } = {},
) {
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const fields = form.querySelector('[data-inquiry-fields]');
  const confirmation = form.querySelector('[data-inquiry-success]');
  let inquirySent = false;
  const validate = createFormValidation(form);
  const upload = createResumeUpload(form, status, { browser, Data, send });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled || inquirySent) return;
    validate();
    upload.validate();
    if (!form.reportValidity()) return;
    if (!captcha.getResponse(form)) {
      status.textContent = form.dataset.captchaRequired;
      status.dataset.error = 'true';
      status.focus();
      return;
    }

    const buttonLabel = button.textContent;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), upload.timeout);
    button.disabled = true;
    button.textContent = form.dataset.sending;
    form.setAttribute('aria-busy', 'true');
    status.textContent = form.dataset.sending;
    status.removeAttribute('data-error');
    let failureMessage = form.dataset.error;
    upload.setBusy(true);

    try {
      upload.prepare();
      const data = new Data(form);
      const captchaResponse = captcha.getResponse(form);
      if (!captchaResponse) {
        failureMessage = form.dataset.captchaRequired;
        throw new Error('Verification expired');
      }
      data.set('g-recaptcha-response', captchaResponse);
      const response = await send('/', {
        method: 'POST',
        // Only a private storage reference goes to Netlify Forms, never the file.
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Submission was not accepted');

      inquirySent = true;
      fields.hidden = true;
      confirmation.hidden = false;
      form.removeAttribute('aria-labelledby');
      form.removeAttribute('aria-describedby');
      form.setAttribute('aria-label', confirmation.getAttribute('aria-label'));
      confirmation.focus();
      if (upload.hasFile()) await upload.upload();
      else form.reset();
    } catch {
      captcha.reset(form);
      status.textContent = failureMessage;
      status.dataset.error = 'true';
      button.disabled = false;
    } finally {
      clearTimeout(timeout);
      button.textContent = buttonLabel;
      form.removeAttribute('aria-busy');
      upload.setBusy(false);
      if (!inquirySent) status.focus();
    }
  });
}
